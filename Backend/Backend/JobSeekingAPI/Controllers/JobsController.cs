using Microsoft.AspNetCore.Mvc;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobsController : ControllerBase
    {
        private readonly IJobRepository _jobRepository;

        public JobsController(IJobRepository jobRepository)
        {
            _jobRepository = jobRepository;
        }

        // GET: api/jobs => Cân nhắc bỏ vì có thể dùng GET api/jobs/search với searchParams rỗng để thay thế
        [HttpGet]
        public async Task<IActionResult> GetAllJobs()
        {
            var jobs = await _jobRepository.GetAllJobsWithDetailsAsync();
            var jobDTOs = jobs.Select(j => MapToDTO(j));
            return Ok(jobDTOs);
        }

        // GET: api/jobs/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetJobById(int id)
        {
            var job = await _jobRepository.GetJobDetailByIdAsync(id);
            if (job == null)
                return NotFound(new { message = "Job not found" });
            await _jobRepository.IncrementViewCountAsync(id);
            return Ok(MapToDTO(job));
        }

        //GET: api/jobs/"search"
        [HttpGet("search")]
        public async Task<IActionResult> SearchJobs([FromQuery] JobSearchDTO searchParams)
        {
            var result = await _jobRepository.SearchJobsAsync(searchParams);
            var mappedData = result.Items.Select(j => MapToDTO(j)).ToList();
            return Ok(new
            {
                result.TotalCount,
                result.Page,
                result.PageSize,
                result.TotalPages,
                Data = mappedData
            });
        }

        //GET: api/jobs/"recent" => Cân nhắc vì GetAllJobs đã có sắp xếp theo PostedDate desc rồi, nếu muốn lấy recent thì chỉ cần gọi GetAllJobs và lấy 8 phần tử đầu tiên là được, nhưng nếu muốn có endpoint riêng để tối ưu query thì cũng được
        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentJobs([FromQuery] int count = 8)
        {
            var jobs = await _jobRepository.GetRecentJobsAsync(count);
            var jobDTOs = jobs.Select(j => MapToDTO(j));
            return Ok(jobDTOs);
        }

        //GET: api/jobs/company/{companyId}
        [HttpGet("company/{companyId}")]
        public async Task<IActionResult> GetJobsByCompany(int companyId)
        {
            var jobs = await _jobRepository.GetJobsByCompanyAsync(companyId);
            var jobDTOs = jobs.Select(j => MapToDTO(j));
            return Ok(jobDTOs);
        }

        //POST: api/jobs
        [HttpPost]
        public async Task<IActionResult> CreateJob([FromBody] CreateJobDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if(dto.Deadline.HasValue && dto.Deadline.Value < DateTime.UtcNow)
            {
                return BadRequest(new { message = "Deadline cannot be in the past!" });
            }

            var job = new Job
            {
                CompanyId = dto.CompanyId,
                LocationId = dto.LocationId,
                Title = dto.Title,
                SalaryMin = dto.SalaryMin,
                SalaryMax = dto.SalaryMax,
                ExpYear = dto.ExpYear,
                Level = dto.Level,
                Deadline = dto.Deadline,
                Description = dto.Description,
                Requirement = dto.Requirement,
                Benefits = dto.Benefits,
                Address = dto.Address,
                JobTags = dto.TagIds?.Select(tagId => new JobTag { TagId = tagId }).ToList() ?? new List<JobTag>()
            };
            
            var createdJob = await _jobRepository.CreateJobWithDefaultsAsync(job);
            return CreatedAtAction(nameof(GetJobById), new { id = createdJob.JobId }, MapToDTO(createdJob));
        }

        //PUT: api/jobs/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJob(int id, [FromBody] UpdateJobDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingJob = await _jobRepository.GetJobEntityByIdAsync(id);
            if (existingJob == null)
                return NotFound(new { message = "Job not found" });

            existingJob.Title = dto.Title ?? existingJob.Title;
            existingJob.LocationId = dto.LocationId ?? existingJob.LocationId;
            existingJob.SalaryMin = dto.SalaryMin ?? existingJob.SalaryMin;
            existingJob.SalaryMax = dto.SalaryMax ?? existingJob.SalaryMax;
            existingJob.ExpYear = dto.ExpYear ?? existingJob.ExpYear;
            existingJob.Level = dto.Level ?? existingJob.Level;
            existingJob.Deadline = dto.Deadline ?? existingJob.Deadline;
            existingJob.Description = dto.Description ?? existingJob.Description;
            existingJob.Requirement = dto.Requirement ?? existingJob.Requirement;
            existingJob.Benefits = dto.Benefits ?? existingJob.Benefits;
            existingJob.Address = dto.Address ?? existingJob.Address;
            existingJob.Status = dto.Status ?? existingJob.Status;

            await _jobRepository.UpdateJobWithTagsAsync(existingJob, dto.TagIds);
            return Ok(new { message = "Update Success" });
        }

        //PATCH: api/jobs/{id}/status
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateJobStatus(int id, [FromBody] JobUpdateStatusDTO dto)
        {
            var existingJob = await _jobRepository.GetJobEntityByIdAsync(id);
            if (existingJob == null)
                return NotFound(new { message = "Job not found" });
            existingJob.Status = dto.Status;
            await _jobRepository.UpdateAsync(existingJob);
            return Ok(new { message = "Status update success" });
        }

        //DELETE: api/jobs/id
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJob(int id)
        {
            var existingJob = await _jobRepository.GetJobEntityByIdAsync(id);
            if (existingJob == null)
                return NotFound(new { message = "Job not found" });
            await _jobRepository.SoftDeleteJobAsync(id);
            return Ok(new { message = "Delete success" });
        }

        private JobResponseDTO MapToDTO(Job j)
        {
            return new JobResponseDTO
            {
                JobId = j.JobId,
                CompanyId = j.CompanyId,
                OriginalId = j.OriginalId,
                Title = j.Title,
                SalaryMin = j.SalaryMin,
                SalaryMax = j.SalaryMax,
                ExpYear = j.ExpYear,
                Level = j.Level,
                PostedDate = j.PostedDate,
                Deadline = j.Deadline,
                Description = j.Description,
                Requirement = j.Requirement,
                Benefits = j.Benefits,
                Address = j.Address,
                ViewCount = j.ViewCount ?? 0,
                Company = j.Company != null ? new CompanySummaryDTO
                {
                    CompanyId = j.Company.CompanyId,
                    CompanyName = j.Company.CompanyName,
                    LogoImg = j.Company.LogoImg,
                    Website = j.Company.Website
                } : null,
                Location = j.Location != null ? new LocationSummaryDTO
                {
                    LocationId = j.Location.LocationId,
                    LocationName = j.Location.LocationName
                } : null,
                Tags = j.JobTags?.Where(jt => jt.Tag != null)
                    .Select(jt => new TagSummaryDTO
                    {
                        TagId = jt.Tag!.TagId,
                        TagName = jt.Tag.TagName,
                        Type = jt.Tag.Type
                    }).ToList() ?? new List<TagSummaryDTO>(),
                ApplicationCount = j.Applications?.Count(a => a.DeletedAt == null) ?? 0
            };
        }
    }
}