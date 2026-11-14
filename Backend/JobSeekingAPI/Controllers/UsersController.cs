using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    /// <summary>
    /// Quản lý tài khoản người dùng, tra cứu hồ sơ và đổi mật khẩu
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        /// <summary>
        /// Lấy danh sách tất cả tài khoản người dùng có phân trang (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpGet]
        public async Task<IActionResult> GetAllUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 100)
        {
            var result = await _userService.GetAllUsersAsync(page, pageSize);
            return Ok(result);
        }

        /// <summary>
        /// Lấy thông tin chi tiết của một người dùng theo Id (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var userDto = await _userService.GetUserByIdAsync(id);
            return Ok(userDto);
        }

        /// <summary>
        /// Cập nhật thông tin tài khoản cá nhân (họ tên, ảnh đại diện, mật khẩu mới)
        /// </summary>
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDTO updateUserDto)
        {
            int currentUserId = User.GetUserIdFromToken();
            await _userService.UpdateUserAsync(id, currentUserId, updateUserDto);
            return Ok(new { message = "Cập nhật thông tin tài khoản thành công." });
        }

        /// <summary>
        /// Xóa mềm một tài khoản người dùng (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            await _userService.DeleteUserAsync(id);
            return Ok(new { message = "Xóa tài khoản người dùng thành công." });
        }

        /// <summary>
        /// Tìm kiếm và lọc người dùng theo từ khóa và vai trò (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers(
            [FromQuery] string? keyword,
            [FromQuery] string? role,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _userService.SearchUsersAsync(keyword, role, page, pageSize);
            return Ok(result);
        }

        /// <summary>
        /// Lấy thông tin tài khoản của người dùng đang đăng nhập
        /// </summary>
        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetCurrentUserProfile()
        {
            int userId = User.GetUserIdFromToken();
            var userDto = await _userService.GetUserByIdAsync(userId);
            return Ok(userDto);
        }

        /// <summary>
        /// Đổi mật khẩu cho tài khoản hiện tại
        /// </summary>
        [Authorize]
        [HttpPatch("{id}/change-password")]
        public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordDTO changePasswordDto)
        {
            int currentUserId = User.GetUserIdFromToken();
            await _userService.ChangePasswordAsync(id, currentUserId, changePasswordDto);
            return Ok(new { message = "Đổi mật khẩu thành công." });
        }
    }
}
