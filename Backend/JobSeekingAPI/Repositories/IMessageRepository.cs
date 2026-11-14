using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public record RawConversationStat(int PartnerId, int LatestMessageId, int UnreadCount);

    public interface IMessageRepository
    {
        Task<List<RawConversationStat>> GetConversationStatsAsync(int currentUserId, CancellationToken cancellationToken = default);
        Task<Dictionary<int, Message>> GetMessagesByIdsAsync(IEnumerable<int> messageIds, CancellationToken cancellationToken = default);
        Task<Dictionary<int, User>> GetUsersByIdsAsync(IEnumerable<int> userIds, CancellationToken cancellationToken = default);
        Task<(int totalCount, List<Message> messages)> GetConversationMessagesAsync(
            int currentUserId,
            int partnerId,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default);
        Task<User?> GetUserBasicByIdAsync(int userId, CancellationToken cancellationToken = default);
        Task<bool> UserExistsAsync(int userId, CancellationToken cancellationToken = default);
        Task<string?> GetJobTitleByIdAsync(int jobId, CancellationToken cancellationToken = default);
        Task AddMessageAndOptionalNotificationAsync(Message message, Notification? notification, CancellationToken cancellationToken = default);
        Task<bool> MarkConversationAsReadAsync(int currentUserId, int partnerId, CancellationToken cancellationToken = default);
    }
}
