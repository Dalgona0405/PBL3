using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace JobSeekingAPI.Services
{
    /// <summary>
    /// Xử lý nghiệp vụ đăng ký tài khoản, đăng nhập và xác thực OAuth qua Google
    /// </summary>
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepo;
        private readonly JwtService _jwtService;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private readonly IMemoryCache _cache;

        public AuthService(
            IUserRepository userRepo,
            JwtService jwtService,
            HttpClient httpClient,
            IConfiguration config,
            IMemoryCache cache)
        {
            _userRepo = userRepo;
            _jwtService = jwtService;
            _httpClient = httpClient;
            _config = config;
            _cache = cache;
        }

        /// <summary>
        /// Đăng ký tài khoản mới sau khi kiểm tra trùng lặp Email
        /// </summary>
        public async Task<RegisterResponseDTO> RegisterAsync(CreateUserDTO userDto)
        {
            var emailExists = await _userRepo.IsEmailExistsAsync(userDto.Email);
            if (emailExists)
                throw new ArgumentException("Email này đã được sử dụng.");

            var newUser = await _userRepo.RegisterUserAsync(userDto);

            return new RegisterResponseDTO
            {
                UserId = newUser.UserId,
                Email = newUser.Email,
                FullName = newUser.FullName,
                Role = newUser.Role
            };
        }

        private (object Response, string RefreshToken) BuildAuthResult(User user, string message)
        {
            var token = _jwtService.GenerateToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken(user);
            var response = new
            {
                message,
                token,
                user = new
                {
                    id = user.UserId,
                    email = user.Email,
                    role = user.Role,
                    name = user.FullName,
                    avatar = user.Avatar
                }
            };
            return (response, refreshToken);
        }

        /// <summary>
        /// Xác thực thông tin đăng nhập, cập nhật thời điểm truy cập gần nhất và cấp JWT Token
        /// </summary>
        public async Task<object> LoginAsync(LoginDTO loginDto)
        {
            var (response, _) = await LoginWithRefreshAsync(loginDto);
            return response;
        }

        public async Task<(object Response, string RefreshToken)> LoginWithRefreshAsync(LoginDTO loginDto)
        {
            string normalizedEmail = loginDto.Email.Trim().ToLowerInvariant();
            string lockoutCacheKey = $"LoginLockout_{normalizedEmail}";

            if (_cache.TryGetValue(lockoutCacheKey, out int failedAttempts) && failedAttempts >= 5)
                throw new UnauthorizedAccessException("Tài khoản tạm bị khóa 5 phút do nhập sai mật khẩu quá 5 lần liên tiếp");

            var user = await _userRepo.GetByEmailAsync(loginDto.Email);
            if (user == null || user.DeletedAt != null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.Password))
            {
                _cache.Set(lockoutCacheKey, failedAttempts + 1, TimeSpan.FromMinutes(5));
                throw new UnauthorizedAccessException("Email hoặc mật khẩu không chính xác.");
            }

            _cache.Remove(lockoutCacheKey);

            user.LastLogin = DateTime.UtcNow;
            await _userRepo.UpdateAsync(user);

            return BuildAuthResult(user, "Đăng nhập thành công.");
        }

        /// <summary>
        /// Xác thực Google ID Token với máy chủ Google và liên kết hoặc khởi tạo tài khoản tự động
        /// </summary>
        public async Task<object> GoogleLoginAsync(GoogleLoginDTO googleDto, CancellationToken cancellationToken = default)
        {
            var (response, _) = await GoogleLoginWithRefreshAsync(googleDto, cancellationToken);
            return response;
        }

        public async Task<(object Response, string RefreshToken)> GoogleLoginWithRefreshAsync(GoogleLoginDTO googleDto, CancellationToken cancellationToken = default)
        {
            var configuredClientId = _config["Google:ClientId"];
            if (string.IsNullOrWhiteSpace(configuredClientId))
            {
                throw new InvalidOperationException("Hệ thống chưa cấu hình Google:ClientId để xác thực OAuth 2.0.");
            }

            var verifyUrl = $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(googleDto.IdToken)}";
            var response = await _httpClient.GetAsync(verifyUrl, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new UnauthorizedAccessException("Google ID Token không hợp lệ hoặc đã hết hạn.");
            }

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            var root = doc.RootElement;

            // Bắt buộc kiểm tra khớp Audience ('aud') với Google:ClientId của hệ thống
            var tokenAud = root.TryGetProperty("aud", out var audProp) ? audProp.GetString() : null;
            if (!string.Equals(tokenAud, configuredClientId, StringComparison.Ordinal))
            {
                throw new UnauthorizedAccessException("Google Token không thuộc về ứng dụng này (Audience mismatch).");
            }

            // Bắt buộc kiểm tra email_verified == true trước khi cho phép tự động liên kết tài khoản
            var emailVerified = root.TryGetProperty("email_verified", out var evProp) ? evProp.ToString() : "false";
            if (!string.Equals(emailVerified, "true", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Email trên tài khoản Google của bạn chưa được xác minh.");
            }

            var email = root.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
            var googleSub = root.TryGetProperty("sub", out var subProp) ? subProp.GetString() : null;
            var fullName = root.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : email?.Split('@')[0];
            var picture = root.TryGetProperty("picture", out var picProp) ? picProp.GetString() : null;

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(googleSub))
            {
                throw new UnauthorizedAccessException("Không thể trích xuất thông tin định danh từ Google Token.");
            }

            var user = await _userRepo.FindOrCreateGoogleUserAsync(
                email,
                fullName ?? "Google User",
                picture,
                googleSub,
                googleDto.Role);

            return BuildAuthResult(user, "Đăng nhập bằng Google thành công.");
        }

        public async Task<(object Response, string RefreshToken)> RefreshTokenAsync(string refreshToken)
        {
            var userId = _jwtService.ValidateRefreshToken(refreshToken);
            if (!userId.HasValue)
            {
                throw new UnauthorizedAccessException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
            }

            // Thu hồi ngay Refresh Token cũ vừa sử dụng (Token Rotation)
            _jwtService.RevokeRefreshToken(refreshToken);

            var user = await _userRepo.GetByIdAsync(userId.Value);
            if (user == null || user.DeletedAt != null)
            {
                throw new UnauthorizedAccessException("Tài khoản không tồn tại hoặc đã bị khóa.");
            }

            return BuildAuthResult(user, "Làm mới phiên đăng nhập thành công.");
        }

        public void Logout(string? refreshToken)
        {
            if (!string.IsNullOrWhiteSpace(refreshToken))
            {
                _jwtService.RevokeRefreshToken(refreshToken);
            }
        }
    }
}
