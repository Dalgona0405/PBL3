using System;
using System.Collections.Generic;
namespace JobSeekingAPI.DTOs
{
    // Job trả về cho Frontend
    public class JobResponseDTO
    {
        public int JobId { get; set; }
        public int CompanyId { get; set; }
        public string? OriginalId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Requirement { get; set; }
        public string? Benefits { get; set; }
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string? Level { get; set; }
        public string? ExpYear { get; set; }
        public DateTime PostedDate { get; set; }
        public DateTime? Deadline { get; set; }
        public string? Address { get; set; }
        public int? ViewCount { get; set; }
        public string? LocationName { get; set; }
        public CompanySummaryDTO? Company { get; set; } = null!;
        public LocationSummaryDTO? Location { get; set; } = null!;
        public List<TagSummaryDTO> Tags { get; set; } = new();
        public int ApplicationCount { get; set; }
    }

    // DTO tìm kiếm - nhận từ query
    public class JobSearchDTO
    {
        public string? Keyword { get; set; }
        public int? LocationId { get; set; }
        public int? TagId { get; set; }
        public decimal? MinSalary { get; set; }
        public decimal? MaxSalary { get; set; }
        public string? ExpYear { get; set; }
        public string? Level { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
    // Summary Job - dùng cho CompanySummaryDTO
    public class JobSummaryDTO
    {
        public int JobId { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string? ExpYear { get; set; }
        public string? Level { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string LocationName { get; set; } = string.Empty;
        public DateTime PostedDate { get; set; }
        public DateTime? Deadline { get; set; }
        public string? Status { get; set; }
    }
    public class CreateJobDTO
    {
        public int CompanyId { get; set; }
        public int LocationId { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string? ExpYear { get; set; }
        public string? Level { get; set; }
        public DateTime? Deadline { get; set; }
        public string? Description { get; set; }
        public string? Requirement { get; set; }
        public string? Benefits { get; set; }
        public string? Address { get; set; }
    }

    public class UpdateJobDTO
    {
        public int? LocationId { get; set; }
        public string? Title { get; set; }
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string? ExpYear { get; set; }
        public string? Level { get; set; }
        public DateTime? Deadline { get; set; }
        public string? Description { get; set; }
        public string? Requirement { get; set; }
        public string? Benefits { get; set; }
        public string? Address { get; set; }
        public int? Status { get; set; } // 1: Active, 0: Closed
    }
}