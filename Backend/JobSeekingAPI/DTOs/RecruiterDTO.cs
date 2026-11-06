namespace JobSeekingAPI.DTOs
{
    // Tạo NTD 
    public class CreateRecruiterDTO
    {
        public int UserId { get; set; }
        public int CompanyId { get; set; }
        public string? Position { get; set; }
    }

    // Cập nhật NTD
    public class UpdateRecruiterDTO
    {
        public string? Position { get; set; }
        public string? FullName { get; set; }
        public string? Avatar { get; set; }
        public int? CompanyId { get; set; }
    }

    public class RecruiterDetailDTO
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string? Position { get; set; }
        public DateTime? LastLogin { get; set; }
        public CompanySummaryDTO? Company { get; set; }
        public List<JobSummaryDTO> Jobs { get; set; } = new();
    }

    public class RecruiterSummaryDTO
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Position { get; set; }
        public string? Avatar { get; set; }
        public string? Email { get; set; }
    }
}