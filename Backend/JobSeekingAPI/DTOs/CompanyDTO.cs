namespace JobSeekingAPI.DTOs
{
    public class CreateCompanyDTO
    {
        public string CompanyName { get; set; } = string.Empty;
        public string? LogoImg { get; set; }
        public string? Website { get; set; }
        public string? Size { get; set; }
    }

    public class UpdateCompanyDTO
    {
        public string? CompanyName { get; set; }
        public string? LogoImg { get; set; }
        public string? Website { get; set; }
        public string? Size { get; set; }
    }

    // Dùng cho màn hình danh sách các Công ty
    public class CompanySummaryDTO
    {
        public int CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? LogoImg { get; set; }
        public string? Website { get; set; }
        public string? Size { get; set; }
        public int JobCount { get; set; }
        public List<JobSummaryDTO> RecentJobs { get; set; } = new();
    }

    // Dùng cho màn hình Chi tiết Công ty
    public class CompanyDetailDTO : CompanySummaryDTO
    {
        public List<JobDetailDTO> ActiveJobs { get; set; } = new();
        public List<RecruiterSummaryDTO> Recruiters { get; set; } = new();
    }
}