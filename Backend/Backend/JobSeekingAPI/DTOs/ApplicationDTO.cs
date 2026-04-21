using System;

namespace JobSeekingAPI.DTOs
{
    // Xem chi tiết Đơn ứng tuyển
    public class ApplicationResponseDTO
    {
        public int ApplicationId { get; set; }
        public int UserId { get; set; }
        public int JobId { get; set; }
        public DateTime AppliedDate { get; set; }
        public int Status { get; set; }
        public string? CVUrl { get; set; }
        public DateTime? DeletedAt { get; set; }

        public CandidateSummaryDTO? Candidate { get; set; }
        public JobSummaryDTO? Job { get; set; }
    }

    // Người dùng gửi lên khi bấm Ứng tuyển
    public class CreateApplicationDTO
    {
        public int UserId { get; set; }
        public int JobId { get; set; }
        // CVUrl là nullable. Nếu để trống, Backend sẽ tự động lấy CV mặc định của Candidate.
        public string? CVUrl { get; set; }
    }

    public class UpdateApplicationDTO
    {
        public string? CVUrl { get; set; }
    }

    public class UpdateApplicationStatusDTO
    {
        public int Status { get; set; } = 0;
    }
}