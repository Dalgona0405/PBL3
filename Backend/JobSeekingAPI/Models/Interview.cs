using System.ComponentModel.DataAnnotations;

namespace JobSeekingAPI.Models
{
    public class Interview
    {
        [Key]
        public int InterviewId { get; set; }

        public int ApplicationId { get; set; }
        public DateTime ScheduledAt { get; set; }
        public DateTime EndAt { get; set; }

        // "Online" hoặc "Offline"
        public string InterviewType { get; set; } = "Online";
        public string? MeetingLink { get; set; }
        public string? Location { get; set; }
        public string? Notes { get; set; }

        // Mã định danh duy nhất cho sự kiện lịch (.ics UID) để cập nhật/hủy lịch trên Google Calendar
        public string? CalendarEventUid { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public Application? Application { get; set; }
    }
}