using System.ComponentModel.DataAnnotations;

namespace JobSeekingAPI.DTOs
{
    public class SendMessageDTO
    {
        [Required]
        public int ReceiverId { get; set; }
        public int? JobId { get; set; }

        [Required(ErrorMessage = "Nội dung tin nhắn không được để trống")]
        [MaxLength(4000)]
        public string Content { get; set; } = string.Empty;
    }

    public class MessageResponseDTO
    {
        public int MessageId { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string? SenderAvatar { get; set; }
        public int ReceiverId { get; set; }
        public int? JobId { get; set; }
        public string? JobTitle { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime SentAt { get; set; }
    }

    public class ConversationSummaryDTO
    {
        public int PartnerId { get; set; }
        public string PartnerName { get; set; } = string.Empty;
        public string? PartnerAvatar { get; set; }
        public string PartnerRole { get; set; } = string.Empty;
        public string LastMessage { get; set; } = string.Empty;
        public DateTime LastMessageTime { get; set; }
        public int UnreadCount { get; set; }
        public bool IsOnline { get; set; }
    }
}