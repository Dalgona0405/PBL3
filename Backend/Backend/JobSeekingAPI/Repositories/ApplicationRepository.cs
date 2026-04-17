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

        // CRUD ĐẶC THÙ
        public async Task<IEnumerable<Application>> GetAllApplicationsWithDetailsAsync()
        {
            return await _context.Applications
                .AsNoTracking()
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
                .AsNoTracking()
                .Include(a => a.Candidate!)
                    .ThenInclude(c => c.User)
                .Include(a => a.Job!)
                    .ThenInclude(j => j.Company)
                .FirstOrDefaultAsync(a => a.AppId == id && a.DeletedAt == null);
        }

        public async Task<Application?> GetApplicationEntityByIdAsync(int id)
        {
            return await _context.Applications
                .FirstOrDefaultAsync(a => a.AppId == id && a.DeletedAt == null);
        }

        public async Task<Application> CreateApplicationDetailAsync(Application application)
        {
            application.AppliedDate = DateTime.UtcNow;
            application.Status = 0; //0: Pending (chờ duyệt)

            return await base.CreateAsync(application);
        }

        public async Task SoftDeleteApplicationAsync(int id)
        {
            var application = await GetByIdAsync(id);
            if (application != null)
            {
                application.DeletedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        // LỌC THEO QUAN HỆ
        public async Task<IEnumerable<Application>> GetByJobIdAsync(int jobId)
        {
            return await _context.Applications
                .AsNoTracking()
                .Include(a => a.Candidate!)
                    .ThenInclude(c => c.User)
                .Where(a => a.JobId == jobId && a.DeletedAt == null)
                .OrderByDescending(a => a.AppliedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Application>> GetByUserIdAsync(int userId)
        {
            return await _context.Applications
                .AsNoTracking()
                .Include(a => a.Job!)
                    .ThenInclude(j => j.Company)
                .Where(a => a.UserId == userId && a.DeletedAt == null)
                .OrderByDescending(a => a.AppliedDate)
                .ToListAsync();
        }

        // KIỂM TRA & THỐNG KÊ
        public async Task<bool> IsAppliedAsync(int userId, int jobId)
        {
            return await _context.Applications
                .AsNoTracking()
                .AnyAsync(a => a.UserId == userId && a.JobId == jobId && a.DeletedAt == null);
        }

        public async Task<int> GetApplicationCountByJobIdAsync(int jobId)
        {
            return await _context.Applications
                .AsNoTracking()
                .CountAsync(a => a.JobId == jobId && a.DeletedAt == null);
        }

        public async Task<Dictionary<int, int>> GetApplicationStatusStatisticsAsync(int jobId)
        {
            // Trả về kiểu: { 0: 10, 1: 5, 2: 3 } -> (10 Pending, 5 Accepted, 3 Rejected)
            return await _context.Applications
                .AsNoTracking()
                .Where(a => a.JobId == jobId && a.DeletedAt == null)
                .GroupBy(a => a.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Status, x => x.Count);
        }
    }
}