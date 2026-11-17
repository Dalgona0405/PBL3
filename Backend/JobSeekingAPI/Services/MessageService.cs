using JobSeekingAPI.DTOs;
using JobSeekingAPI.Hubs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    /// <summary>
    /// Xử lý nghiệp vụ nhắn tin 1-1: danh sách hội thoại, lịch sử chat, gửi tin nhắn và đánh dấu đã đọc
    /// </summary>
    public class MessageService : IMessageService
    {
        private readonly IMessageRepository _messageRepo;

        public MessageService(IMessageRepository messageRepo)
        {
            _messageRepo = messageRepo;
        }

        /// <summary>
        /// Lấy danh sách các cuộc hội thoại gần nhất của người dùng kèm số tin chưa đọc
        /// </summary>
        public async Task<List<ConversationSummaryDTO>> GetConversationsAsync(int currentUserId, CancellationToken cancellationToken = default)
        {
            var conversationStats = await _messageRepo.GetConversationStatsAsync(currentUserId, cancellationToken);

            if (conversationStats.Count == 0)
            {
                return new List<ConversationSummaryDTO>();
            }

            var latestMessageIds = conversationStats.Select(s => s.LatestMessageId).ToList();
            var partnerIds = conversationStats.Select(s => s.PartnerId).ToList();

            var latestMessages = await _messageRepo.GetMessagesByIdsAsync(latestMessageIds, cancellationToken);
            var partners = await _messageRepo.GetUsersByIdsAsync(partnerIds, cancellationToken);

            return conversationStats
                .Select(stat =>
                {
                    latestMessages.TryGetValue(stat.LatestMessageId, out var latestMsg);
                    partners.TryGetValue(stat.PartnerId, out var partner);

                    return new ConversationSummaryDTO
                    {
                        PartnerId = stat.PartnerId,
                        PartnerName = partner?.FullName ?? "Người dùng",
                        PartnerAvatar = partner?.Avatar,
                        PartnerRole = partner?.Role ?? "",
                        LastMessage = latestMsg?.Content ?? "",
                        LastMessageTime = latestMsg?.SentAt ?? DateTime.MinValue,
                        UnreadCount = stat.UnreadCount,
                        IsOnline = ChatHub.IsUserOnline(stat.PartnerId)
                    };
                })
                .OrderByDescending(c => c.LastMessageTime)
                .ToList();
        }

        /// <summary>
        /// Lấy lịch sử tin nhắn với một đối tác (phân trang) và tự động đánh dấu đã đọc
        /// </summary>
        public async Task<PagedResultDTO<MessageResponseDTO>> GetChatHistoryAsync(
            int currentUserId,
            int partnerId,
            int page = 1,
            int pageSize = 50,
            CancellationToken cancellationToken = default)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 50;

            await MarkConversationAsReadAsync(currentUserId, partnerId, cancellationToken);

            var (totalCount, rawMessages) = await _messageRepo.GetConversationMessagesAsync(
                currentUserId,
                partnerId,
                page,
                pageSize,
                cancellationToken);

            var messages = rawMessages
                .Select(m => new MessageResponseDTO
                {
                    MessageId = m.MessageId,
                    SenderId = m.SenderId,
                    SenderName = m.Sender != null ? m.Sender.FullName : "Unknown",
                    SenderAvatar = m.Sender != null ? m.Sender.Avatar : null,
                    ReceiverId = m.ReceiverId,
                    JobId = m.JobId,
                    JobTitle = m.Job != null ? m.Job.Title : null,
                    Content = m.Content,
                    IsRead = m.IsRead,
                    SentAt = m.SentAt
                })
                .ToList();

            // Đảo ngược lại theo thứ tự thời gian tăng dần để hiển thị từ trên xuống dưới trong khung chat
            messages.Reverse();

            return new PagedResultDTO<MessageResponseDTO>
            {
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Items = messages
            };
        }

        /// <summary>
        /// Kiểm tra dữ liệu, lưu tin nhắn xuống DB và tạo thông báo nếu người nhận đang offline
        /// </summary>
        public async Task<MessageResponseDTO> SendMessageAsync(int senderId, SendMessageDTO dto, CancellationToken cancellationToken = default)
        {
            var sender = await _messageRepo.GetUserBasicByIdAsync(senderId, cancellationToken)
                ?? throw new UnauthorizedAccessException("Tài khoản người gửi không hợp lệ.");

            var receiver = await _messageRepo.GetUserBasicByIdAsync(dto.ReceiverId, cancellationToken)
                ?? throw new KeyNotFoundException("Không tìm thấy người nhận tin nhắn.");

            // Kiểm tra ma trận RBAC trong giao tiếp 1-1:
            // 1. Admin không tham gia nhắn tin tuyển dụng.
            // 2. Ứng viên (Candidate) chỉ trao đổi với Nhà tuyển dụng (Recruiter/Company) và ngược lại.
            if (sender.Role == Enums.UserRoles.Admin || receiver.Role == Enums.UserRoles.Admin)
                throw new Helpers.ForbiddenAccessException("Tài khoản Quản trị viên hệ thống không tham gia luồng nhắn tin tuyển dụng.");

            bool isSenderCandidate = sender.Role == Enums.UserRoles.Candidate;
            bool isReceiverCandidate = receiver.Role == Enums.UserRoles.Candidate;
            if (isSenderCandidate == isReceiverCandidate)
                throw new Helpers.ForbiddenAccessException("Hệ thống chỉ hỗ trợ nhắn tin trao đổi trực tiếp giữa Ứng viên và Nhà tuyển dụng.");

            string? jobTitle = null;
            if (dto.JobId.HasValue)
            {
                jobTitle = await _messageRepo.GetJobTitleByIdAsync(dto.JobId.Value, cancellationToken);
            }

            var message = new Message
            {
                SenderId = senderId,
                ReceiverId = dto.ReceiverId,
                JobId = dto.JobId,
                Content = dto.Content.Trim(),
                IsRead = false,
                SentAt = DateTime.UtcNow
            };

            Notification? notification = null;
            if (!ChatHub.IsUserOnline(dto.ReceiverId))
            {
                notification = new Notification
                {
                    UserId = dto.ReceiverId,
                    Title = $"Tin nhắn mới từ {sender.FullName}",
                    Content = message.Content.Length > 80 ? message.Content[..80] + "..." : message.Content,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
            }

            await _messageRepo.AddMessageAndOptionalNotificationAsync(message, notification, cancellationToken);

            return new MessageResponseDTO
            {
                MessageId = message.MessageId,
                SenderId = senderId,
                SenderName = sender.FullName,
                SenderAvatar = sender.Avatar,
                ReceiverId = dto.ReceiverId,
                JobId = dto.JobId,
                JobTitle = jobTitle,
                Content = message.Content,
                IsRead = false,
                SentAt = message.SentAt
            };
        }

        /// <summary>
        /// Đánh dấu toàn bộ tin nhắn chưa đọc từ đối tác gửi tới người dùng hiện tại là đã đọc
        /// </summary>
        public async Task<bool> MarkConversationAsReadAsync(int currentUserId, int partnerId, CancellationToken cancellationToken = default)
        {
            return await _messageRepo.MarkConversationAsReadAsync(currentUserId, partnerId, cancellationToken);
        }


        /// <summary>
        /// Lấy danh sách những người đang trò chuyện cùng
        /// </summary>
        public async Task<List<int>> GetConversationPartnerIdsAsync(int userId, CancellationToken cancellationToken = default)
        {
            return await _messageRepo.GetConversationPartnerIdsAsync(userId, cancellationToken);
        }
    }
}
