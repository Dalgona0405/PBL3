using System;
using System.Collections.Generic;
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
        int Value,
        double Strength
    );

    public record TimelineDataDTO(
        string Period,
        int Total,
        StatusBreakdownDTO ByStatus
    );

    public record StatusBreakdownDTO(
        int Pending,
        int Reviewed,
        int Interviewed,
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
}