using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Services
{
    public interface IMessageService
    {
        /// <summary>
        /// Lấy danh sách các cuộc hội thoại gần đây của người dùng kèm số tin chưa đọc và trạng thái online
        /// </summary>
        Task<List<ConversationSummaryDTO>> GetConversationsAsync(int currentUserId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy lịch sử tin nhắn 1-1 có phân trang và tự động đánh dấu đã đọc các tin từ đối phương
        /// </summary>
        Task<PagedResultDTO<MessageResponseDTO>> GetChatHistoryAsync(
            int currentUserId,
            int partnerId,
            int page = 1,
            int pageSize = 50,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Lưu tin nhắn mới vào Database và tạo Notification nếu người nhận đang offline
        /// </summary>
        Task<MessageResponseDTO> SendMessageAsync(int senderId, SendMessageDTO dto, CancellationToken cancellationToken = default);

        /// <summary>
        /// Đánh dấu toàn bộ tin nhắn chưa đọc từ đối phương là đã xem
        /// </summary>
        Task<bool> MarkConversationAsReadAsync(int currentUserId, int partnerId, CancellationToken cancellationToken = default);
    }
}
