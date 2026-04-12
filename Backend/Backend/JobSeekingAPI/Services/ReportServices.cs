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
        
        public async Task<List<MarketTrendDTO>> GetMarketTrendAsync(int limit)
        {
            var totalJobs = await _context.Jobs.CountAsync(j => j.DeletedAt == null);
            if (totalJobs == 0) return new List<MarketTrendDTO>();

            return await _context.Tags
                .Select(t => new MarketTrendDTO (
                    t.TagName,
                    // t.JobTags.Count(jt => jt.Job != null && jt.Job.DeletedAt == null),
                    t.JobTags.Count(),
                    // Tính toán phần trăm an toàn
                    totalJobs > 0 ? Math.Round((double)t.JobTags.Count(jt => jt.Job != null && jt.Job.DeletedAt == null) / totalJobs * 100, 2) : 0
                ))
                .OrderByDescending(x => x.JobCount) 
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<SalaryReportDTO>> GetSalaryByLocationAsync()
        {
            return await _context.Jobs
                .Where(j => j.DeletedAt == null && j.SalaryMin.HasValue && j.Location != null)
                .GroupBy(j => j.Location!.LocationName)
                .Select(g => new SalaryReportDTO(
                    g.Key,
                    Math.Round(g.Average(j => (decimal?)j.SalaryMin ?? 0), 0),
                    Math.Round(g.Average(j => (decimal?)j.SalaryMax ?? 0), 0),
                    g.Count()
                ))
                .OrderByDescending(x => x.AverageMaxSalary)
                .ToListAsync();
        }

        public async Task<object> GetSkillsGraphAsync(int nodeLimit)
        {
            // Bước 1: Lấy các Nodes (Kỹ năng) có sức ảnh hưởng nhất
            var nodes = await _context.Tags
                .Select(t => new GraphNodeDTO(
                    t.TagId,
                    t.TagName,
                    t.Type ?? "Skill",
                    t.JobTags.Count + t.CandidateTags.Count
                ))
                .OrderByDescending(n => n.Size)
                .Take(nodeLimit)
                .ToListAsync();

            var nodeIds = nodes.Select(n => n.Id).ToList();

            // Bước 2: Lấy dữ liệu các Job và danh sách Tag đi kèm để tính Edges (Cạnh)
            var jobSkillGroups = await _context.JobTags
                .Where(jt => nodeIds.Contains(jt.TagId))
                .GroupBy(jt => jt.JobId)
                .Select(g => g.Select(jt => jt.TagId).ToList())
                .ToListAsync();

            var edges = new List<GraphEdgeDTO>();
            // Thuật toán Graph AI: Tìm sự tương quan giữa các cặp kỹ năng
            for (int i = 0; i < nodes.Count; i++)
            {
                for (int j = i + 1; j < nodes.Count; j++)
                {
                    int weight = jobSkillGroups.Count(g => g.Contains(nodes[i].Id) && g.Contains(nodes[j].Id));
                    if (weight > 0)
                    {
                        edges.Add(new GraphEdgeDTO(
                            nodes[i].Id, 
                            nodes[j].Id, 
                            weight, 
                            Math.Round((double)weight / jobSkillGroups.Count, 4) // Độ mạnh liên kết
                        ));
                    }
                }
            }
            return new { nodes, edges };
        }

        public async Task<DashboardSummaryDTO> GetDashboardSummaryAsync()
        {
            var now = DateTime.Now;
            
            // Tính toán trước các thông số để code sạch sẽ hơn
            var totalJobs = await _context.Jobs.CountAsync(j => j.DeletedAt == null);
            var totalCandidates = await _context.Candidates.CountAsync();
            var totalCompanies = await _context.Companies.CountAsync(c => c.DeletedAt == null);
            var totalRecruiters = await _context.Recruiters.CountAsync();

            return new DashboardSummaryDTO
            {
                TotalJobs = totalJobs,
                TotalCandidates = totalCandidates,
                TotalCompanies = totalCompanies,
                TotalRecruiters = totalRecruiters,
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
                ),
                ApplicationRate = totalJobs > 0 ? Math.Round((double)totalCandidates / totalJobs, 2) : 0,
                LastUpdated = now
            };
        }

        public async Task<List<TopCompanyDTO>> GetTopCompaniesAsync(int limit) // tránh tình trạng lỗi lệch cột
        {
            return await _context.Companies
            .Where(c => c.DeletedAt == null)
            .Select(c => new TopCompanyDTO(
                c.CompanyId,
                c.CompanyName,
                c.LogoImg,
                c.Jobs.Count(j => j.DeletedAt == null),
                c.Jobs.SelectMany(j => j.Applications).Count(a => a.DeletedAt == null),
                c.Jobs.Sum(j => j.ViewCount ?? 0),
                // ✅ Tính AvgSalary an toàn: Tránh lỗi khi không có Job
                c.Jobs.Any(j => j.DeletedAt == null && j.SalaryMin.HasValue)? c.Jobs.Where(j => j.DeletedAt == null && j.SalaryMin.HasValue).Average(j => (j.SalaryMin + j.SalaryMax) / 2) ?? 0 : 0,
                // ✅ Lấy LatestJobDate an toàn: Ép kiểu nullable DateTime để tránh lỗi rỗng
                c.Jobs.Where(j => j.DeletedAt == null).Max(j => (DateTime?)j.PostedDate)
            ))
                .OrderByDescending(c => c.JobCount)
                .Take(limit)
                .ToListAsync();
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