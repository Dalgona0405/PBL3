using System.ComponentModel.DataAnnotations;

namespace JobSeekingAPI.Models
{
    public class Application
    {
        [Key]
        public int AppId { get; set; }

        public int UserId { get; set; }
        public int JobId { get; set; }

        public DateTime AppliedDate { get; set; }
        public int Status { get; set; } // Map với enum ApplicationStatus
        public string? Message { get; set; }
        public DateTime? InterviewTime { get; set; }
        public string? InterviewLocation { get; set; }
        public string? CVUrl { get; set; }

        public double? AiMatchScore { get; set; }
        public string? AiScoreBreakdown { get; set; } // Lưu chuỗi JSON (jsonb) phân tích điểm

        public DateTime? DeletedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Candidate? Candidate { get; set; }
        public Job? Job { get; set; }
        public ICollection<Interview> Interviews { get; set; } = new List<Interview>();
    }
}