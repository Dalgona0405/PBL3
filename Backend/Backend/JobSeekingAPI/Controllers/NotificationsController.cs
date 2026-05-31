using JobSeekingAPI.DTOs;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationRepository _notifRepo;

        public NotificationsController(INotificationRepository notifRepo)
        {
            _notifRepo = notifRepo;
        }

        // GET: api/notifications/me
        [HttpGet("me")]
        public async Task<IActionResult> GetMyNotifications()
        {
            int userId = User.GetUserIdFromToken();
            var notifs = await _notifRepo.GetAllNotificationsByUserIdAsync(userId);

            var dtos = notifs.Select(n => new NotificationDTO
            {
                NotificationId = n.NotificationId,
                Title = n.Title,
                Content = n.Content,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            });

            return Ok(dtos);
        }

        // GET: api/notifications/me/unread-count
        [HttpGet("me/unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            int userId = User.GetUserIdFromToken();
            var unreadNotifs = await _notifRepo.GetUnreadNotificationsAsync(userId);
            return Ok(new { count = unreadNotifs.Count() });
        }

        // PATCH: api/notifications/{id}/read
        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            await _notifRepo.MarkAsReadAsync(id);
            return Ok(new { message = "Đã đánh dấu đọc." });
        }

        // PATCH: api/notifications/read-all
        [HttpPatch("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            int userId = User.GetUserIdFromToken();
            await _notifRepo.MarkAllAsReadAsync(userId);
            return Ok(new { message = "Đã đánh dấu đọc tất cả." });
        }
    }
}