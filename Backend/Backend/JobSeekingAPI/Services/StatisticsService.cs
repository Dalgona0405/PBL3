using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;

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
            var now = DateTime.Now;
            
            // 1. Tính toán các con số tổng quát
            var totalJobs = await _context.Jobs.CountAsync(j => j.DeletedAt == null);
            var totalCandidates = await _context.Candidates.CountAsync();

            // 2. Thống kê Job theo Level (Biểu đồ tròn)
            var jobByDept = await _context.Jobs
                .Where(j => j.DeletedAt == null)
                .GroupBy(j => j.Level)
                .Select(g => new SimpleStatDTO { Label = g.Key ?? "N/A", Value = g.Count() })
                .ToListAsync();

            // 3. Xu hướng tuyển dụng (5:10:...)
            var rawTrends = await _context.Jobs
                .Where(j => j.DeletedAt == null)
                .GroupBy(j => j.PostedDate.Year)
                .Select(g => new { Year = g.Key, Count = g.Count() })
                .OrderBy(x => x.Year).ToListAsync();

            var hiringTrends = rawTrends.Select(t => new TrendStatDTO { 
                Period = t.Year.ToString(), 
                Actual = t.Count 
            }).ToList();

            // 4. Dự báo cho năm tiếp theo
            if (rawTrends.Any()) {
                var last = rawTrends.Last();
                hiringTrends.Add(new TrendStatDTO {
                    Period = (last.Year + 1).ToString() + " (Dự báo)",
                    Forecast = (int)(last.Count * 1.15)
                });
            }

            // 5. Trình làng kết quả cuối cùng - CHỈ DÙNG 1 LỆNH RETURN Ở ĐÂY
            return new DashboardSummaryDTO
            {
                TotalJobs = totalJobs,
                TotalCandidates = totalCandidates,
                TotalCompanies = await _context.Companies.CountAsync(c => c.DeletedAt == null),
                TotalRecruiters = await _context.Recruiters.CountAsync(),
                
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

                JobByDept = jobByDept,
                HiringTrends = hiringTrends,
                ApplicationRate = totalJobs > 0 ? Math.Round((double)totalCandidates / totalJobs, 2) : 0,
                LastUpdated = now
            };
        }
    }   
}