using System.Security.Claims;

namespace JobSeekingAPI.Helpers
{
    /// <summary>
    /// Ngoại lệ biểu thị người dùng đã đăng nhập nhưng không đủ quyền truy cập tài nguyên (HTTP 403 Forbidden)
    /// </summary>
    public class ForbiddenAccessException : Exception
    {
        public ForbiddenAccessException() : base("Bạn không có quyền thực hiện thao tác này.") { }
        public ForbiddenAccessException(string message) : base(message) { }
        public ForbiddenAccessException(string message, Exception innerException) : base(message, innerException) { }
    }

    /// <summary>
    /// Các hàm mở rộng hỗ trợ trích xuất thông tin định danh từ JWT ClaimsPrincipal
    /// </summary>
    public static class ClaimsPrincipalHelper
    {
        /// <summary>
        /// Đọc mã định danh người dùng (UserId) từ JWT Token hiện tại
        /// </summary>
        public static int GetUserIdFromToken(this ClaimsPrincipal user)
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("Không tìm thấy thông tin định danh hợp lệ trong phiên đăng nhập.");
        }
    }
}
