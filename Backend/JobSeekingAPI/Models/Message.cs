using System.ComponentModel.DataAnnotations;

namespace JobSeekingAPI.Models
{
    public class Message
    {
        [Key]
        public int MessageId { get; set; }

        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
        public int? JobId { get; set; } // Ngữ cảnh công việc đang trao đổi (nếu có)

        [Required]
        public string Content { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User? Sender { get; set; }
        public User? Receiver { get; set; }
        public Job? Job { get; set; }
    }
}