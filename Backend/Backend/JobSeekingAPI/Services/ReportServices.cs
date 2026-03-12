using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;

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
                .Where(t => t.JobTags.Any(jt => jt.Job != null && jt.Job.DeletedAt == null))
                .Select(t => new MarketTrendDTO(
                    t.TagName,
                    t.JobTags.Count(jt => jt.Job != null && jt.Job.DeletedAt == null),
                    Math.Round((double)t.JobTags.Count(jt => jt.Job != null && jt.Job.DeletedAt == null) / totalJobs * 100, 2)
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
                    Math.Round(g.Average(j => j.SalaryMin ?? 0), 0),
                    Math.Round(g.Average(j => j.SalaryMax ?? 0), 0),
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
            return new DashboardSummaryDTO(
                await _context.Jobs.CountAsync(j => j.DeletedAt == null),
                await _context.Candidates.CountAsync(),
                await _context.Companies.CountAsync(c => c.DeletedAt == null),
                await _context.Recruiters.CountAsync(),
                new ApplicationStatsDTO(
                    await _context.Applications.CountAsync(a => a.DeletedAt == null),
                    await _context.Applications.CountAsync(a => a.AppliedDate >= now.AddDays(-7)),
                    await _context.Applications.CountAsync(a => a.AppliedDate >= now.AddMonths(-1)),
                    await _context.Applications.CountAsync(a => a.AppliedDate.Year == now.Year)
                ),
                new JobStatusStatsDTO(
                    await _context.Jobs.CountAsync(j => j.DeletedAt == null && j.Status == 1),
                    await _context.Jobs.CountAsync(j => j.DeletedAt == null && j.Deadline < now),
                    await _context.Jobs.CountAsync(j => j.DeletedAt == null)
                ),
                0, // Tỷ lệ này có thể tính thêm dựa trên hồ sơ/tin tuyển dụng
                DateTime.Now
            );
        }

        public async Task<List<TopCompanyDTO>> GetTopCompaniesAsync(int limit)
        {
            return await _context.Companies
                .Where(c => c.DeletedAt == null)
                .Select(c => new TopCompanyDTO(
                    c.CompanyId,
                    c.CompanyName,
                    c.LogoImg,
                    c.Jobs.Count(j => j.DeletedAt == null),
                    c.Jobs.SelectMany(j => j.Applications).Count(),
                    c.Jobs.Sum(j => j.ViewCount ?? 0),
                    c.Jobs.Average(j => (j.SalaryMin + j.SalaryMax) / 2) ?? 0,
                    c.Jobs.Max(j => (DateTime?)j.PostedDate)
                ))
                .OrderByDescending(x => x.TotalApplications)
                .Take(limit)
                .ToListAsync();
        }
    }
}