using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace JobSeekingAPI.Repositories
{
    public class TagRepository : BaseRepository<Tag>, ITagRepository
    {
        public TagRepository(ApplicationDbContext context) : base(context)
        {
        }

        // CRUD ĐẶC THÙ
        public async Task<Tag?> GetTagDetailByIdAsync(int id)
        {
            return await _context.Tags
                .AsNoTracking()
                .Include(t => t.JobTags)
                    .ThenInclude(jt => jt.Job!)
                    .ThenInclude(j => j.Company)
                .Include(t => t.CandidateTags)
                    .ThenInclude(ct => ct.Candidate!)
                    .ThenInclude(c => c.User)
                .FirstOrDefaultAsync(t => t.TagId == id);
        }

        public async Task<Tag?> GetTagEntityByIdAsync(int id)
        {
            return await _context.Tags.FindAsync(id);
        }

        public async Task SoftDeleteTagAsync(int id)
        {
            await DeleteAsync(id);
        }

        // ===== THỐNG KÊ & DỰ BÁO XU HƯỚNG =====
        public async Task<IEnumerable<TagSummaryDTO>> GetAllTagsSummaryAsync()
        {
            // Bắt SQL tự đếm Count, không kéo cục Data nặng nề về RAM
            return await _context.Tags
                .AsNoTracking()
                .Select(t => new TagSummaryDTO
                {
                    TagId = t.TagId,
                    TagName = t.TagName,
                    Type = t.Type,
                    JobCount = t.JobTags.Count,
                    CandidateCount = t.CandidateTags.Count,
                    TotalUsage = t.JobTags.Count + t.CandidateTags.Count
                })
                .OrderBy(t => t.TagName)
                .ToListAsync();
        }

        public async Task<IEnumerable<TagSummaryDTO>> GetPopularTagsAsync(int count)
        {
            return await _context.Tags
                .AsNoTracking()
                .Select(t => new TagSummaryDTO
                {
                    TagId = t.TagId,
                    TagName = t.TagName,
                    Type = t.Type,
                    JobCount = t.JobTags.Count,
                    CandidateCount = t.CandidateTags.Count,
                    TotalUsage = t.JobTags.Count + t.CandidateTags.Count
                })
                .OrderByDescending(x => x.TotalUsage) // Xếp hạng hot nhất lên đầu
                .Take(count) // Lấy Top 5, Top 10...
                .ToListAsync();
        }

        public async Task<IEnumerable<TagSummaryDTO>> SuggestTagsAsync(string keyword, int limit)
        {
            keyword = keyword.ToLower();
            return await _context.Tags
                .AsNoTracking()
                .Where(t => t.TagName.ToLower().Contains(keyword))
                .OrderBy(t => t.TagName)
                .Take(limit)
                .Select(t => new TagSummaryDTO
                {
                    TagId = t.TagId,
                    TagName = t.TagName,
                    Type = t.Type
                })
                .ToListAsync();
        }

        public async Task<bool> IsTagNameExistsAsync(string tagName, int? excludeTagId = null)
        {
            var query = _context.Tags.Where(t => t.TagName.ToLower() == tagName.ToLower());
            if (excludeTagId.HasValue)
            {
                query = query.Where(t => t.TagId != excludeTagId.Value);
            }
            return await query.AnyAsync();
        }

        public async Task<bool> IsTagInUseAsync(int tagId) //Dùng cho Delete
        {
            var hasJobTags = await _context.JobTags.AnyAsync(jt => jt.TagId == tagId);
            var hasCandidateTags = await _context.CandidateTags.AnyAsync(ct => ct.TagId == tagId);
            return hasJobTags || hasCandidateTags;
        }

        // Tìm kiếm Tag
        public async Task<IEnumerable<TagSummaryDTO>> SearchTagsAsync(string keyword)
        {
            keyword = keyword.ToLower();
            return await _context.Tags
                .AsNoTracking()
                .Where(t => t.TagName.ToLower().Contains(keyword))
                .Select(t => new TagSummaryDTO
                {
                    TagId = t.TagId,
                    TagName = t.TagName,
                    Type = t.Type,
                    JobCount = t.JobTags.Count,
                    CandidateCount = t.CandidateTags.Count
                })
                .OrderBy(t => t.TagName)
                .ToListAsync();
        }

        // Lấy Tag theo loại (Skill, Language...)
        public async Task<IEnumerable<TagSummaryDTO>> GetTagsByTypeAsync(string type)
        {
            type = type.ToLower();
            return await _context.Tags
                .AsNoTracking()
                .Where(t => t.Type != null && t.Type.ToLower() == type)
                .Select(t => new TagSummaryDTO
                {
                    TagId = t.TagId,
                    TagName = t.TagName,
                    Type = t.Type,
                    JobCount = t.JobTags.Count,
                    CandidateCount = t.CandidateTags.Count
                })
                .OrderBy(t => t.TagName)
                .ToListAsync();
        }
    }
}