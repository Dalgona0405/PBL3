namespace JobSeekingAPI.DTOs
{
    public class ApplicationDetailDTO
    {
        public int ApplicationId { get; set; }
        public int UserId { get; set; }
        public int JobId { get; set; }
        public DateTime AppliedDate { get; set; }
        public int Status { get; set; }
        public string PipelineStage { get; set; } = "Applied"; // Trả kèm tên cột Kanban cho Frontend dễ dùng!
        public string? Message { get; set; }
        public DateTime? InterviewTime { get; set; }
        public DateTime? InterviewEndTime { get; set; }
        public string? InterviewType { get; set; }
        public string? MeetingLink { get; set; }
        public string? InterviewLocation { get; set; }
        public string? CVUrl { get; set; }

        // --- EXPLAINABLE AI SCORE TRÊN THẺ KANBAN ---
        public double? AiMatchScore { get; set; }
        public string? AiScoreBreakdown { get; set; }

        public DateTime? DeletedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public CandidateSummaryDTO? Candidate { get; set; }
        public JobSummaryDTO? Job { get; set; }
    }

    public class CreateApplicationDTO
    {
        public int UserId { get; set; }
        public int JobId { get; set; }
        public string? CVUrl { get; set; }
    }

    public class UpdateApplicationDTO
    {
        public string? CVUrl { get; set; }
    }

    public class UpdateApplicationStatusDTO
    {
        public int Status { get; set; } = 1; // 1: Applied, 2: Screening, 3: InterviewScheduled, 4: Offered, 5: Hired, 6: Rejected
        public string? Message { get; set; }

        // Các trường phục vụ Popup Đặt lịch phỏng vấn khi kéo sang cột InterviewScheduled
        public DateTime? InterviewTime { get; set; }
        public DateTime? InterviewEndTime { get; set; }
        public string? InterviewType { get; set; } = "Online"; // "Online" hoặc "Offline"
        public string? MeetingLink { get; set; }
        public string? InterviewLocation { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}