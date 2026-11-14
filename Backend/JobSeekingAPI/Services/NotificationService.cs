using JobSeekingAPI.DTOs;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notifRepo;

        public NotificationService(INotificationRepository notifRepo)
        {
            _notifRepo = notifRepo;
        }

        public async Task<IEnumerable<NotificationDTO>> GetMyNotificationsAsync(int userId)
        {
            var notifs = await _notifRepo.GetAllNotificationsByUserIdAsync(userId);
            return notifs.Select(n => n.ToDto());
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _notifRepo.GetUnreadCountAsync(userId);
        }

        public async Task MarkAsReadAsync(int id, int currentUserId)
        {
            var notif = await _notifRepo.GetByIdAsync(id);
            if (notif == null)
                throw new KeyNotFoundException("Không tìm thấy thông báo.");
            if (notif.UserId != currentUserId)
                throw new ForbiddenAccessException("Bạn không có quyền truy cập thông báo này.");

            await _notifRepo.MarkAsReadAsync(id);
        }

        public async Task MarkAllAsReadAsync(int userId)
        {
            await _notifRepo.MarkAllAsReadAsync(userId);
        }
    }
}
