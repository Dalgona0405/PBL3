using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public class UserRepository : BaseRepository<User>, IUserRepository
    {
        public UserRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email && u.DeletedAt == null);
        }

        public async Task<bool> IsEmailExistsAsync(string email)
        {
            return await _context.Users
                .AnyAsync(u => u.Email == email && u.DeletedAt == null);
        }

        public async Task<IEnumerable<User>> GetAllUsersWithDetailsAsync()
        {
            return await _context.Users
                .Include(u => u.Candidate)
                .Include(u => u.Recruiter)
                .Where(u => u.DeletedAt == null)
                .ToListAsync();
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
                user.DeletedAt = DateTime.Now;
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
            return await _context.Recruiters
                .Include(r => r.User)
                .Include(r => r.Company)
                .FirstOrDefaultAsync(r => r.UserId == userId);
        }
    }
}