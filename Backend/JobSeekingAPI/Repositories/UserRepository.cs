using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Models;
using Microsoft.EntityFrameworkCore;

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
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
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
                if (user.Role == UserRoles.Candidate)
                {
                    var candidate = new Candidate
                    {
                        UserId = user.UserId
                    };
                    _context.Candidates.Add(candidate);
                }
                else if (user.Role == UserRoles.Recruiter)
                {
                    var rectuiter = new Recruiter
                    {
                        UserId = user.UserId,
                        Company = new Company
                        {
                            CompanyName = "Default Company Name"
                        }
                    };
                    _context.Recruiters.Add(rectuiter);
                }
                else if (user.Role == UserRoles.Company)
                {
                    var newCompany = new Company
                    {
                        CompanyName = userDto.FullName + "Company",
                        Size = "1-50"
                    };
                    var companyOwner = new Recruiter
                    {
                        UserId = user.UserId,
                        Company = newCompany,
                        Position = "CEO / Founder"
                    };
                    _context.Recruiters.Add(companyOwner);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return user;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<PagedResultDTO<UserListDTO>> GetAllUsersWithDetailsAsync(int page, int pageSize)
        {
            var query = _context.Users
                .AsNoTracking()
                .Where(u => u.DeletedAt == null);

            var totalCount = await query.CountAsync();

            var users = await query
                .OrderBy(u => u.FullName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserListDTO
                {
                    UserId = u.UserId,
                    Email = u.Email,
                    FullName = u.FullName,
                    Avatar = u.Avatar,
                    Role = u.Role,
                    CompanyName = u.Recruiter != null && u.Recruiter.Company != null ? u.Recruiter.Company.CompanyName : null
                })
                .ToListAsync();

            return new PagedResultDTO<UserListDTO>
            {
                Items = users,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };
        }

        public async Task<User?> GetUserDetailByIdAsync(int id)
        {
            return await _context.Users
                .Include(u => u.Candidate)
                .Include(u => u.Recruiter)
                .FirstOrDefaultAsync(u => u.UserId == id && u.DeletedAt == null);
        }

        public async Task SoftDeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user != null)
            {
                user.DeletedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Candidate?> GetCandidateProfileAsync(int userId)
        {
            return await _context.Candidates
                .Include(c => c.User)
                .Include(c => c.Experiences)
                .Include(c => c.CandidateTags).ThenInclude(ct => ct.Tag)
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }

        public async Task<Recruiter?> GetRecruiterProfileAsync(int userId)
        {
            return await _context.Recruiters.Include(r => r.User).Include(r => r.Company).FirstOrDefaultAsync(r => r.UserId == userId);
        }

        public async Task<PagedResultDTO<UserListDTO>> SearchUsersAsync(string? keyword, string? role, int page, int pageSize)
        {
            // 1. Tạo câu truy vấn (Chưa chạy ngay) và Include các bảng cần thiết
            var query = _context.Users
                .AsNoTracking()
                .Where(u => u.DeletedAt == null);

            // 2. Lọc theo từ khóa
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var lowerKeyword = keyword.ToLower();
                query = query.Where(u =>
                    (u.Email != null && u.Email.ToLower().Contains(lowerKeyword)) ||
                    (u.FullName != null && u.FullName.ToLower().Contains(lowerKeyword)) ||
                    (u.Candidate != null && u.Candidate.Phone != null && u.Candidate.Phone.Contains(lowerKeyword)));
            }

            // 3. Lọc theo Role
            if (!string.IsNullOrWhiteSpace(role))
            {
                query = query.Where(u => u.Role == role);
            }

            // 4. Đếm tổng số lượng (Để phân trang)
            var totalCount = await query.CountAsync();

            // 5. Phân trang và Map ra DTO (Lấy trực tiếp FullName và Avatar)
            var users = await query
                .OrderBy(u => u.FullName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserListDTO
                {
                    UserId = u.UserId,
                    Email = u.Email,
                    FullName = u.FullName, // Lấy trực tiếp, không cần check lằng nhằng nữa!
                    Role = u.Role,
                    Avatar = u.Avatar,     // Lấy trực tiếp luôn!
                    CompanyName = u.Recruiter != null && u.Recruiter.Company != null ? u.Recruiter.Company.CompanyName : null,
                    LastLogin = u.LastLogin
                })
                .ToListAsync(); // Lúc này mới thực sự chạy xuống Database lấy data lên

            return new PagedResultDTO<UserListDTO>
            {
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Items = users
            };
        }
    }
}