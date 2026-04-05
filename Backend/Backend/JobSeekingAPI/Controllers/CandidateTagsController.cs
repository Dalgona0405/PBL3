using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CandidateTagsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CandidateTagsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/candidatetags
        [HttpGet]
        public async Task<IActionResult> GetAllCandidateTags()
        {
            var candidateTags = await _context.CandidateTags
                .Include(ct => ct.Candidate!)
                    .ThenInclude(c => c.User)
                .Include(ct => ct.Tag)
                .Where(ct => ct.Candidate != null && ct.Candidate.User != null && ct.Candidate.User.DeletedAt == null)
                .Select(ct => new
                {
                    UserId = ct.UserId,
                    CandidateName = ct.Candidate != null ? ct.Candidate.FullName : "",
                    Email = ct.Candidate != null && ct.Candidate.User != null ? ct.Candidate.User.Email : "",
                    TagId = ct.TagId,
                    TagName = ct.Tag != null ? ct.Tag.TagName : "",
                    TagType = ct.Tag != null ? ct.Tag.Type : null,
                    Proficiency = ct.Proficiency
                })
                .ToListAsync();
            
            return Ok(candidateTags);
        }

        // POST: api/candidatetags
        [HttpPost]
        public async Task<IActionResult> AddTagToCandidate([FromBody] CandidateTagDTO candidateTagDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Kiểm tra Candidate tồn tại
            var candidate = await _context.Candidates
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.UserId == candidateTagDto.UserId && c.User != null && c.User.DeletedAt == null);
            
            if (candidate == null)
                return NotFound("Candidate not found");

            // Kiểm tra Tag tồn tại
            var tag = await _context.Tags.FindAsync(candidateTagDto.TagId);
            if (tag == null)
                return NotFound("Tag not found");

            // Kiểm tra đã tồn tại chưa
            var existingCandidateTag = await _context.CandidateTags
                .AnyAsync(ct => ct.UserId == candidateTagDto.UserId && ct.TagId == candidateTagDto.TagId);
            
            if (existingCandidateTag)
                return BadRequest("Tag already added to this candidate");

            var candidateTag = new CandidateTag
            {
                UserId = candidateTagDto.UserId,
                TagId = candidateTagDto.TagId,
                Proficiency = candidateTagDto.Proficiency
            };

            _context.CandidateTags.Add(candidateTag);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Tag added to candidate successfully",
                UserId = candidateTag.UserId,
                TagId = candidateTag.TagId,
                CandidateName = candidate.FullName,
                TagName = tag.TagName,
                Proficiency = candidateTag.Proficiency
            });
        }

        // PUT: api/candidatetags/{userId}/{tagId}
        [HttpPut("{userId}/{tagId}")]
        public async Task<IActionResult> UpdateCandidateTag(int userId, int tagId, [FromBody] UpdateCandidateTagDTO updateDto)
        {
            var existingCandidateTag = await _context.CandidateTags
                .FirstOrDefaultAsync(ct => ct.UserId == userId && ct.TagId == tagId);
            
            if (existingCandidateTag == null)
                return NotFound("CandidateTag not found");

            existingCandidateTag.Proficiency = updateDto.Proficiency ?? existingCandidateTag.Proficiency;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Proficiency updated successfully",
                UserId = existingCandidateTag.UserId,
                TagId = existingCandidateTag.TagId,
                Proficiency = existingCandidateTag.Proficiency
            });
        }

        // DELETE: api/candidatetags/{userId}/{tagId}
        [HttpDelete("{userId}/{tagId}")]
        public async Task<IActionResult> RemoveTagFromCandidate(int userId, int tagId)
        {
            var candidateTag = await _context.CandidateTags
                .FirstOrDefaultAsync(ct => ct.UserId == userId && ct.TagId == tagId);
            
            if (candidateTag == null)
                return NotFound("CandidateTag not found");

            _context.CandidateTags.Remove(candidateTag);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/candidatetags/candidate/{userId}
        [HttpDelete("candidate/{userId}")]
        public async Task<IActionResult> RemoveAllTagsFromCandidate(int userId)
        {
            var candidateTags = await _context.CandidateTags
                .Where(ct => ct.UserId == userId)
                .ToListAsync();

            if (!candidateTags.Any())
                return NotFound("No tags found for this candidate");

            _context.CandidateTags.RemoveRange(candidateTags);
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Removed {candidateTags.Count} tags from candidate" });
        }

        // GET: api/candidatetags/candidate/{userId}
        [HttpGet("candidate/{userId}")]
        public async Task<IActionResult> GetTagsByCandidate(int userId)
        {
            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (candidate == null)
                return NotFound("Candidate not found");

            var tags = await _context.CandidateTags
                .Where(ct => ct.UserId == userId)
                .Include(ct => ct.Tag)
                .Select(ct => new
                {
                    TagId = ct.Tag!.TagId,
                    TagName = ct.Tag.TagName,
                    TagType = ct.Tag.Type,
                    Proficiency = ct.Proficiency
                })
                .ToListAsync();

            return Ok(tags);
        }

        // GET: api/candidatetags/tag/{tagId}
        [HttpGet("tag/{tagId}")]
        public async Task<IActionResult> GetCandidatesByTag(int tagId)
        {
            var tag = await _context.Tags.FindAsync(tagId);
            if (tag == null)
                return NotFound("Tag not found");

            var candidates = await _context.CandidateTags
                .Where(ct => ct.TagId == tagId && ct.Candidate != null && ct.Candidate.User != null && ct.Candidate.User.DeletedAt == null)
                .Include(ct => ct.Candidate!)
                    .ThenInclude(c => c.User)
                .Select(ct => new
                {
                    UserId = ct.Candidate!.UserId,
                    FullName = ct.Candidate.FullName,
                    Avatar = ct.Candidate.User != null ? ct.Candidate.User.Avatar : null,
                    Email = ct.Candidate.User != null ? ct.Candidate.User.Email : null,
                    Proficiency = ct.Proficiency,
                    CVUrl = ct.Candidate.CVUrl
                })
                .ToListAsync();

            return Ok(candidates);
        }

        // GET: api/candidatetags/popular-skills
        [HttpGet("popular-skills")]
        public async Task<IActionResult> GetPopularSkills([FromQuery] int limit = 10)
        {
            var popularSkills = await _context.CandidateTags
                .Include(ct => ct.Tag)
                .Where(ct => ct.Tag! != null)
                .GroupBy(ct => new { ct.TagId, ct.Tag!.TagName })
                .Select(g => new
                {
                    TagId = g.Key.TagId,
                    TagName = g.Key.TagName,
                    Count = g.Count(),
                    Proficiency = g.GroupBy(x => x.Proficiency)
                        .OrderByDescending(x => x.Count())
                        .Select(x => x.Key)
                        .FirstOrDefault()
                })
                .OrderByDescending(x => x.Count)
                .Take(limit)
                .ToListAsync();

            return Ok(popularSkills);
        }

        // POST: api/candidatetags/bulk
        [HttpPost("bulk")]
        public async Task<IActionResult> AddMultipleTagsToCandidate([FromBody] BulkCandidateTagDTO bulkDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.UserId == bulkDto.UserId);
            
            if (candidate == null)
                return NotFound("Candidate not found");

            var addedTags = new List<object>();
            var existingTags = new List<string>();

            foreach (var tagItem in bulkDto.Tags)
            {
                var tag = await _context.Tags.FindAsync(tagItem.TagId);
                if (tag == null)
                    continue;

                var exists = await _context.CandidateTags
                    .AnyAsync(ct => ct.UserId == bulkDto.UserId && ct.TagId == tagItem.TagId);

                if (!exists)
                {
                    _context.CandidateTags.Add(new CandidateTag
                    {
                        UserId = bulkDto.UserId,
                        TagId = tagItem.TagId,
                        Proficiency = tagItem.Proficiency
                    });
                    addedTags.Add(new
                    {
                        TagId = tag.TagId,
                        TagName = tag.TagName,
                        Proficiency = tagItem.Proficiency
                    });
                }
                else
                {
                    existingTags.Add(tag.TagName);
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = $"Added {addedTags.Count} skills to candidate",
                AddedTags = addedTags,
                ExistingTags = existingTags
            });
        }

        private bool CandidateTagExists(int userId, int tagId)
        {
            return _context.CandidateTags.Any(e => e.UserId == userId && e.TagId == tagId);
        }
    }
}