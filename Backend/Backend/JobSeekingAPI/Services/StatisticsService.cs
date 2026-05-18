using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using Microsoft.EntityFrameworkCore;

namespace JobSeekingAPI.Services
{
    public interface IStatisticsService {
        Task<DashboardSummaryDTO> GetDashboardStatsAsync();
    }

    public class StatisticsService : IStatisticsService
    {
        private readonly ApplicationDbContext _context;
        public StatisticsService(ApplicationDbContext context) => _context = context;

        public async Task<DashboardSummaryDTO> GetDashboardStatsAsync()
        {
            var now = DateTime.UtcNow;
            
            // 1. Tính toán các con số tổng quát
            var totalJobs = await _context.Jobs.CountAsync(j => j.DeletedAt == null);
            var totalCandidates = await _context.Candidates.CountAsync();

            // Tái sử dụng query lọc Job đang tuyển
            var activeJobsQuery = _context.Jobs
                .Where(j => j.DeletedAt == null && j.Status == 1 && (j.Deadline == null || j.Deadline >= now));

            var activeHiringCompanies = await activeJobsQuery.Select(j => j.CompanyId).Distinct().CountAsync();
            var activeIndustries = await _context.JobTags
                .Where(jt => jt.Job != null && jt.Job.DeletedAt == null && jt.Job.Status == 1 && (jt.Job.Deadline == null || jt.Job.Deadline >= now))
                .Select(jt => jt.TagId).Distinct().CountAsync();

            // =========================================================
            // LỌC BIỂU ĐỒ LƯƠNG THEO QUY TẮC MỚI CỦA BẠN
            // =========================================================
            var salaries = await activeJobsQuery
                .Select(j => new { j.SalaryMin, j.SalaryMax })
                .ToListAsync();

            int rangeUnder10 = 0, range10To20 = 0, range20To30 = 0, range30To50 = 0, rangeOver50 = 0, negotiable = 0;
            
            foreach (var s in salaries)
            {
                decimal min = s.SalaryMin ?? 0;
                decimal max = s.SalaryMax ?? 0;

                // 1. Lương thỏa thuận: Lấy phần bằng 0 cả 2
                if (min == 0 && max == 0)
                {
                    negotiable++;
                    continue; // Bỏ qua, chuyển sang Job tiếp theo
                }

                // 2. Xét mức lương đại diện để đưa vào các mốc
                decimal referenceSalary = 0;

                if (min > 0 && max > 0) 
                {
                    referenceSalary = (min + max) / 2; // Cả 2 cùng có -> Lấy trung bình
                }
                else if (min == 0 && max > 0) 
                {
                    referenceSalary = max; // Min bằng 0, Max không bằng 0 -> Lấy Max
                }
                else if (min > 0 && max == 0) 
                {
                    referenceSalary = min; // Max bằng 0, Min không bằng 0 -> Lấy Min
                }

                // 3. Phân chia vào các nhóm dựa trên mức lương đại diện (Giả định DB lưu VNĐ đầy đủ)
                if (referenceSalary < 10) rangeUnder10++;
                else if (referenceSalary >= 10 && referenceSalary < 20) range10To20++;
                else if (referenceSalary >= 20 && referenceSalary < 30) range20To30++;
                else if (referenceSalary >= 30 && referenceSalary <= 50) range30To50++;
                else if (referenceSalary > 50) rangeOver50++;
            }

            var salaryChartData = new List<SimpleStatDTO>
            {
                new SimpleStatDTO { Label = "Lương thỏa thuận", Value = negotiable },
                new SimpleStatDTO { Label = "Dưới 10 Triệu", Value = rangeUnder10 },
                new SimpleStatDTO { Label = "10 - 20 Triệu", Value = range10To20 },
                new SimpleStatDTO { Label = "20 - 30 Triệu", Value = range20To30 },
                new SimpleStatDTO { Label = "30 - 50 Triệu", Value = range30To50 },
                new SimpleStatDTO { Label = "Trên 50 Triệu", Value = rangeOver50 }
            };

            // =========================================================
            // CÁC THỐNG KÊ KHÁC GIỮ NGUYÊN
            // =========================================================

            // Thống kê Job theo Level (Biểu đồ tròn)
            var jobByDept = await _context.Jobs
                .Where(j => j.DeletedAt == null)
                .GroupBy(j => j.Level)
                .Select(g => new SimpleStatDTO { Label = g.Key ?? "N/A", Value = g.Count() })
                .ToListAsync();

            // Xu hướng tuyển dụng (5:10:...)
            var rawTrends = await _context.Jobs
                .Where(j => j.DeletedAt == null)
                .GroupBy(j => j.PostedDate.Year)
                .Select(g => new { Year = g.Key, Count = g.Count() })
                .OrderBy(x => x.Year).ToListAsync();

            var hiringTrends = rawTrends.Select(t => new TrendStatDTO { 
                Period = t.Year.ToString(), Actual = t.Count 
            }).ToList();

            // Dự báo cho năm tiếp theo (Giả sử tăng trưởng 15% so với năm trước)
            if (rawTrends.Any()) {
                var last = rawTrends.Last();
                hiringTrends.Add(new TrendStatDTO {
                    Period = (last.Year + 1).ToString() + " (Dự báo)",
                    Forecast = (int)(last.Count * 1.15)
                });
            }

            // GÓI GỌN VÀO 3 NHÓM ĐỂ TRẢ VỀ
            return new DashboardSummaryDTO
            {
                Overview = new DashboardOverviewStatsDTO
                {
                    TotalJobs = totalJobs,
                    TotalCandidates = totalCandidates,
                    TotalCompanies = await _context.Companies.CountAsync(c => c.DeletedAt == null),
                    TotalRecruiters = await _context.Recruiters.CountAsync(),
                    TotalActiveHiringCompanies = activeHiringCompanies,
                    TotalActiveIndustries = activeIndustries,
                    ApplicationRate = totalJobs > 0 ? Math.Round((double)totalCandidates / totalJobs, 2) : 0
                },
                Charts = new DashboardChartsDTO
                {
                    SalaryRanges = salaryChartData,
                    JobByDept = jobByDept,
                    HiringTrends = hiringTrends
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
                        await activeJobsQuery.CountAsync(), 
                        await _context.Jobs.CountAsync(j => j.DeletedAt == null && j.Deadline < now),
                        totalJobs
                    )
                },
                LastUpdated = now
            };
        }
    }   
}