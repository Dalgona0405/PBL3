using Microsoft.AspNetCore.Mvc;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TagsController : ControllerBase
    {
        private readonly ITagRepository _tagRepository;

        public TagsController(ITagRepository tagRepository)
        {
            _tagRepository = tagRepository;
        }

        // GET: api/tags
        [HttpGet]
        public async Task<IActionResult> GetAllTags()
        {
            var tags = await _tagRepository.GetAllTagsSummaryAsync();
            return Ok(tags);
        }

        // GET: api/tags/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTagById(int id)
        {
            var tag = await _tagRepository.GetTagDetailByIdAsync(id);
            if (tag == null)
                return NotFound(new { message = "Tag not found" });
            var tagDetail = new TagDetailDTO
            {
                TagId = tag.TagId,
                TagName = tag.TagName,
                Type = tag.Type,
                JobCount = tag.JobTags?.Count ?? 0,
                CandidateCount = tag.CandidateTags?.Count ?? 0,
                TotalUsage = (tag.JobTags?.Count ?? 0) + (tag.CandidateTags?.Count ?? 0),

                Jobs = tag.JobTags?.Select(jt => new JobSummaryDTO
                {
                    JobId = jt.Job!.JobId,
                    Title = jt.Job.Title,
                    SalaryMin = jt.Job.SalaryMin,
                    SalaryMax = jt.Job.SalaryMax,
                    CompanyName = jt.Job.Company?.CompanyName ?? "Unknown"
                }).ToList() ?? new List<JobSummaryDTO>(),

                Candidates = tag.CandidateTags?.Select(ct => new CandidateSummaryDTO
                {
                    UserId = ct.Candidate!.UserId,
                    FullName = ct.Candidate.User?.FullName ?? "Unknown"
                }).ToList() ?? new List<CandidateSummaryDTO>()
            };
            return Ok(tagDetail);
        }

        // GET: api/tags/popular?count=10
        [HttpGet("popular")]
        public async Task<IActionResult> GetPopularTags([FromQuery] int count = 10)
        {
            var popularTags = await _tagRepository.GetPopularTagsAsync(count);
            return Ok(popularTags);
        }

        // GET: api/tags/suggest?keyword=react&limit=5
        [HttpGet("suggest")]
        public async Task<IActionResult> SuggestTags([FromQuery] string keyword, [FromQuery] int limit = 5)
        {
            if (string.IsNullOrWhiteSpace(keyword) || keyword.Length < 2)
                return Ok(new List<TagSummaryDTO>());

            var tags = await _tagRepository.SuggestTagsAsync(keyword, limit);
            return Ok(tags);
        }

        // POST: api/tags
        [HttpPost]
        public async Task<IActionResult> CreateTag([FromBody] CreateTagDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Kiểm tra tag đã tồn tại
            var existingTag = await _tagRepository.IsTagNameExistsAsync(dto.TagName);
            if (existingTag)
                return BadRequest("Tag already exists");

            var tag = new Tag
            {
                TagName = dto.TagName,
                Type = dto.Type
            };

            await _tagRepository.CreateAsync(tag);

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
        public async Task<IActionResult> UpdateTag(int id, [FromBody] UpdateTagDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingTag = await _tagRepository.GetTagEntityByIdAsync(id);
            if (existingTag == null)
                return NotFound("Tag not found");

            // Kiểm tra tên mới không trùng
            if (!string.IsNullOrWhiteSpace(dto.TagName) && dto.TagName != existingTag.TagName)
            {
                var isDuplicate = await _tagRepository.IsTagNameExistsAsync(dto.TagName, id);
                if (isDuplicate)
                    return BadRequest("Tag name already exists");
                existingTag.TagName = dto.TagName;
            }

            if (!string.IsNullOrWhiteSpace(dto.Type))
            {
                existingTag.Type = dto.Type;
            }

            await _tagRepository.UpdateAsync(existingTag);
            return Ok(new { message = "Update success" });
        }

        // DELETE: api/tags/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTag(int id)
        {
            var tag = await _tagRepository.GetTagEntityByIdAsync(id);
            if (tag == null)
                return NotFound(new { message = "Tag not found" });

            // Kiểm tra xem Tag có đang được gắn cho Job hay Candidate nào không
            var isInUse = await _tagRepository.IsTagInUseAsync(id);
            if (isInUse)
                return BadRequest(new { message = "Cannot delete tag that is being used" });

            await _tagRepository.SoftDeleteTagAsync(id);
            return Ok(new { message = "Delete sucess" });
        }

        // GET: api/tags/search
        [HttpGet("search")]
        public async Task<IActionResult> SearchTags([FromQuery] string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest(new { message = "Keyword is required" });

            var tags = await _tagRepository.SearchTagsAsync(keyword);
            return Ok(tags);
        }

        // GET: api/tags/type/{type}
        [HttpGet("type/{type}")]
        public async Task<IActionResult> GetTagsByType(string type)
        {
            var tags = await _tagRepository.GetTagsByTypeAsync(type);
            return Ok(tags);
        }
    }
}