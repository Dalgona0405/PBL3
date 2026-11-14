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
        int Size,
        double CurrentAvgSalary = 0,
        int JobCount = 0
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

    public record SkillsGraphResultDTO(
        List<GraphNodeDTO> Nodes,
        List<GraphEdgeDTO> Edges,
        List<GraphEdgeDTO>? AiSuggestedEdges = null
    );

    public class AiScoreBreakdownDTO
    {
        public double SkillScore { get; set; }      // Hệ số 40%
        public double ExperienceScore { get; set; } // Hệ số 30%
        public double LocationScore { get; set; }   // Hệ số 20%
        public double DomainScore { get; set; }     // Hệ số 10%
    }

    public class JobMatchResultDTO
    {
        public double MatchScore { get; set; }
        public AiScoreBreakdownDTO Breakdown { get; set; } = new();
        public List<string> MissingSkills { get; set; } = new();
        public string? Advice { get; set; }
    }

    public class JobSuggestionDTO
    {
        public JobSummaryDTO Job { get; set; } = new();
        public double MatchScore { get; set; }
        public AiScoreBreakdownDTO Breakdown { get; set; } = new();
        public List<string> MissingSkills { get; set; } = new();
        public string? Advice { get; set; }
    }
}