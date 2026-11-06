using System.ComponentModel.DataAnnotations;

namespace JobSeekingAPI.DTOs
{
    // Recruiter gửi yêu cầu
    public class CreateCompanyRequestDTO
    {
        [Required]
        public int CompanyId { get; set; }
    }

    // Admin duyệt/từ chối
    public class UpdateCompanyRequestStatusDTO
    {
        [Required]
        public int Status { get; set; } // 1: Approved, 2: Rejected
    }

    // Hiển thị danh sách cho Admin xem
    public class CompanyRequestSummaryDTO
    {
        public int RequestId { get; set; }
        public int UserId { get; set; }
        public string RecruiterName { get; set; } = string.Empty;
        public string RecruiterEmail { get; set; } = string.Empty;
        public int CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public int Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}