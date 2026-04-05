using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TagsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TagsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/tags
        [HttpGet]
        public async Task<IActionResult> GetAllTags()
        {
            var tags = await _context.Tags
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
            
            return Ok(tags);
        }

        // GET: api/tags/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTagById(int id)
        {
            var tag = await _context.Tags
                .Include(t => t.JobTags)
                    .ThenInclude(jt => jt.Job!)
                    .ThenInclude(j => j.Company)
                .Include(t => t.JobTags)
                    .ThenInclude(jt => jt.Job!)
                    .ThenInclude(j => j.Location)
                .Include(t => t.CandidateTags)
                    .ThenInclude(ct => ct.Candidate!)
                    .ThenInclude(c => c.User)
                .Where(t => t.TagId == id)
                .Select(t => new TagDetailDTO
                {
                    TagId = t.TagId,
                    TagName = t.TagName,
                    Type = t.Type,
                    
                    Jobs = t.JobTags
                        .Where(jt => jt.Job != null && jt.Job.DeletedAt == null)
                        .OrderByDescending(jt => jt.Job != null ? jt.Job.PostedDate : DateTime.MinValue)  // ✅ FIX
                        .Take(10)
                        .Select(jt => new JobSummaryDTO
                        {
                            JobId = jt.Job != null ? jt.Job.JobId : 0,
                            Title = jt.Job != null ? jt.Job.Title : "",
                            SalaryMin = jt.Job != null ? jt.Job.SalaryMin : null,
                            SalaryMax = jt.Job != null ? jt.Job.SalaryMax : null,
                            CompanyName = jt.Job != null && jt.Job.Company != null ? jt.Job.Company.CompanyName : "",  // ✅ FIX
                            LocationName = jt.Job != null && jt.Job.Location != null ? jt.Job.Location.LocationName : "",
                            Deadline = jt.Job != null ? jt.Job.Deadline : null
                        }).ToList(),
                    
                    Candidates = t.CandidateTags
                        .Where(ct => ct.Candidate != null && ct.Candidate.User != null && ct.Candidate.User.DeletedAt == null)
                        .Take(10)
                        .Select(ct => new CandidateSummaryDTO
                        {
                            UserId = ct.Candidate != null ? ct.Candidate.UserId : 0,
                            FullName = ct.Candidate != null ? ct.Candidate.FullName : "",
                            Avatar = ct.Candidate != null && ct.Candidate.User != null ? ct.Candidate.User.Avatar : null,  // ✅ FIX
                            Email = ct.Candidate != null && ct.Candidate.User != null ? ct.Candidate.User.Email : null,    // ✅ FIX
                            Proficiency = ct.Proficiency
                        }).ToList()
                })
                .FirstOrDefaultAsync();

            if (tag == null)
                return NotFound("Tag not found");

            return Ok(tag);
        }

        // POST: api/tags
        [HttpPost]
        public async Task<IActionResult> CreateTag([FromBody] CreateTagDTO createTagDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Kiểm tra tag đã tồn tại
            var existingTag = await _context.Tags
                .AnyAsync(t => t.TagName.ToLower() == createTagDto.TagName.ToLower());
            
            if (existingTag)
                return BadRequest("Tag already exists");

            var tag = new Tag
            {
                TagName = createTagDto.TagName,
                Type = createTagDto.Type
            };

            _context.Tags.Add(tag);
            await _context.SaveChangesAsync();

            var tagDto = new TagSummaryDTO
            {
                TagId = tag.TagId,
                TagName = tag.TagName,
                Type = tag.Type
            };

            return CreatedAtAction(nameof(GetTagById), new { id = tag.TagId }, tagDto);
        }

        // PUT: api/tags/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTag(int id, [FromBody] UpdateTagDTO updateTagDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingTag = await _context.Tags.FindAsync(id);
            if (existingTag == null)
                return NotFound("Tag not found");

            // Kiểm tra tên mới không trùng
            if (!string.IsNullOrWhiteSpace(updateTagDto.TagName))
            {
                var duplicateTag = await _context.Tags
                    .AnyAsync(t => t.TagName.ToLower() == updateTagDto.TagName.ToLower() && t.TagId != id);
                
                if (duplicateTag)
                    return BadRequest("Tag name already exists");

                existingTag.TagName = updateTagDto.TagName;
            }

            if (!string.IsNullOrWhiteSpace(updateTagDto.Type))
            {
                existingTag.Type = updateTagDto.Type;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/tags/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTag(int id)
        {
            var tag = await _context.Tags.FindAsync(id);
            if (tag == null)
                return NotFound("Tag not found");

            // Kiểm tra tag có đang được sử dụng không
            var hasJobTags = await _context.JobTags.AnyAsync(jt => jt.TagId == id);
            var hasCandidateTags = await _context.CandidateTags.AnyAsync(ct => ct.TagId == id);
            
            if (hasJobTags || hasCandidateTags)
                return BadRequest("Cannot delete tag that is being used");

            _context.Tags.Remove(tag);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/tags/search
        [HttpGet("search")]
        public async Task<IActionResult> SearchTags([FromQuery] string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest("Keyword is required");

            keyword = keyword.ToLower();
            var tags = await _context.Tags
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

            return Ok(tags);
        }

        // GET: api/tags/type/{type}
        [HttpGet("type/{type}")]
        public async Task<IActionResult> GetTagsByType(string type)
        {
            var tags = await _context.Tags
                .Where(t => t.Type != null && t.Type.ToLower() == type.ToLower())
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

            return Ok(tags);
        }

        // GET: api/tags/popular
        [HttpGet("popular")]
        public async Task<IActionResult> GetPopularTags([FromQuery] int count = 10)
        {
            var popularTags = await _context.Tags
                .Select(t => new TagSummaryDTO
                {
                    TagId = t.TagId,
                    TagName = t.TagName,
                    Type = t.Type,
                    JobCount = t.JobTags.Count,
                    CandidateCount = t.CandidateTags.Count,
                    TotalUsage = t.JobTags.Count + t.CandidateTags.Count
                })
                .OrderByDescending(x => x.TotalUsage)
                .Take(count)
                .ToListAsync();

            return Ok(popularTags);
        }

        // GET: api/tags/suggest
        [HttpGet("suggest")]
        public async Task<IActionResult> SuggestTags([FromQuery] string keyword, [FromQuery] int limit = 5)
        {
            if (string.IsNullOrWhiteSpace(keyword) || keyword.Length < 2)
                return Ok(new List<TagSummaryDTO>());

            keyword = keyword.ToLower();
            var tags = await _context.Tags
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

            return Ok(tags);
        }

        private bool TagExists(int id)
        {
            return _context.Tags.Any(e => e.TagId == id);
        }
    }
}