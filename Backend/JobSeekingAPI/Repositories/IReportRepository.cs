using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Repositories
{
    public record RawTagJobCount(string TagName, int JobCount);
    public record RawSalaryByLocation(string LocationName, decimal? AvgMin, decimal? AvgMax, int JobCount);
    public record RawTopCompanyMetric(int CompanyId, string CompanyName, string? LogoImg, int JobCount, int AppCount, int? ViewCount, decimal? AvgSalary, DateTime? LatestJobDate);
    public record RawGraphNode(int TagId, string TagName, string? Type, int Size, int JobCount, decimal? CurrentAvgSalary);
    public record RawJobSalaryPair(decimal? SalaryMin, decimal? SalaryMax);
    public record RawYearlyJobCount(int Year, int Count);
    public record RawApplicationDateStatus(DateTime AppliedDate, int Status);

    public class ReportDashboardSnapshot
    {
        public int TotalJobs { get; set; }
        public int TotalCandidates { get; set; }
        public int TotalCompanies { get; set; }
        public int TotalRecruiters { get; set; }
        public int ActiveHiringCompanies { get; set; }
        public int ActiveIndustries { get; set; }
        public int ActiveJobsCount { get; set; }
        public int ExpiredJobsCount { get; set; }
        public List<RawJobSalaryPair> ActiveJobSalaries { get; set; } = new();
        public int TotalApplications { get; set; }
        public int AppsLast7Days { get; set; }
        public int AppsLastMonth { get; set; }
        public int AppsThisYear { get; set; }
    }

    public interface IReportRepository
    {
        Task<int> GetTotalJobsCountAsync();
        Task<List<RawTagJobCount>> GetTopTagJobCountsAsync(int limit);
        Task<List<RawSalaryByLocation>> GetRawSalaryByLocationAsync();
        Task<List<RawTopCompanyMetric>> GetRawTopCompaniesAsync(int limit);
        Task<List<RawGraphNode>> GetRawGraphNodesAsync(int nodeLimit);
        Task<List<List<int>>> GetJobSkillGroupsAsync(List<int> nodeIds);
        Task<ReportDashboardSnapshot> GetDashboardSnapshotAsync(DateTime now);
        Task<List<SimpleStatDTO>> GetJobDistributionByLevelAsync();
        Task<List<RawYearlyJobCount>> GetYearlyJobCountsAsync();
        Task<List<RawApplicationDateStatus>> GetApplicationsAppliedSinceAsync(DateTime startDate);
    }
}
