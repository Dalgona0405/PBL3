using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using JobSeekingAPI.Models;
using Microsoft.IdentityModel.Tokens;

namespace JobSeekingAPI.Services
{
    public class JwtService
    {
        // Nên đưa key này vào file appsettings.json để bảo mật hơn
        private readonly string _secretKey = "THIS_IS_A_VERY_SECRET_KEY_FOR_JOB_SEEKING_API_2026_SUPER_SAFE_AND_EXTRA_LONG";

        public string GenerateToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_secretKey);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()), // Subject = UserId
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("fullName", user.FullName) // Thêm các thông tin cần thiết khác
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7), // Token hết hạn sau 7 ngày
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}