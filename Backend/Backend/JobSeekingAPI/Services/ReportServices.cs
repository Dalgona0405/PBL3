using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Controllers;
namespace JobSeekingAPI.Services
{
    public class ReportService : IReportService
    {
        private readonly ApplicationDbContext _context;

        public ReportService(ApplicationDbContext context)
        {
            _context = context;
        }
        
        // 1. MARKET TREND: Kéo dữ liệu đếm về RAM rồi mới chia phần trăm
        public async Task<List<MarketTrendDTO>> GetMarketTrendAsync(int limit)
        {
            var totalJobs = await _context.Jobs.CountAsync(j => j.DeletedAt == null);
            if (totalJobs == 0) return new List<MarketTrendDTO>();

            // Bước 1: Kéo data thô từ DB (EF Core dịch cực dễ)
            var rawTags = await _context.Tags
                .Select(t => new {
                    t.TagName,
                    JobCount = t.JobTags.Count()
                })
                .OrderByDescending(x => x.JobCount)
                .Take(limit)
                .ToListAsync(); // <--- Cắt đứt lệnh SQL tại đây

            // Bước 2: Map sang DTO và dùng Math.Round trên RAM của C#
            return rawTags.Select(t => new MarketTrendDTO (
                t.TagName,
                t.JobCount,
                totalJobs > 0 ? Math.Round((double)t.JobCount / totalJobs * 100, 2) : 0
            )).ToList();
        }

        // 2. SALARY BY LOCATION: Tính Average thô ở DB, Round ở RAM
        public async Task<List<SalaryReportDTO>> GetSalaryByLocationAsync()
        {
            // Bước 1: Kéo data thô
            var rawSalaries = await _context.Jobs
                .Where(j => j.DeletedAt == null && j.Location != null && (j.SalaryMin > 0 || j.SalaryMax > 0))
                .GroupBy(j => j.Location!.LocationName)
                .Select(g => new {
                    LocationName = g.Key,
                    AvgMin = g.Average(j => (decimal?)j.SalaryMin),
                    AvgMax = g.Average(j => (decimal?)j.SalaryMax),
                    JobCount = g.Count()
                })
                .ToListAsync(); // <--- Kéo về RAM

            // Bước 2: Dùng Math.Round và map DTO
            return rawSalaries
                .Select(g => new SalaryReportDTO(
                    g.LocationName,
                    Math.Round(g.AvgMin ?? 0, 0),
                    Math.Round(g.AvgMax ?? 0, 0),
                    g.JobCount
                ))
                .OrderByDescending(x => x.AverageMaxSalary)
                .ToList();
        }

        // 3. TOP COMPANIES: Tách gọn câu LINQ khổng lồ
        public async Task<List<TopCompanyDTO>> GetTopCompaniesAsync(int limit)
        {
            // Bước 1: Chỉ lấy các số liệu Count, Sum, Average căn bản từ DB
            var rawCompanies = await _context.Companies
                .Where(c => c.DeletedAt == null)
                .Select(c => new {
                    c.CompanyId,
                    c.CompanyName,
                    c.LogoImg,
                    JobCount = c.Jobs.Count(j => j.DeletedAt == null),
                    AppCount = c.Jobs.SelectMany(j => j.Applications).Count(a => a.DeletedAt == null),
                    ViewCount = c.Jobs.Where(j => j.DeletedAt == null).Sum(j => (int?)j.ViewCount),
                    AvgSalary = c.Jobs.Where(j => j.DeletedAt == null && (j.SalaryMin > 0 || j.SalaryMax > 0))
                                    .Average(j => (decimal?)((j.SalaryMin + j.SalaryMax) / 2)),
                    LatestJobDate = c.Jobs.Where(j => j.DeletedAt == null).Max(j => (DateTime?)j.PostedDate)
                })
                .OrderByDescending(c => c.JobCount)
                .Take(limit)
                .ToListAsync(); // <--- Ép chạy SQL tại đây

            // Bước 2: Đẩy vào DTO an toàn
            return rawCompanies.Select(c => new TopCompanyDTO(
                c.CompanyId,
                c.CompanyName,
                c.LogoImg,
                c.JobCount,
                c.AppCount,
                c.ViewCount ?? 0,
                c.AvgSalary ?? 0, 
                c.LatestJobDate
            )).ToList();
        }

        public async Task<object> GetSkillsGraphAsync(int nodeLimit)
        {
            // =========================================================
            // BƯỚC 1: LẤY DANH SÁCH NODES BẰNG ANONYMOUS TYPE (FIX LỖI EF CORE)
            // =========================================================
            var rawNodes = await _context.Tags
                .Select(t => new 
                {
                    t.TagId,
                    t.TagName,
                    t.Type,
                    // Ép EF Core đếm dưới DB và gán thành biến Size
                    Size = t.JobTags.Count() + t.CandidateTags.Count() 
                })
                .OrderByDescending(n => n.Size) // SQL ORDER BY hoạt động trơn tru
                .Take(nodeLimit)
                .ToListAsync(); // <--- Chạy SQL và kéo data về RAM tại đây

            // Ép sang GraphNodeDTO trên RAM (C# code)
            var nodes = rawNodes.Select(t => new GraphNodeDTO(
                t.TagId,
                t.TagName,
                t.Type ?? "Skill",
                t.Size
            )).ToList();

            var nodeIds = nodes.Select(n => n.Id).ToList();

            if (!nodeIds.Any())
            {
                return new { nodes = new List<object>(), edges = new List<object>() };
            }

            // =========================================================
            // BƯỚC 2: LẤY DỮ LIỆU NHÓM KỸ NĂNG THEO TỪNG CÔNG VIỆC
            // =========================================================
            var jobSkillGroups = await _context.JobTags
                .Where(jt => nodeIds.Contains(jt.TagId))
                .GroupBy(jt => jt.JobId)
                .Select(g => g.Select(x => x.TagId).Distinct().ToList())
                .ToListAsync();

            // =========================================================
            // BƯỚC 3: TÍNH TOÁN CÁC CẠNH (EDGES) BẰNG DICTIONARY
            // =========================================================
            var edgeCounts = new Dictionary<(int, int), int>();

            foreach (var tagIds in jobSkillGroups)
            {
                for (int i = 0; i < tagIds.Count; i++)
                {
                    for (int j = i + 1; j < tagIds.Count; j++)
                    {
                        var a = tagIds[i];
                        var b = tagIds[j];

                        var key = a < b ? (a, b) : (b, a);

                        if (edgeCounts.ContainsKey(key))
                            edgeCounts[key]++;
                        else
                            edgeCounts[key] = 1;
                    }
                }
            }

            // =========================================================
            // BƯỚC 4: TỔNG HỢP KẾT QUẢ VÀ TÍNH ĐỘ MẠNH LIÊN KẾT (WEIGHT)
            // =========================================================
            var totalActiveJobs = jobSkillGroups.Count;

            var edges = edgeCounts
                .Select(x => new GraphEdgeDTO(
                    x.Key.Item1,
                    x.Key.Item2,
                    x.Value, 
                    totalActiveJobs > 0 
                        ? Math.Round((double)x.Value / totalActiveJobs * 100, 2) 
                        : 0
                ))
                .OrderByDescending(e => e.Value) 
                .Take(100) 
                .ToList();

            return new { nodes, edges };
        }
        
        public async Task<DashboardSummaryDTO> GetDashboardSummaryAsync()
        {
            var now = DateTime.UtcNow;
            
            // Tính toán trước các thông số để code sạch sẽ hơn
            var totalJobs = await _context.Jobs.CountAsync(j => j.DeletedAt == null);
            var totalCandidates = await _context.Candidates.CountAsync();
            var totalCompanies = await _context.Companies.CountAsync(c => c.DeletedAt == null);
            var totalRecruiters = await _context.Recruiters.CountAsync();

            // Trả về đúng cấu trúc 3 phần đã định nghĩa
            return new DashboardSummaryDTO
            {
                Overview = new DashboardOverviewStatsDTO
                {
                    TotalJobs = totalJobs,
                    TotalCandidates = totalCandidates,
                    TotalCompanies = totalCompanies,
                    TotalRecruiters = totalRecruiters,
                    ApplicationRate = totalJobs > 0 ? Math.Round((double)totalCandidates / totalJobs, 2) : 0
                    // Lưu ý: Các trường TotalActiveHiringCompanies và TotalActiveIndustries
                    // tạm thời sẽ bằng 0 ở đây nếu ReportService không đếm. Bạn có thể thêm logic đếm 
                    // tương tự bên StatisticsService nếu muốn nó hiển thị ở API này.
                },
                FormsAndStatus = new DashboardFormsAndStatusDTO
                {
                    Applications = new ApplicationStatsDTO(
                        await _context.Applications.CountAsync(a => a.DeletedAt == null),
                        await _context.Applications.CountAsync(a => a.AppliedDate >= now.AddDays(-7)),
                        await _context.Applications.CountAsync(a => a.AppliedDate >= now.AddMonths(-1)),
                        await _context.Applications.CountAsync(a => a.AppliedDate.Year == now.Year)
                    ),
                    JobsByStatus = new JobStatusStatsDTO(
                        await _context.Jobs.CountAsync(j => j.DeletedAt == null && j.Status == 1),
                        await _context.Jobs.CountAsync(j => j.DeletedAt == null && j.Deadline < now),
                        totalJobs
                    )
                },
                Charts = new DashboardChartsDTO(), // Khởi tạo rỗng vì hàm này chưa gọi các biểu đồ
                LastUpdated = now
            };
        }

        // Logic: Thống kê tỉ lệ công việc theo Level (Dùng cho biểu đồ Tròn/Pie Chart)
        public async Task<List<SimpleStatDTO>> GetJobDistributionByLevelAsync()
        {
            return await _context.Jobs
                .Where(j => j.DeletedAt == null)
                .GroupBy(j => j.Level)
                .Select(g => new SimpleStatDTO { 
                    Label = g.Key ?? "Chưa phân loại", 
                    Value = g.Count() 
                })
                .ToListAsync();
        }
        // Logic: Dự báo xu hướng qua từng năm (Dùng cho biểu đồ Đường/Line Chart)
        public async Task<List<TrendStatDTO>> GetHiringTrendsAndForecastAsync()
        {
            var history = await _context.Jobs
                .Where(j => j.DeletedAt == null)
                .GroupBy(j => j.PostedDate.Year)
                .Select(g => new { Year = g.Key, Count = g.Count() })
                .OrderBy(x => x.Year)
                .ToListAsync();

            var trends = history.Select(h => new TrendStatDTO {
                Period = h.Year.ToString(),
                Actual = h.Count,
                Forecast = 0 // Hiện tại là thực tế nên forecast = 0
            }).ToList();

            // Thuật toán dự báo đơn giản: Nếu có từ 2 năm dữ liệu trở lên
            if (history.Count >= 2)
            {
                var last = history.Last();
                var prev = history[history.Count - 2];
                
                // Tính tỷ lệ tăng trưởng so với năm ngoái
                double growth = prev.Count > 0 ? (double)last.Count / prev.Count : 1.1;
                
                // Thêm một mốc cho năm tiếp theo (Dự báo)
                trends.Add(new TrendStatDTO {
                    Period = (last.Year + 1).ToString() + " (Dự báo)",
                    Actual = 0, // Năm tương lai chưa có thực tế
                    Forecast = (int)(last.Count * growth)
                });
            }
            return trends;
        }
    }
}