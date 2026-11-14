using JobSeekingAPI.Data;
using JobSeekingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace JobSeekingAPI.Repositories
{
    public class MessageRepository : IMessageRepository
    {
        private readonly ApplicationDbContext _context;

        public MessageRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<RawConversationStat>> GetConversationStatsAsync(int currentUserId, CancellationToken cancellationToken = default)
        {
            return await _context.Messages
                .AsNoTracking()
                .Where(m => m.SenderId == currentUserId || m.ReceiverId == currentUserId)
                .GroupBy(m => m.SenderId == currentUserId ? m.ReceiverId : m.SenderId)
                .Select(g => new RawConversationStat(
                    g.Key,
                    g.Max(m => m.MessageId),
                    g.Sum(m => m.ReceiverId == currentUserId && !m.IsRead ? 1 : 0)
                ))
                .ToListAsync(cancellationToken);
        }

        public async Task<Dictionary<int, Message>> GetMessagesByIdsAsync(IEnumerable<int> messageIds, CancellationToken cancellationToken = default)
        {
            var ids = messageIds.ToList();
            return await _context.Messages
                .AsNoTracking()
                .Where(m => ids.Contains(m.MessageId))
                .ToDictionaryAsync(m => m.MessageId, cancellationToken);
        }

        public async Task<Dictionary<int, User>> GetUsersByIdsAsync(IEnumerable<int> userIds, CancellationToken cancellationToken = default)
        {
            var ids = userIds.ToList();
            return await _context.Users
                .AsNoTracking()
                .Where(u => ids.Contains(u.UserId))
                .ToDictionaryAsync(u => u.UserId, cancellationToken);
        }

        public async Task<(int totalCount, List<Message> messages)> GetConversationMessagesAsync(
            int currentUserId,
            int partnerId,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Messages
                .AsNoTracking()
                .Include(m => m.Sender)
                .Include(m => m.Job)
                .Where(m => (m.SenderId == currentUserId && m.ReceiverId == partnerId) ||
                            (m.SenderId == partnerId && m.ReceiverId == currentUserId));

            var totalCount = await query.CountAsync(cancellationToken);
            var messages = await query
                .OrderByDescending(m => m.SentAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (totalCount, messages);
        }

        public async Task<User?> GetUserBasicByIdAsync(int userId, CancellationToken cancellationToken = default)
        {
            return await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);
        }

        public async Task<bool> UserExistsAsync(int userId, CancellationToken cancellationToken = default)
        {
            return await _context.Users
                .AsNoTracking()
                .AnyAsync(u => u.UserId == userId, cancellationToken);
        }

        public async Task<string?> GetJobTitleByIdAsync(int jobId, CancellationToken cancellationToken = default)
        {
            return await _context.Jobs
                .AsNoTracking()
                .Where(j => j.JobId == jobId)
                .Select(j => j.Title)
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task AddMessageAndOptionalNotificationAsync(Message message, Notification? notification, CancellationToken cancellationToken = default)
        {
            await _context.Messages.AddAsync(message, cancellationToken);
            if (notification != null)
            {
                await _context.Notifications.AddAsync(notification, cancellationToken);
            }
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<bool> MarkConversationAsReadAsync(int currentUserId, int partnerId, CancellationToken cancellationToken = default)
        {
            var updatedRows = await _context.Messages
                .Where(m => m.SenderId == partnerId && m.ReceiverId == currentUserId && !m.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(m => m.IsRead, true), cancellationToken);

            return updatedRows > 0;
        }
    }
}
