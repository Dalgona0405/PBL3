using JobSeekingAPI.DTOs;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 100)
        {
            var users = await _userRepository.GetAllAsync();
            var dtos = users.Select(u => MapToDTO(u));
            var total = dtos.Count();
            var paged = dtos.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            var result = new
            {
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)System.Math.Ceiling(total / (double)pageSize),
                Data = paged
            };

            return Ok(result);
        }

        // GET: api/users/{id}
        [Authorize(Roles = "Admin")]
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

        // PUT: api/users/{id}
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDTO updateUserDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            if (id != User.GetUserIdFromToken()) 
                return Forbid();

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
                existingUser.Candidate.User.Avatar = updateUserDto.Avatar ?? existingUser.Candidate.User.Avatar;
                existingUser.Candidate.User.LastLogin = DateTime.UtcNow;
                existingUser.Password = updateUserDto.NewPassword != null ? BCrypt.Net.BCrypt.HashPassword(updateUserDto.NewPassword) : existingUser.Password;
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
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string? keyword,
                                                     [FromQuery] string? role,
                                                     [FromQuery] int page = 1,
                                                     [FromQuery] int pageSize = 20)
        {
            var allUsers = await _userRepository.GetAllAsync();
            var query = allUsers
                .Where(u => u.DeletedAt == null)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(u =>
                    (u.Email != null && u.Email.Contains(keyword)) ||
                    (u.Candidate != null && u.FullName != null && u.FullName.Contains(keyword)) ||
                    (u.Recruiter != null && u.Recruiter.User != null && u.FullName != null && u.FullName.Contains(keyword)) ||
                    (u.Candidate != null && u.Candidate.Phone != null && u.Candidate.Phone.Contains(keyword)));
            }

            if (!string.IsNullOrWhiteSpace(role))
            {
                query = query.Where(u => u.Role == role);
            }

            var totalCount = query.Count();
            var users = query
                .OrderBy(u => u.Candidate != null ? u.FullName :
                            (u.Recruiter != null && u.Recruiter.User != null ? u.FullName : ""))
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserListDTO
                {
                    UserId = u.UserId,
                    Email = u.Email,
                    FullName = u.Candidate != null ? u.FullName :
                              (u.Recruiter != null && u.Recruiter.User != null ? u.FullName : ""),
                    Role = u.Role,
                    Avatar = u.Candidate != null ? u.Candidate.User != null ? u.Candidate.User.Avatar : null : (u.Recruiter != null ? u.Recruiter.User != null ? u.Recruiter.User.Avatar : null : null),
                    CompanyName = u.Recruiter != null && u.Recruiter.Company != null
                                ? u.Recruiter.Company.CompanyName : null,
                    LastLogin = u.LastLogin
                })
                .ToList();

            var result = new
            {
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)System.Math.Ceiling(totalCount / (double)pageSize),
                Data = users
            };

            return Ok(result);
        }

        // GET: api/users/profile
        [HttpGet("profile")]
        public async Task<IActionResult> GetCurrentUserProfile()
        {
            var userId = User.GetUserIdFromToken();
            return await GetUserById(userId);
        }

        // PUT: api/users/{id}/change-password
        [Authorize]
        [HttpPut("{id}/change-password")]
        public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordDTO changePasswordDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            if(id != User.GetUserIdFromToken())
                return Forbid();

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
                Role = user.Role,
                Avatar = user.Candidate != null ? user.Candidate.User != null ? user.Candidate.User.Avatar : null : (user.Recruiter != null ? user.Recruiter.User != null ? user.Recruiter.User.Avatar : null : null),
                LastLogin = user.LastLogin,
                DeletedAt = user.DeletedAt
            };
        }
    }
}