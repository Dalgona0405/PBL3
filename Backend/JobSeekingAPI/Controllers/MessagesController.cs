using JobSeekingAPI.DTOs;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Hubs;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace JobSeekingAPI.Controllers
{
    /// <summary>
    /// Quản lý danh sách hội thoại, lịch sử tin nhắn và gửi tin nhắn qua HTTP fallback
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly IHubContext<ChatHub> _hubContext;

        public MessagesController(IMessageService messageService, IHubContext<ChatHub> hubContext)
        {
            _messageService = messageService;
            _hubContext = hubContext;
        }

        /// <summary>
        /// Lấy danh sách các cuộc hội thoại gần đây kèm số lượng tin chưa đọc
        /// </summary>
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations(CancellationToken cancellationToken)
        {
            int currentUserId = User.GetUserIdFromToken();
            var conversations = await _messageService.GetConversationsAsync(currentUserId, cancellationToken);
            return Ok(conversations);
        }

        /// <summary>
        /// Lấy lịch sử tin nhắn với một đối tác cụ thể (phân trang) và đánh dấu đã đọc
        /// </summary>
        [HttpGet("history/{partnerId}")]
        public async Task<IActionResult> GetChatHistory(
            int partnerId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            CancellationToken cancellationToken = default)
        {
            int currentUserId = User.GetUserIdFromToken();

            // Nếu có tin nhắn chưa đọc vừa được đánh dấu là Đã xem -> Bắn sự kiện Real-time cho đối phương
            bool markedRead = await _messageService.MarkConversationAsReadAsync(currentUserId, partnerId, cancellationToken);
            if (markedRead)
            {
                await _hubContext.Clients.User(partnerId.ToString()).SendAsync("MessagesRead", new
                {
                    readerId = currentUserId,
                    readAt = DateTime.UtcNow
                }, cancellationToken);
            }

            var result = await _messageService.GetChatHistoryAsync(currentUserId, partnerId, page, pageSize, cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Gửi tin nhắn qua HTTP POST và phát sóng thời gian thực tới người nhận qua SignalR
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> SendMessageHttp([FromBody] SendMessageDTO dto, CancellationToken cancellationToken)
        {
            int senderId = User.GetUserIdFromToken();
            var responsePayload = await _messageService.SendMessageAsync(senderId, dto, cancellationToken);

            // Phát sóng tin nhắn tới các thiết bị đang kết nối của người nhận
            await _hubContext.Clients.User(dto.ReceiverId.ToString())
                .SendAsync("ReceiveMessage", responsePayload, cancellationToken);

            return Ok(responsePayload);
        }
    }
}
