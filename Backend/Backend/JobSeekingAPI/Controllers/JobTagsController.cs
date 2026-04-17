//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using JobSeekingAPI.Data;
//using JobSeekingAPI.DTOs;
//using JobSeekingAPI.Models;

//namespace JobSeekingAPI.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class JobTagsController : ControllerBase
//    {
//        private readonly ApplicationDbContext _context;

//        public JobTagsController(ApplicationDbContext context)
//        {
//            _context = context;
//        }

//        // GET: api/jobtags
//        [HttpGet]
//        public async Task<IActionResult> GetAllJobTags()
//        {
//            var jobTags = await _context.JobTags
//                .Include(jt => jt.Job!)
//                    .ThenInclude(j => j.Company)
//                .Include(jt => jt.Tag)
//                .Where(jt => jt.Job != null && jt.Job.DeletedAt == null)
//                .Select(jt => new
//                {
//                    JobId = jt.JobId,
//                    JobTitle = jt.Job != null ? jt.Job.Title : "",
//                    CompanyName = jt.Job != null && jt.Job.Company != null ? jt.Job.Company.CompanyName : "",
//                    TagId = jt.TagId,
//                    TagName = jt.Tag != null ? jt.Tag.TagName : "",
//                    TagType = jt.Tag != null ? jt.Tag.Type : null
//                })
//                .ToListAsync();
            
//            return Ok(jobTags);
//        }

//        // POST: api/jobtags
//        [HttpPost]
//        public async Task<IActionResult> AddTagToJob([FromBody] JobTagDTO jobTagDto)
//        {
//            if (!ModelState.IsValid)
//                return BadRequest(ModelState);

//            // Kiểm tra Job tồn tại
//            var job = await _context.Jobs
//                .FirstOrDefaultAsync(j => j.JobId == jobTagDto.JobId && j.DeletedAt == null);
            
//            if (job == null)
//                return NotFound("Job not found");

//            // Kiểm tra Tag tồn tại
//            var tag = await _context.Tags.FindAsync(jobTagDto.TagId);
//            if (tag == null)
//                return NotFound("Tag not found");

//            // Kiểm tra đã tồn tại chưa
//            var existingJobTag = await _context.JobTags
//                .AnyAsync(jt => jt.JobId == jobTagDto.JobId && jt.TagId == jobTagDto.TagId);
            
//            if (existingJobTag)
//                return BadRequest("Tag already added to this job");

//            var jobTag = new JobTag
//            {
//                JobId = jobTagDto.JobId,
//                TagId = jobTagDto.TagId
//            };

//            _context.JobTags.Add(jobTag);
//            await _context.SaveChangesAsync();

//            return Ok(new
//            {
//                Message = "Tag added to job successfully",
//                JobId = jobTag.JobId,
//                TagId = jobTag.TagId,
//                JobTitle = job.Title,
//                TagName = tag.TagName
//            });
//        }

//        // DELETE: api/jobtags/{jobId}/{tagId}
//        [HttpDelete("{jobId}/{tagId}")]
//        public async Task<IActionResult> RemoveTagFromJob(int jobId, int tagId)
//        {
//            var jobTag = await _context.JobTags
//                .FirstOrDefaultAsync(jt => jt.JobId == jobId && jt.TagId == tagId);
            
//            if (jobTag == null)
//                return NotFound("JobTag not found");

//            _context.JobTags.Remove(jobTag);
//            await _context.SaveChangesAsync();

//            return NoContent();
//        }

//        // DELETE: api/jobtags/job/{jobId}
//        [HttpDelete("job/{jobId}")]
//        public async Task<IActionResult> RemoveAllTagsFromJob(int jobId)
//        {
//            var jobTags = await _context.JobTags
//                .Where(jt => jt.JobId == jobId)
//                .ToListAsync();

//            if (!jobTags.Any())
//                return NotFound("No tags found for this job");

//            _context.JobTags.RemoveRange(jobTags);
//            await _context.SaveChangesAsync();

//            return Ok(new { Message = $"Removed {jobTags.Count} tags from job" });
//        }

//        // GET: api/jobtags/job/{jobId}
//        [HttpGet("job/{jobId}")]
//        public async Task<IActionResult> GetTagsByJob(int jobId)
//        {
//            var job = await _context.Jobs
//                .FirstOrDefaultAsync(j => j.JobId == jobId && j.DeletedAt == null);

//            if (job == null)
//                return NotFound("Job not found");

//            var tags = await _context.JobTags
//                .Where(jt => jt.JobId == jobId)
//                .Include(jt => jt.Tag)
//                .Select(jt => new TagSummaryDTO
//                {
//                    TagId = jt.Tag!.TagId,
//                    TagName = jt.Tag!.TagName,
//                    Type = jt.Tag!.Type
//                })
//                .ToListAsync();

//            return Ok(tags);
//        }

//        // GET: api/jobtags/tag/{tagId}
//        [HttpGet("tag/{tagId}")]
//        public async Task<IActionResult> GetJobsByTag(int tagId)
//        {
//            var tag = await _context.Tags.FindAsync(tagId);
//            if (tag == null)
//                return NotFound("Tag not found");

//            var jobs = await _context.JobTags
//                .Where(jt => jt.TagId == tagId && jt.Job != null && jt.Job.DeletedAt == null)
//                .Include(jt => jt.Job!)
//                    .ThenInclude(j => j.Company)
//                .Include(jt => jt.Job!)
//                    .ThenInclude(j => j.Location)
//                .OrderByDescending(jt => jt.Job!.PostedDate)
//                .Select(jt => new JobSummaryDTO
//                {
//                    JobId = jt.Job!.JobId,
//                    Title = jt.Job.Title,
//                    SalaryMin = jt.Job.SalaryMin,
//                    SalaryMax = jt.Job.SalaryMax,
//                    ExpYear = jt.Job.ExpYear,
//                    Level = jt.Job.Level,
//                    CompanyName = jt.Job.Company != null ? jt.Job.Company.CompanyName : "",
//                    LocationName = jt.Job.Location != null ? jt.Job.Location.LocationName : "",
//                    PostedDate = jt.Job.PostedDate,
//                    Deadline = jt.Job.Deadline
//                })
//                .ToListAsync();

//            return Ok(jobs);
//        }

//        // POST: api/jobtags/bulk
//        [HttpPost("bulk")]
//        public async Task<IActionResult> AddMultipleTagsToJob([FromBody] BulkJobTagDTO bulkJobTagDto)
//        {
//            if (!ModelState.IsValid)
//                return BadRequest(ModelState);

//            // Kiểm tra Job tồn tại
//            var job = await _context.Jobs
//                .FirstOrDefaultAsync(j => j.JobId == bulkJobTagDto.JobId && j.DeletedAt == null);
            
//            if (job == null)
//                return NotFound("Job not found");

//            var addedTags = new List<TagSummaryDTO>();
//            var existingTags = new List<string>();

//            foreach (var tagId in bulkJobTagDto.TagIds)
//            {
//                // Kiểm tra Tag tồn tại
//                var tag = await _context.Tags.FindAsync(tagId);
//                if (tag == null)
//                    continue;

//                // Kiểm tra đã tồn tại chưa
//                var exists = await _context.JobTags
//                    .AnyAsync(jt => jt.JobId == bulkJobTagDto.JobId && jt.TagId == tagId);

//                if (!exists)
//                {
//                    _context.JobTags.Add(new JobTag { JobId = bulkJobTagDto.JobId, TagId = tagId });
//                    addedTags.Add(new TagSummaryDTO
//                    {
//                        TagId = tag.TagId,
//                        TagName = tag.TagName,
//                        Type = tag.Type
//                    });
//                }
//                else
//                {
//                    existingTags.Add(tag.TagName);
//                }
//            }

//            await _context.SaveChangesAsync();

//            return Ok(new
//            {
//                Message = $"Added {addedTags.Count} tags to job",
//                AddedTags = addedTags,
//                ExistingTags = existingTags
//            });
//        }

//        private bool JobTagExists(int jobId, int tagId)
//        {
//            return _context.JobTags.Any(e => e.JobId == jobId && e.TagId == tagId);
//        }
//    }
//}