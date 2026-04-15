using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.Models;
using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Repositories
{
    public class JobRepository : BaseRepository<Job>, IJobRepository
    {
        public JobRepository(ApplicationDbContext context) : base(context)
        {
        }
        
        // ===== CRUD =====
        public async Task<IEnumerable<Job>> GetAllJobsWithDetailsAsync()
        {
            return await _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Location)
                .Include(j => j.JobTags).ThenInclude(jt => jt.Tag)
                .Where(j => j.DeletedAt == null)
                .ToListAsync();
        }
        
        public async Task<Job?> GetJobDetailByIdAsync(int id)
        {
            return await _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Location)
                .Include(j => j.JobTags).ThenInclude(jt => jt.Tag)
                .Include(j => j.Applications)
                .ThenInclude(a => a.Candidate)
                .ThenInclude(c => c!.User)
                .FirstOrDefaultAsync(j => j.JobId == id && j.DeletedAt == null);
        }
        public async Task<Job> CreateJobWithDefaultsAsync(Job job)
        {
            job.PostedDate = DateTime.Now;
            job.Status = 1;
            job.ViewCount = 0;

            return await base.CreateAsync(job);
        }
        public async Task SoftDeleteJobAsync(int id)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job != null)
            {
                job.DeletedAt = DateTime.Now;
                await _context.SaveChangesAsync();
            }
        }
        public async Task<Job?> GetJobEntityByIdAsync(int id)
        {
            return await _context.Jobs.FirstOrDefaultAsync(j => j.JobId == id && j.DeletedAt == null);
        }

        // ===== TÌM KIẾM NÂNG CAO =====
        public async Task<PagedResultDTO<Job>> SearchJobsAsync(JobSearchDTO searchParams)
        {
            var query = _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Location)
                .Include(j => j.JobTags).ThenInclude(jt => jt.Tag)
                .Where(j => j.DeletedAt == null && j.Status == 1)
                .AsQueryable();
            
            // 🔍 Lọc theo từ khóa
            if (!string.IsNullOrWhiteSpace(searchParams.Keyword))
            {
                var keyword = searchParams.Keyword.ToLower();
                query = query.Where(j => 
                    (j.Title != null && j.Title.ToLower().Contains(keyword)) ||
                    (j.Description != null && j.Description.ToLower().Contains(keyword)) ||
                    (j.Requirement != null && j.Requirement.ToLower().Contains(keyword)) ||
                    (j.Company != null && j.Company.CompanyName != null && 
                     j.Company.CompanyName.ToLower().Contains(keyword)));
            }
            
            // 📍 Lọc theo địa điểm
            if (searchParams.LocationId.HasValue)
            {
                query = query.Where(j => j.LocationId == searchParams.LocationId);
            }
            
            // 🏷️ Lọc theo tag
            if (searchParams.TagId.HasValue)
            {
                query = query.Where(j => j.JobTags.Any(jt => jt.TagId == searchParams.TagId));
            }
            
            // 💰 Lọc theo lương
            if (searchParams.MinSalary.HasValue)
            {
                query = query.Where(j => 
                    (j.SalaryMax.HasValue && j.SalaryMax >= searchParams.MinSalary) ||
                    (j.SalaryMin.HasValue && j.SalaryMin >= searchParams.MinSalary));
            }
            
            if (searchParams.MaxSalary.HasValue)
            {
                query = query.Where(j => 
                    (j.SalaryMin.HasValue && j.SalaryMin <= searchParams.MaxSalary) ||
                    (j.SalaryMax.HasValue && j.SalaryMax <= searchParams.MaxSalary));
            }
            
            // 📊 Lọc theo kinh nghiệm
            //if (searchParams.ExpYear.HasValue)
            //{
            //    query = query.Where(j => !j.ExpYear.HasValue || j.ExpYear <= searchParams.ExpYear);
            //}
            
            // 🎯 Lọc theo cấp bậc
            if (!string.IsNullOrWhiteSpace(searchParams.Level))
            {
                query = query.Where(j => j.Level != null && j.Level == searchParams.Level);
            }
            
            // 📄 Đếm tổng số
            var totalCount = await query.CountAsync();
            
            // 📑 Phân trang
            var items = await query
                .OrderByDescending(j => j.PostedDate)
                .Skip((searchParams.Page - 1) * searchParams.PageSize)
                .Take(searchParams.PageSize)
                .ToListAsync();
            
            // 📦 Đóng gói kết quả
            return new PagedResultDTO<Job>
            {
                TotalCount = totalCount,
                Page = searchParams.Page,
                PageSize = searchParams.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)searchParams.PageSize),
                Data = items
            };
        }
        
        // ===== LỌC THEO QUAN HỆ =====
        public async Task<IEnumerable<Job>> GetJobsByCompanyAsync(int companyId)
        {
            return await _context.Jobs
                .Where(j => j.CompanyId == companyId && j.DeletedAt == null)
                .Include(j => j.Location)
                .OrderByDescending(j => j.PostedDate)
                .ToListAsync();
        }
        
        public async Task<IEnumerable<Job>> GetJobsByLocationAsync(int locationId)
        {
            return await _context.Jobs
                .Where(j => j.LocationId == locationId && j.DeletedAt == null)
                .Include(j => j.Company)
                .OrderByDescending(j => j.PostedDate)
                .ToListAsync();
        }
        
        public async Task<IEnumerable<Job>> GetJobsByTagAsync(int tagId)
        {
            return await _context.Jobs
                .Where(j => j.JobTags.Any(jt => jt.TagId == tagId) && j.DeletedAt == null)
                .Include(j => j.Company)
                .Include(j => j.Location)
                .OrderByDescending(j => j.PostedDate)
                .ToListAsync();
        }
        
        // ===== THỐNG KÊ =====
        public async Task<int> GetTotalJobsCountAsync()
        {
            return await _context.Jobs
                .Where(j => j.DeletedAt == null && j.Status == 1)  // ✅ FIX: IsActive -> Status == 1
                .CountAsync();
        }
        
        public async Task<Dictionary<string, int>> GetJobsByLevelAsync()
        {
            return await _context.Jobs
                .Where(j => j.DeletedAt == null && j.Level != null)
                .GroupBy(j => j.Level)
                .Select(g => new { Level = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Level!, x => x.Count);
        }
        
        public async Task<IEnumerable<Job>> GetRecentJobsAsync(int count)
        {
            return await _context.Jobs
                .Where(j => j.DeletedAt == null && j.Status == 1)  // ✅ FIX: IsActive -> Status == 1
                .Include(j => j.Company)
                .Include(j => j.Location)
                .OrderByDescending(j => j.PostedDate)
                .Take(count)
                .ToListAsync();
        }
    }
}