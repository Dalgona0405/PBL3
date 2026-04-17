using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.Models;
using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Repositories
{
    public class UserRepository : BaseRepository<User>, IUserRepository
    {
        public UserRepository(ApplicationDbContext context) : base(context) { }

        public async Task<User?> GetByEmailAsync(string email)
        {
            // Khi login, cần lấy cả Candidate và Recruiter để tạo token
            return await _context.Users
                .Include(u => u.Candidate)
                .Include(u => u.Recruiter)
                .FirstOrDefaultAsync(u => u.Email == email && u.DeletedAt == null);
        }

        public async Task<bool> IsEmailExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email && u.DeletedAt == null);
        }

        // HÀM ĐĂNG KÝ
        public async Task<User> RegisterUserAsync(CreateUserDTO userDto)
        {
            // Tạo User cơ bản và mã hóa mật khẩu
            var user = new User
            {
                Email = userDto.Email,
                // Luôn luôn mã hóa mật khẩu trước khi lưu
                Password = BCrypt.Net.BCrypt.HashPassword(userDto.Password),
                Role = userDto.Role,
                FullName = userDto.FullName,
                Avatar = userDto.Avatar
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync(); // Lưu để user có UserId

            // Dựa vào Role, tạo profile tương ứng
            if (user.Role == "Candidate")
            {
                var candidate = new Candidate
                {
                    UserId = user.UserId,
                    Phone = userDto.Phone,
                    Address = userDto.Address
                };
                _context.Candidates.Add(candidate);
            }
            if (user.Role == "Recruiter")
            {
                var rectuiter = new Recruiter
                {
                    UserId = user.UserId,
                    Company = new Company
                    {
                        CompanyName = "Default Company Name" 
                    }
                };
            }

            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<IEnumerable<User>> GetAllUsersWithDetailsAsync()
        {
            return await _context.Users.Include(u => u.Candidate).Include(u => u.Recruiter).Where(u => u.DeletedAt == null).ToListAsync();
        }

        public async Task<User?> GetUserDetailByIdAsync(int id)
        {
            return await _context.Users.Include(u => u.Candidate).Include(u => u.Recruiter).FirstOrDefaultAsync(u => u.UserId == id && u.DeletedAt == null);
        }

        public async Task SoftDeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user != null)
            {
                user.DeletedAt = DateTime.Now;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Candidate?> GetCandidateProfileAsync(int userId)
        {
            return await _context.Candidates.Include(c => c.User).Include(c => c.Experiences).Include(c => c.CandidateTags).ThenInclude(ct => ct.Tag).FirstOrDefaultAsync(c => c.UserId == userId);
        }

        public async Task<Recruiter?> GetRecruiterProfileAsync(int userId)
        {
            return await _context.Recruiters.Include(r => r.User).Include(r => r.Company).FirstOrDefaultAsync(r => r.UserId == userId);
        }
    }
}