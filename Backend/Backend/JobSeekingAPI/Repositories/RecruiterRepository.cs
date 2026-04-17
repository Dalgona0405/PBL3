using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public class RecruiterRepository : BaseRepository<Recruiter>, IRecruiterRepository
    {
        public RecruiterRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Recruiter>> GetAllRecruitersWithDetailsAsync()
        {
            return await _context.Recruiters
                .AsNoTracking()
                .Include(r => r.User)
                .Include(r => r.Company)
                .Where(r => r.User != null && r.User.DeletedAt == null)
                .ToListAsync();
        }

        public async Task<Recruiter?> GetRecruiterDetailByIdAsync(int id)
        {
            return await _context.Recruiters
                .AsNoTracking()
                .Include(r => r.User)
                .Include(r => r.Company)
                .Include(r => r.Company!.Jobs.Where(j => j.DeletedAt == null && j.Status == 1))
                .FirstOrDefaultAsync(r => r.UserId == id && r.User != null && r.User.DeletedAt == null);
        }

        public async Task<Recruiter?> GetRecruiterEntityByIdAsync(int id)
        {
            return await _context.Recruiters
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.UserId == id && r.User != null && r.User.DeletedAt == null);
        }

        public async Task<IEnumerable<Recruiter>> GetRecruitersByCompanyAsync(int companyId)
        {
            return await _context.Recruiters
               .AsNoTracking()
               .Include(r => r.User)
               .Where(r => r.CompanyId == companyId && r.User != null && r.User.DeletedAt == null)
               .ToListAsync();
        }
    }
}