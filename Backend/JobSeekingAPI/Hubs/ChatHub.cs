using JobSeekingAPI.DTOs;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace JobSeekingAPI.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IMessageService _messageService;
        private readonly ILogger<ChatHub> _logger;

        // Quản lý trạng thái Online hỗ trợ 1 User mở nhiều tab trình duyệt cùng lúc (Thread-safe)
        private static readonly ConcurrentDictionary<int, HashSet<string>> OnlineUsers = new();

        public ChatHub(IMessageService messageService, ILogger<ChatHub> logger)
        {
            _messageService = messageService;
            _logger = logger;
        }

        public static bool IsUserOnline(int userId) =>
            OnlineUsers.TryGetValue(userId, out var connections) && connections.Count > 0;

        public override async Task OnConnectedAsync()
        {
            if (Context.User != null)
            {
                int userId = Context.User.GetUserIdFromToken();
                var connections = OnlineUsers.GetOrAdd(userId, _ => new HashSet<string>());
                lock (connections)
                {
                    connections.Add(Context.ConnectionId);
                }

                // Thông báo cho các client khác biết user này vừa Online
                await Clients.Others.SendAsync("UserStatusChanged", new { userId, isOnline = true });
                _logger.LogInformation("SignalR: User {UserId} connected (ConnectionId: {ConnId})", userId, Context.ConnectionId);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (Context.User != null)
            {
                int userId = Context.User.GetUserIdFromToken();
                if (OnlineUsers.TryGetValue(userId, out var connections))
                {
                    bool wentOffline = false;
                    lock (connections)
                    {
                        connections.Remove(Context.ConnectionId);
                        if (connections.Count == 0)
                        {
                            OnlineUsers.TryRemove(userId, out _);
                            wentOffline = true;
                        }
                    }

                    if (wentOffline)
                    {
                        await Clients.Others.SendAsync("UserStatusChanged", new { userId, isOnline = false });
                    }
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Gửi tin nhắn 1-1 thời gian thực
        /// </summary>
        public async Task SendMessage(SendMessageDTO dto)
        {
            int senderId = Context.User!.GetUserIdFromToken();

            MessageResponseDTO responsePayload;
            try
            {
                responsePayload = await _messageService.SendMessageAsync(senderId, dto);
            }
            catch (ArgumentException ex)
            {
                throw new HubException(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                throw new HubException(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                throw new HubException(ex.Message);
            }

            // Đẩy tin nhắn thời gian thực tới TẤT CẢ các tab của Người nhận và Người gửi
            await Clients.User(dto.ReceiverId.ToString()).SendAsync("ReceiveMessage", responsePayload);
            await Clients.User(senderId.ToString()).SendAsync("MessageSent", responsePayload);
        }

        /// <summary>
        /// Chỉ báo đối phương đang gõ phím - Typing Indicator
        /// </summary>
        public async Task SendTypingIndicator(int receiverId, bool isTyping)
        {
            int senderId = Context.User!.GetUserIdFromToken();
            await Clients.User(receiverId.ToString()).SendAsync("UserTyping", new
            {
                senderId,
                isTyping
            });
        }

        /// <summary>
        /// Đánh dấu Đã xem (Seen) toàn bộ tin nhắn từ đối phương
        /// </summary>
        public async Task MarkConversationAsRead(int partnerId)
        {
            int currentUserId = Context.User!.GetUserIdFromToken();

            bool hasUpdated = await _messageService.MarkConversationAsReadAsync(currentUserId, partnerId);

            if (hasUpdated)
            {
                // Báo cho đối phương biết tin nhắn của họ đã được đọc (Hiển thị "Đã xem" tức thì)
                await Clients.User(partnerId.ToString()).SendAsync("MessagesRead", new
                {
                    readerId = currentUserId,
                    readAt = DateTime.UtcNow
                });
            }
        }
    }
}