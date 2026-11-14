using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using Microsoft.EntityFrameworkCore;

namespace JobSeekingAPI.Repositories
{
    public class ReportRepository : IReportRepository
    {
        private readonly ApplicationDbContext _context;

        public ReportRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetTotalJobsCountAsync()
        {
            return await _context.Jobs.CountAsync();
        }

        public async Task<List<RawTagJobCount>> GetTopTagJobCountsAsync(int limit)
        {
            return await _context.Tags
                .AsNoTracking()
                .Where(t => t.Type == "Skill" || t.Type == "Language" || t.Type == "Role" || t.Type == "Domain")
                .Select(t => new RawTagJobCount(t.TagName, t.JobTags.Count()))
                .OrderByDescending(x => x.JobCount)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<RawSalaryByLocation>> GetRawSalaryByLocationAsync()
        {
            return await _context.Jobs
                .AsNoTracking()
                .Where(j => j.Location != null && (j.SalaryMin > 0 || j.SalaryMax > 0))
                .GroupBy(j => j.Location!.LocationName)
                .Select(g => new RawSalaryByLocation(
                    g.Key,
                    g.Average(j => (decimal?)j.SalaryMin),
                    g.Average(j => (decimal?)j.SalaryMax),
                    g.Count()
                ))
                .ToListAsync();
        }

        public async Task<List<RawTopCompanyMetric>> GetRawTopCompaniesAsync(int limit)
        {
            return await _context.Companies
                .AsNoTracking()
                .Select(c => new RawTopCompanyMetric(
                    c.CompanyId,
                    c.CompanyName,
                    c.LogoImg,
                    c.Jobs.Count(),
                    c.Jobs.SelectMany(j => j.Applications).Count(),
                    c.Jobs.Sum(j => (int?)j.ViewCount),
                    c.Jobs.Where(j => j.SalaryMin > 0 || j.SalaryMax > 0)
                        .Average(j => (decimal?)((j.SalaryMin + j.SalaryMax) / 2)),
                    c.Jobs.Max(j => (DateTime?)j.PostedDate)
                ))
                .OrderByDescending(c => c.JobCount)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<RawGraphNode>> GetRawGraphNodesAsync(int nodeLimit)
        {
            return await _context.Tags
                .AsNoTracking()
                .Where(t => t.Type == "Skill" || t.Type == "Language" || t.Type == "Role" || t.Type == "Domain")
                .Select(t => new RawGraphNode(
                    t.TagId,
                    t.TagName,
                    t.Type,
                    t.JobTags.Count() + t.CandidateTags.Count(),
                    t.JobTags.Count(),
                    t.JobTags
                        .Where(jt => jt.Job != null && (jt.Job.SalaryMin > 0 || jt.Job.SalaryMax > 0))
                        .Average(jt => (decimal?)((jt.Job!.SalaryMin + jt.Job.SalaryMax) / 2))
                ))
                .OrderByDescending(n => n.Size)
                .Take(nodeLimit)
                .ToListAsync();
        }

        public async Task<List<List<int>>> GetJobSkillGroupsAsync(List<int> nodeIds)
        {
            return await _context.JobTags
                .AsNoTracking()
                .Where(jt => nodeIds.Contains(jt.TagId))
                .GroupBy(jt => jt.JobId)
                .Select(g => g.Select(x => x.TagId).Distinct().ToList())
                .ToListAsync();
        }

        public async Task<ReportDashboardSnapshot> GetDashboardSnapshotAsync(DateTime now)
        {
            var activeJobsQuery = _context.Jobs
                .AsNoTracking()
                .Where(j => j.Status == (int)JobStatus.Active && (j.Deadline == null || j.Deadline >= now));

            return new ReportDashboardSnapshot
            {
                TotalJobs = await _context.Jobs.CountAsync(),
                TotalCandidates = await _context.Candidates.CountAsync(),
                TotalCompanies = await _context.Companies.CountAsync(),
                TotalRecruiters = await _context.Recruiters.CountAsync(),
                ActiveHiringCompanies = await activeJobsQuery.Where(j => j.CompanyId != null).Select(j => j.CompanyId).Distinct().CountAsync(),
                ActiveIndustries = await _context.JobTags
                    .Where(jt => jt.Job != null && jt.Job.Status == (int)JobStatus.Active && (jt.Job.Deadline == null || jt.Job.Deadline >= now))
                    .Select(jt => jt.TagId)
                    .Distinct()
                    .CountAsync(),
                ActiveJobSalaries = await activeJobsQuery.Select(j => new RawJobSalaryPair(j.SalaryMin, j.SalaryMax)).ToListAsync(),
                ActiveJobsCount = await activeJobsQuery.CountAsync(),
                ExpiredJobsCount = await _context.Jobs.CountAsync(j => j.Deadline < now),
                TotalApplications = await _context.Applications.CountAsync(),
                AppsLast7Days = await _context.Applications.CountAsync(a => a.AppliedDate >= now.AddDays(-7)),
                AppsLastMonth = await _context.Applications.CountAsync(a => a.AppliedDate >= now.AddMonths(-1)),
                AppsThisYear = await _context.Applications.CountAsync(a => a.AppliedDate.Year == now.Year)
            };
        }

        public async Task<List<SimpleStatDTO>> GetJobDistributionByLevelAsync()
        {
            return await _context.Jobs
                .AsNoTracking()
                .GroupBy(j => j.Level)
                .Select(g => new SimpleStatDTO
                {
                    Label = g.Key ?? "Chưa phân loại",
                    Value = g.Count()
                })
                .ToListAsync();
        }

        public async Task<List<RawYearlyJobCount>> GetYearlyJobCountsAsync()
        {
            return await _context.Jobs
                .AsNoTracking()
                .GroupBy(j => j.PostedDate.Year)
                .Select(g => new RawYearlyJobCount(g.Key, g.Count()))
                .OrderBy(x => x.Year)
                .ToListAsync();
        }

        public async Task<List<RawApplicationDateStatus>> GetApplicationsAppliedSinceAsync(DateTime startDate)
        {
            return await _context.Applications
                .AsNoTracking()
                .Where(a => a.AppliedDate >= startDate)
                .Select(a => new RawApplicationDateStatus(a.AppliedDate, a.Status))
                .ToListAsync();
        }
    }
}
