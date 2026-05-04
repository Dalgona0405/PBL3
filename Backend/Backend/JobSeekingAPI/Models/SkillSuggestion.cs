using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobSeekingAPI.Models
{
    public class SkillSuggestion
    {
        [Key]
        public int Id { get; set; }

        // Kỹ năng hiện tại của ứng viên (Ví dụ: Id của C#)
        public int SourceSkillId { get; set; }

        // Kỹ năng AI khuyên học thêm (Ví dụ: Id của PostgreSQL)
        public int SuggestedSkillId { get; set; }

        // Tên kỹ năng để hiển thị luôn cho lẹ, khỏi phải join bảng
        public string SuggestedSkillName { get; set; } = string.Empty;

        // Điểm tự tin của AI (Ví dụ: 85.5%)
        public double MatchScore { get; set; }

        // Thời điểm AI dự báo
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }
}