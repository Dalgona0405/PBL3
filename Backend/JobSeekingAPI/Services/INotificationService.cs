using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Services
{
    public interface INotificationService
    {
        Task<IEnumerable<NotificationDTO>> GetMyNotificationsAsync(int userId);
        Task<int> GetUnreadCountAsync(int userId);
        Task MarkAsReadAsync(int id, int currentUserId);
        Task MarkAllAsReadAsync(int userId);
    }
}
