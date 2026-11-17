using JobSeekingAPI.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace JobSeekingAPI.Services
{
    /// <summary>
    /// Quản lý cấp phát, xác thực và thu hồi (Revocation) chuỗi JWT Access Token và Refresh Token
    /// </summary>
    public class JwtService
    {
        private readonly IConfiguration _configuration;
        private readonly IMemoryCache _cache;

        public JwtService(IConfiguration configuration, IMemoryCache cache)
        {
            _configuration = configuration;
            _cache = cache;
        }

        /// <summary>
        /// Khởi tạo JWT Token chứa thông tin UserId, Email, Role và FullName với thời hạn 7 ngày
        /// </summary>
        private byte[] GetSigningKeyBytes()
        {
            var keyString = _configuration.GetValue<string>("Jwt:SecretKey")
                        ?? throw new InvalidOperationException("Chưa cấu hình khóa bí mật JWT (Jwt:SecretKey).");
            return Encoding.UTF8.GetBytes(keyString);
        }

        private string CreateSignedToken(IEnumerable<Claim> claims, DateTime expiresAt)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = GetSigningKeyBytes();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = expiresAt,
                Issuer = "JobSeekingAPI",
                Audience = "JobSeekingClient",
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public string GenerateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role ?? "Candidate"),
                new Claim(ClaimTypes.Name, user.FullName ?? "")
            };

            return CreateSignedToken(claims, DateTime.UtcNow.AddMinutes(15));
        }


        public string GenerateRefreshToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim("token_type", "refresh")
            };

            return CreateSignedToken(claims, DateTime.UtcNow.AddDays(7));
        }

        /// <summary>
        /// Thu hồi (Blacklist) một Refresh Token khi người dùng Đăng xuất hoặc khi đã xoay vòng (Token Rotation)
        /// </summary>
        public void RevokeRefreshToken(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken)) return;
            _cache.Set($"RevokedRT_{refreshToken}", true, TimeSpan.FromDays(7));
        }

        public int? ValidateRefreshToken(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken)) return null;

            // Kiểm tra xem Refresh Token này đã bị thu hồi (Logout / Rotated) chưa
            if (_cache.TryGetValue($"RevokedRT_{refreshToken}", out _)) return null;

            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var principal = tokenHandler.ValidateToken(refreshToken, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(GetSigningKeyBytes()),
                    ValidateIssuer = true,
                    ValidIssuer = "JobSeekingAPI",
                    ValidateAudience = true,
                    ValidAudience = "JobSeekingClient",
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out _);

                var tokenType = principal.FindFirst("token_type")?.Value;
                if (!string.Equals(tokenType, "refresh", StringComparison.Ordinal))
                {
                    return null;
                }

                var userIdRaw = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                return int.TryParse(userIdRaw, out var userId) ? userId : null;
            }
            catch
            {
                return null;
            }
        }
    }
}