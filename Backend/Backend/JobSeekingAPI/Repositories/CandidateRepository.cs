using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.Models;
using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Repositories
{
    public class CandidateRepository : BaseRepository<Candidate>, ICandidateRepository
    {
        public CandidateRepository(ApplicationDbContext context) : base(context)
        {
        }

        // CRUD ĐẶC THÙ
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
                .Include(c => c.User)
                .Include(c => c.CandidateTags).ThenInclude(ct => ct.Tag)
                .Include(c => c.Experiences)
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
                Data = candidates
            };
        }

        public async Task<int> GetTotalCandidatesCountAsync()
        {
            return await _context.Candidates
               .AsNoTracking()
               .CountAsync(c => c.User != null && c.User.DeletedAt == null);
        }

        // Các hàm quản lý kinh nghiệm (Experience)
        public async Task<IEnumerable<Experience>> GetExperiencesByCandidateIdAsync(int candidateId)
        {
            return await _context.Experiences
                .Where(e => e.UserId == candidateId)
                .OrderByDescending(e => e.StartDate)
                .ToListAsync();
        }

        public async Task<Experience?> GetExperienceByIdAsync(int experienceId)
        {
            return await _context.Experiences.FindAsync(experienceId);
        }

        public async Task<Experience> AddExperienceAsync(Experience experience)
        {
            _context.Experiences.Add(experience);
            await _context.SaveChangesAsync();
            return experience;
        }

        public async Task UpdateExperienceAsync(Experience experience)
        {
            _context.Experiences.Update(experience);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteExperienceAsync(int experienceId)
        {
            var experience = await _context.Experiences.FindAsync(experienceId);
            if (experience != null)
            {
                _context.Experiences.Remove(experience);
                await _context.SaveChangesAsync();
            }
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
    }
}