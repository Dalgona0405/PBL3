using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface INotificationRepository : IBaseRepository<Notification>
    {
        Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(int userId);
        Task<IEnumerable<Notification>> GetAllNotificationsByUserIdAsync(int userId);
        Task MarkAsReadAsync(int notificationId);
        Task MarkAllAsReadAsync(int userId);
    }
}