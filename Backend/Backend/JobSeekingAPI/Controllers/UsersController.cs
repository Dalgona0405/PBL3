using Microsoft.AspNetCore.Mvc;
using JobSeekingAPI.Models;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Repositories;
using JobSeekingAPI.Services;
using Microsoft.EntityFrameworkCore;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UsersController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // GET: api/users
        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userRepository.GetAllUsersWithDetailsAsync();
            var dtos = users.Select(u => MapToDTO(u));
            return Ok(dtos);
        }

        // GET: api/users/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var user = await _userRepository.GetUserDetailByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }
            var dto = MapToDTO(user);
            return Ok(dto);
        }

        // POST: api/users/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] CreateUserDTO userDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Kiểm tra email đã tồn tại chưa
            var emailExists = await _userRepository.IsEmailExistsAsync(userDto.Email);
            if (emailExists)
                return Conflict(new { message = "Email already exists." });

            var newUser = await _userRepository.RegisterUserAsync(userDto);

            // Không trả về mật khẩu
            var result = new
            {
                newUser.UserId,
                newUser.Email,
                newUser.FullName,
                newUser.Role
            };

            return CreatedAtAction(nameof(GetUserById), new { id = newUser.UserId }, result);
        }

        // POST: api/users/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO loginDto, [FromServices] JwtService jwtService)
        {
            // Bước 1: Tìm user bằng email
            var user = await _userRepository.GetByEmailAsync(loginDto.Email);
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
            await _userRepository.UpdateAsync(user);

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

        // PUT: api/users/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDTO updateUserDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingUser = await _userRepository.GetUserDetailByIdAsync(id);
            if (existingUser == null)
                return NotFound("User not found");

            if (!string.IsNullOrWhiteSpace(updateUserDto.NewPassword))
            {
                existingUser.Password = BCrypt.Net.BCrypt.HashPassword(updateUserDto.NewPassword);
            }

            // Update Candidate if exists
            if (existingUser.Candidate != null)
            {
                existingUser.FullName = updateUserDto.FullName ?? existingUser.FullName;
                existingUser.Candidate.Phone = updateUserDto.Phone ?? existingUser.Candidate.Phone;
                existingUser.Candidate.Address = updateUserDto.Address ?? existingUser.Candidate.Address;
            }
            else if (existingUser.Role == "Recruiter")
            {
                // Update Recruiter nếu cần
                // Code sẽ thêm sau
            }

            await _userRepository.UpdateAsync(existingUser);
            return Ok(new { message = "User updated successfully" });
        }

        // DELETE: api/users/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _userRepository.GetUserDetailByIdAsync(id);

            if (user == null)
                return NotFound("User not found");

            user.DeletedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            return Ok(new { message = "User deleted successfully" });
        }

        // GET: api/users/search
        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string? keyword,
                                                     [FromQuery] string? role,
                                                     [FromQuery] int page = 1,
                                                     [FromQuery] int pageSize = 20)
        {
            var query = _userRepository.GetAllUsersWithDetailsAsync()
                .Result
                .AsQueryable()
                .Where(u => u.DeletedAt == null);

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(u =>
                    u.Email.Contains(keyword) ||
                    (u.Candidate != null && u.FullName.Contains(keyword)) ||
                    (u.Recruiter != null && u.Recruiter.User != null && u.FullName.Contains(keyword)) ||
                    (u.Candidate != null && u.Candidate.Phone != null && u.Candidate.Phone.Contains(keyword)));
            }

            if (!string.IsNullOrWhiteSpace(role))
            {
                query = query.Where(u => u.Role == role);
            }

            var totalCount = await query.CountAsync();
            var users = await query
                .OrderBy(u => u.Candidate != null ? u.FullName :
                            (u.Recruiter != null && u.Recruiter.User != null ? u.FullName : ""))  // ✅ FIX
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserListDTO
                {
                    UserId = u.UserId,
                    Email = u.Email,
                    FullName = u.Candidate != null ? u.FullName :
                              (u.Recruiter != null && u.Recruiter.User != null ? u.FullName : ""),  // ✅ FIX
                    Role = u.Role,
                    Avatar = u.Candidate != null ? u.Candidate.User != null ? u.Candidate.User.Avatar : null : (u.Recruiter != null ? u.Recruiter.User != null ? u.Recruiter.User.Avatar : null : null),  // ✅ FIX
                    CompanyName = u.Recruiter != null && u.Recruiter.Company != null
                                ? u.Recruiter.Company.CompanyName : null,
                    LastLogin = u.LastLogin
                })
                .ToListAsync();

            var result = new
            {
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Data = users
            };

            return Ok(result);
        }

        // GET: api/users/profile
        [HttpGet("profile")]
        public async Task<IActionResult> GetCurrentUserProfile()
        {
            // TODO: Lấy UserId từ JWT token
            var userId = 1;
            return await GetUserById(userId);
        }

        // PUT: api/users/{id}/change-password
        [HttpPut("{id}/change-password")]
        public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordDTO changePasswordDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userRepository.GetByIdAsync(id);

            if (user == null)
                return NotFound("User not found");

            if (!BCrypt.Net.BCrypt.Verify(changePasswordDto.CurrentPassword, user.Password))
                return BadRequest(new { message = "Current password is incorrect" });

            user.Password = BCrypt.Net.BCrypt.HashPassword(changePasswordDto.NewPassword);
            await _userRepository.UpdateAsync(user);

            return Ok(new { message = "Password changed successfully" });
        }

        private UserDetailDTO MapToDTO(User user)
        {
            return new UserDetailDTO
            {
                UserId = user.UserId,
                Email = user.Email,
                FullName = user.FullName,
                Phone = user.Candidate != null ? user.Candidate.Phone : null,
                Address = user.Candidate != null ? user.Candidate.Address : null,
                Role = user.Role,
                Avatar = user.Candidate != null ? user.Candidate.User != null ? user.Candidate.User.Avatar : null : (user.Recruiter != null ? user.Recruiter.User != null ? user.Recruiter.User.Avatar : null : null),
                LastLogin = user.LastLogin,
                DeletedAt = user.DeletedAt
            };
        }
    }
}