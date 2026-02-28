using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context;
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

        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _context.Users
                .Include(u => u.Candidate)
                .Include(u => u.Recruiter)
                .Where(u => u.DeletedAt == null)
                .ToListAsync();
        }

        public async Task<User?> GetByIdAsync(int id)
        {
            return await _context.Users
                .Include(u => u.Candidate)
                .Include(u => u.Recruiter)
                .FirstOrDefaultAsync(u => u.UserId == id && u.DeletedAt == null);
        }

        public async Task<User> CreateAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task UpdateAsync(User user)
        {
            _context.Entry(user).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
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