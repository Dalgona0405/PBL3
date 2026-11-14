using JobSeekingAPI.Helpers;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    /// <summary>
    /// Quản lý thông báo hệ thống của người dùng đang đăng nhập
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notifService;

        public NotificationsController(INotificationService notifService)
        {
            _notifService = notifService;
        }

        /// <summary>
        /// Lấy 50 thông báo gần nhất của người dùng hiện tại
        /// </summary>
        [HttpGet("me")]
        public async Task<IActionResult> GetMyNotifications()
        {
            int userId = User.GetUserIdFromToken();
            var dtos = await _notifService.GetMyNotificationsAsync(userId);
            return Ok(dtos);
        }

        /// <summary>
        /// Đếm số lượng thông báo chưa đọc của người dùng hiện tại
        /// </summary>
        [HttpGet("me/unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            int userId = User.GetUserIdFromToken();
            int count = await _notifService.GetUnreadCountAsync(userId);
            return Ok(new { count });
        }

        /// <summary>
        /// Đánh dấu một thông báo là đã đọc
        /// </summary>
        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            int currentUserId = User.GetUserIdFromToken();
            await _notifService.MarkAsReadAsync(id, currentUserId);
            return Ok(new { message = "Đã đánh dấu đã đọc." });
        }

        /// <summary>
        /// Đánh dấu toàn bộ thông báo của người dùng hiện tại là đã đọc
        /// </summary>
        [HttpPatch("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            int userId = User.GetUserIdFromToken();
            await _notifService.MarkAllAsReadAsync(userId);
            return Ok(new { message = "Đã đánh dấu đọc tất cả." });
        }
    }
}
