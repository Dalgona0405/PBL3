using JobSeekingAPI.DTOs;
using JobSeekingAPI.Repositories;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepo;
        private readonly JwtService _jwtService;

        public AuthController(IUserRepository userRepo, JwtService jwtService)
        {
            _userRepo = userRepo;
            _jwtService = jwtService;
        }

        // POST: api/users/register
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] CreateUserDTO userDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Kiểm tra email đã tồn tại chưa
            var emailExists = await _userRepo.IsEmailExistsAsync(userDto.Email);
            if (emailExists)
                return Conflict(new { message = "Email already exists." });

            var newUser = await _userRepo.RegisterUserAsync(userDto);

            // Không trả về mật khẩu
            var result = new
            {
                newUser.UserId,
                newUser.Email,
                newUser.FullName,
                newUser.Role
            };

            return CreatedAtAction(nameof(Register), new { id = newUser.UserId }, result);
        }

        // POST: api/users/login
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO loginDto, [FromServices] JwtService jwtService)
        {
            // Bước 1: Tìm user bằng email
            var user = await _userRepo.GetByEmailAsync(loginDto.Email);
            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            // Bước 2: Kiểm tra mật khẩu đã mã hóa
            // Dùng BCrypt.Verify để so sánh mật khẩu người dùng nhập với chuỗi hash trong DB
            if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.Password))
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            // Bước 3: Cập nhật LastLogin
            user.LastLogin = DateTime.UtcNow;
            await _userRepo.UpdateAsync(user);

            // Bước 4: Tạo JWT Token
            var token = jwtService.GenerateToken(user); // Truyền cả object user vào để lấy thêm thông tin

            // Bước 5: Trả về kết quả
            return Ok(new
            {
                message = "Login successful",
                token,
                user = new
                {
                    id = user.UserId,
                    email = user.Email,
                    role = user.Role,
                    name = user.FullName,
                    avatar = user.Avatar
                }
            });
        }
    }
}
