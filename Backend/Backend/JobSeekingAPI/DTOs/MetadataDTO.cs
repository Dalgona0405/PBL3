namespace JobSeekingAPI.DTOs
{
    public record MarketTrendDTO(
        string SkillName, 
        int JobCount, 
        double Percentage
    );

    public record SalaryReportDTO(
        string LocationName, 
        decimal AverageMinSalary, 
        decimal AverageMaxSalary,
        int JobCount
    );

    public record GraphNodeDTO(
        int Id, 
        string Label, 
        string Group,
        int Size
    );

    public record GraphEdgeDTO(
        int From,
        int To,
        double Value = 1.0,
        double Strength = 0.5
    );

    public record TimelineDataDTO(
        string Period,
        int Total,
        StatusBreakdownDTO ByStatus
    );

    public record StatusBreakdownDTO(
        int Pending,
        int Reviewed,
        int Interviewing,
        int Accepted,
        int Rejected
    );

    public record JobCategoryDTO(
        int CategoryId,
        string CategoryName,
        int JobCount,
        decimal AverageSalary,
        List<string> TopCompanies
    );

    public record TopCompanyDTO(
        int CompanyId,
        string CompanyName,
        string? LogoImg,
        int JobCount,
        int TotalApplications,
        int TotalViews,
        decimal AvgSalary,
        DateTime? LatestJobDate
    );

    public class JobMatchResultDTO
    {
        public double MatchScore { get; set; }
        public List<string> MissingSkills { get; set; } = new();
        public string? Advice { get; set; }
    }
}