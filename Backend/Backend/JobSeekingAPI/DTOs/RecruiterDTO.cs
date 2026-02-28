namespace JobSeekingAPI.DTOs
{
    public class CreateRecruiterDTO
    {
        public int UserId { get; set; }
        public int CompanyId { get; set; }
        public string? Position { get; set; }
        public string? FullName { get; set; }
        public string? Avatar { get; set; }
    }

    public class UpdateRecruiterDTO
    {
        public int? CompanyId { get; set; }
        public string? Position { get; set; }
        public string? FullName { get; set; }
        public string? Avatar { get; set; }
    }

    // ✅ GIỮ LẠI - Đây là định nghĩa chính thức
    public class RecruiterDetailDTO
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string? Position { get; set; }
        public DateTime? LastLogin { get; set; }
        public CompanySummaryDTO? Company { get; set; }
    
        // ✅ SỬA: Đổi từ JobResponseDTO thành JobSummaryDTO
        public List<JobSummaryDTO> Jobs { get; set; } = new();
    }
}