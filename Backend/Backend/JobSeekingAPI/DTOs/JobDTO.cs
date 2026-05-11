using System.ComponentModel.DataAnnotations;

namespace JobSeekingAPI.DTOs
{
    // Chi tiết Job (Khi click vào xem 1 Job cụ thể)
    public class JobDetailDTO
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
        public int? Status { get; set; }
    }

    // DTO tìm kiếm - Gói các thanh filter lại
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
        public int PageSize { get; set; } = 10;
    }

    // Summary Job - Dùng cho Card hiển thị danh sách
    public class JobSummaryDTO
    {
        public int JobId { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string? ExpYear { get; set; }
        public string? Level { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? LogoImg { get; set; }
        public string LocationName { get; set; } = string.Empty;
        public DateTime PostedDate { get; set; }
        public DateTime? Deadline { get; set; }
        public string? Status { get; set; }
    }

    public class CreateJobDTO
    {
        [Required(ErrorMessage = "Please choose Company")]
        public int CompanyId { get; set; }
        [Required(ErrorMessage = "Please choose Location")]
        public int LocationId { get; set; }
        [Required(ErrorMessage = "Please enter Title")]
        [MaxLength(200, ErrorMessage = "Title too long")]
        public string Title { get; set; } = string.Empty;
        [Range(0, 999, ErrorMessage = "SalaryMin isn't valid")]
        public decimal? SalaryMin { get; set; }
        [Range(0, 999, ErrorMessage = "SalaryMax isn't valid")]
        public decimal? SalaryMax { get; set; }
        public string? ExpYear { get; set; }
        public string? Level { get; set; }
        public DateTime? Deadline { get; set; }
        public string? Description { get; set; }
        public string? Requirement { get; set; }
        public string? Benefits { get; set; }
        public string? Address { get; set; }
        public List<int>? TagIds { get; set; }
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
        public List<int>? TagIds { get; set; }
    }

    public class JobUpdateStatusDTO
    {
        public int Status { get; set; } // 1: Active, 0: Closed
    }
}