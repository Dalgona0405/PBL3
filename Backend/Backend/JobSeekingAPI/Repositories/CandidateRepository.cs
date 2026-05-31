using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace JobSeekingAPI.Repositories
{
    public class CandidateRepository : BaseRepository<Candidate>, ICandidateRepository
    {
        public CandidateRepository(ApplicationDbContext context) : base(context)
        {
        }

        //CRUD ĐẶC THÙ
        public async Task<IEnumerable<Candidate>> GetAllCandidatesWithDetailsAsync()
        {
            return await _context.Candidates
                .AsNoTracking()
                .Include(c => c.User)
                .Include(c => c.Experiences)
                .Include(c => c.CandidateTags)
                    .ThenInclude(ct => ct.Tag)
                .Where(c => c.User != null && c.User.DeletedAt == null)
                .ToListAsync();
        }

        public async Task<Candidate?> GetCandidateDetailByIdAsync(int id)
        {
            return await _context.Candidates
                .AsNoTracking()
                .Include(c => c.User)
                .Include(c => c.Experiences)
                .Include(c => c.CandidateTags)
                    .ThenInclude(ct => ct.Tag)
                .FirstOrDefaultAsync(c => c.UserId == id && c.User != null && c.User.DeletedAt == null);
        }

        public async Task<Candidate?> GetCandidateEntityByIdAsync(int id)
        {
            return await _context.Candidates
                .Include(c => c.User)
                .Include(c => c.Experiences)
                .Include(c => c.CandidateTags)
                .FirstOrDefaultAsync(c => c.UserId == id && c.User != null && c.User.DeletedAt == null);
        }

        // Tìm kiếm Ứng viên
        public async Task<PagedResultDTO<CandidateSummaryDTO>> SearchCandidatesAsync(string? keyword, int? tagId, int page, int pageSize)
        {
            var query = _context.Candidates
                .AsNoTracking()
                .Where(c => c.User != null && c.User.DeletedAt == null)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(c =>
                    (c.User != null && c.User.FullName.ToLower().Contains(keyword)) ||
                    (c.Phone != null && c.Phone.Contains(keyword)) ||
                    c.Experiences.Any(e => e.JobTitle.ToLower().Contains(keyword) || e.CompanyName.ToLower().Contains(keyword)));
            }

            if (tagId.HasValue)
            {
                query = query.Where(c => c.CandidateTags.Any(ct => ct.TagId == tagId));
            }

            var totalCount = await query.CountAsync();
            var candidates = await query
                .OrderBy(c => c.User!.FullName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CandidateSummaryDTO
                {
                    UserId = c.UserId,
                    FullName = c.User!.FullName,
                    Avatar = c.User.Avatar,
                    CVUrl = c.CVUrl,
                    Email = c.User.Email,
                    Skills = c.CandidateTags.Where(ct => ct.Tag != null).Select(ct => ct.Tag!.TagName).Take(5).ToList()
                })
                .ToListAsync();

            return new PagedResultDTO<CandidateSummaryDTO>
            {
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Items = candidates
            };
        }

        public async Task<int> GetTotalCandidatesCountAsync()
        {
            return await _context.Candidates
               .AsNoTracking()
               .CountAsync(c => c.User != null && c.User.DeletedAt == null);
        }

        // Các hàm quản lý kỹ năng (Tag)
        public async Task UpdateCandidateTagsAsync(int candidateId, List<CandidateTagDTO> newTags)
        {
            var existingTags = await _context.CandidateTags
                .Where(ct => ct.UserId == candidateId)
                .ToListAsync();

            _context.CandidateTags.RemoveRange(existingTags);

            if (newTags != null && newTags.Any())
            {
                var tagsToAdd = newTags.Select(t => new CandidateTag
                {
                    UserId = candidateId,
                    TagId = t.TagId,
                    Proficiency = t.Proficiency
                });
                await _context.CandidateTags.AddRangeAsync(tagsToAdd);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<CandidateTag>> GetTagsByCandidateIdAsync(int candidateId)
        {
            return await _context.CandidateTags
                .Include(ct => ct.Tag)
                .Where(ct => ct.UserId == candidateId)
                .ToListAsync();
        }

        // =========================================================
        // TÍNH NĂNG LƯU VIỆC LÀM (BOOKMARK)
        // =========================================================
        public async Task SaveJobAsync(int userId, int jobId)
        {
            var exists = await IsJobSavedAsync(userId, jobId);
            if (!exists)
            {
                var savedJob = new SavedJob { UserId = userId, JobId = jobId, SavedAt = DateTime.UtcNow };
                await _context.SavedJobs.AddAsync(savedJob);
                await _context.SaveChangesAsync();
            }
        }

        public async Task UnsaveJobAsync(int userId, int jobId)
        {
            var savedJob = await _context.SavedJobs.FirstOrDefaultAsync(sj => sj.UserId == userId && sj.JobId == jobId);
            if (savedJob != null)
            {
                _context.SavedJobs.Remove(savedJob);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> IsJobSavedAsync(int userId, int jobId)
        {
            return await _context.SavedJobs.AnyAsync(sj => sj.UserId == userId && sj.JobId == jobId);
        }

        public async Task<IEnumerable<JobSummaryDTO>> GetSavedJobsAsync(int userId)
        {
            return await _context.SavedJobs
                .AsNoTracking()
                .Where(sj => sj.UserId == userId && sj.Job!.DeletedAt == null && sj.Job.Status == 1)
                .OrderByDescending(sj => sj.SavedAt)
                .Select(sj => new JobSummaryDTO
                {
                    JobId = sj.Job!.JobId,
                    Title = sj.Job.Title,
                    SalaryMin = sj.Job.SalaryMin,
                    SalaryMax = sj.Job.SalaryMax,
                    ExpYear = sj.Job.ExpYear,
                    Level = sj.Job.Level,
                    CompanyName = sj.Job.Company!.CompanyName,
                    LogoImg = sj.Job.Company.LogoImg,
                    LocationName = sj.Job.Location!.LocationName,
                    PostedDate = sj.Job.PostedDate,
                    Deadline = sj.Job.Deadline,
                    Status = sj.Job.Status
                })
                .ToListAsync();
        }
    }
}