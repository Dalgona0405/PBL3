using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public class ApplicationRepository : BaseRepository<Application>, IApplicationRepository
    {
        public ApplicationRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Application>> GetAllApplicationsWithDetailsAsync()
        {
            return await _context.Applications
                .Include(a => a.Candidate!)
                    .ThenInclude(c => c.User)
                .Include(a => a.Job!)
                    .ThenInclude(j => j.Company)
                .Include(a => a.Job!)
                    .ThenInclude(j => j.Location)
                .Where(a => a.DeletedAt == null)
                .OrderByDescending(a => a.AppliedDate)
                .ToListAsync();
        }

        public async Task<Application?> GetApplicationDetailByIdAsync(int id)
        {
            return await _context.Applications
                .Include(a => a.Candidate!)
                    .ThenInclude(c => c.User)
                .Include(a => a.Job!)
                    .ThenInclude(j => j.Company)
                .FirstOrDefaultAsync(a => a.AppId == id && a.DeletedAt == null);
        }

        public async Task<Application> CreateApplicationDetailAsync(Application application)
        {
            application.AppliedDate = DateTime.Now;
            application.Status = 1;

            return await base.CreateAsync(application);
        }

        public async Task SoftDeleteApplicationAsync(int id)
        {
            var application = await GetByIdAsync(id);
            if (application != null)
            {
                application.DeletedAt = DateTime.Now;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<Application>> GetByJobIdAsync(int jobId)
        {
            return await _context.Applications
                .Include(a => a.Candidate!)
                    .ThenInclude(c => c.User)
                .Where(a => a.JobId == jobId && a.DeletedAt == null)
                .OrderByDescending(a => a.AppliedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Application>> GetByUserIdAsync(int userId)
        {
            return await _context.Applications
                .Include(a => a.Job!)
                    .ThenInclude(j => j.Company)
                .Where(a => a.UserId == userId && a.DeletedAt == null)
                .OrderByDescending(a => a.AppliedDate)
                .ToListAsync();
        }

        public async Task<bool> IsAppliedAsync(int userId, int jobId)
        {
            return await _context.Applications
                .AnyAsync(a => a.UserId == userId && a.JobId == jobId && a.DeletedAt == null);
        }

        public async Task<int> GetApplicationCountByJobIdAsync(int jobId)
        {
            return await _context.Applications
                .CountAsync(a => a.JobId == jobId && a.DeletedAt == null);
        }

        public async Task<Dictionary<int, int>> GetApplicationStatusStatisticsAsync(int jobId)
        {
            return await _context.Applications
                .Where(a => a.JobId == jobId && a.DeletedAt == null)
                .GroupBy(a => a.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Status, x => x.Count);
        }
    }
}