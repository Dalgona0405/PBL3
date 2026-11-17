using JobSeekingAPI.DTOs;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    /// <summary>
    /// Xử lý xác thực tài khoản: đăng ký, đăng nhập truyền thống và đăng nhập qua Google OAuth
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Đăng ký tài khoản mới theo vai trò (Candidate, Recruiter, Company)
        /// </summary>
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] CreateUserDTO userDto)
        {
            var result = await _authService.RegisterAsync(userDto);
            return CreatedAtAction(nameof(Register), new { id = result.UserId }, result);
        }

        /// <summary>
        /// Đăng nhập bằng Email và mật khẩu để nhận JWT Token
        /// </summary>
        private const string RefreshCookieName = "sjsp_refresh_token";

        private CookieOptions BuildRefreshCookieOptions(DateTimeOffset? expires = null) => new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = expires
        };

        private void AppendRefreshCookie(string refreshToken)
        {
            Response.Cookies.Append(
                RefreshCookieName,
                refreshToken,
                BuildRefreshCookieOptions(DateTimeOffset.UtcNow.AddDays(7)));
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO loginDto)
        {
            var (result, refreshToken) = await _authService.LoginWithRefreshAsync(loginDto);
            AppendRefreshCookie(refreshToken);
            return Ok(result);
        }

        /// <summary>
        /// Xác thực đăng nhập hoặc tự động tạo tài khoản qua Google ID Token
        /// </summary>
        [AllowAnonymous]
        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDTO googleDto, CancellationToken cancellationToken)
        {
            var (result, refreshToken) = await _authService.GoogleLoginWithRefreshAsync(googleDto, cancellationToken);
            AppendRefreshCookie(refreshToken);
            return Ok(result);
        }

        /// <summary>
        /// Làm mới Access Token thông qua HttpOnly Refresh Token Cookie
        /// </summary>
        [AllowAnonymous]
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            if (!Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken) || string.IsNullOrWhiteSpace(refreshToken))
            {
                return Unauthorized(new { message = "Không tìm thấy Refresh Token hợp lệ." });
            }

            var (result, newRefreshToken) = await _authService.RefreshTokenAsync(refreshToken);
            AppendRefreshCookie(newRefreshToken);
            return Ok(result);
        }

        /// <summary>
        /// Xóa HttpOnly Refresh Token Cookie khi người dùng đăng xuất
        /// </summary>
        [AllowAnonymous]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            if (Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken))
            {
                _authService.Logout(refreshToken); // Thu hồi Refresh Token trên Server trước khi xóa Cookie
            }

            Response.Cookies.Delete(RefreshCookieName, BuildRefreshCookieOptions(DateTimeOffset.UtcNow.AddDays(-1)));
            return Ok(new { message = "Đã đăng xuất." });
        }
    }
}
