using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobsController : ControllerBase
    {
        private readonly IJobRepository _jobRepository;
        private readonly IMatchingService _matchingService;
        private readonly IJobService _jobService;

        public JobsController(IJobRepository jobRepository, IMatchingService matchingService, IJobService jobService)
        {
            _jobRepository = jobRepository;
            _matchingService = matchingService;
            _jobService = jobService;
        }

        // GET: api/jobs/{id}
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetJobById(int id)
        {
            var job = await _jobRepository.GetJobDetailByIdAsync(id);
            if (job == null)
                return NotFound(new { message = "Job not found" });
            await _jobRepository.IncrementViewCountAsync(id);
            return Ok(MapToDTO(job));
        }

        // GET: api/jobs/search
        [AllowAnonymous]
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

        // GET: api/jobs/recent?count=8
        [AllowAnonymous]
        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentJobs([FromQuery] int count = 8)
        {
            var jobs = await _jobRepository.GetRecentJobsAsync(count);
            var jobDTOs = jobs.Select(j => MapToDTO(j));
            return Ok(jobDTOs);
        }

        // GET: api/jobs/company/{companyId}
        [AllowAnonymous]
        [HttpGet("company/{companyId}")]
        public async Task<IActionResult> GetJobsByCompany(int companyId)
        {
            var jobs = await _jobRepository.GetJobsByCompanyAsync(companyId);
            var jobDTOs = jobs.Select(j => MapToDTO(j));
            return Ok(jobDTOs);
        }

        // POST: api/jobs
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter)]
        [HttpPost]
        public async Task<IActionResult> CreateJob([FromBody] CreateJobDTO dto)
        {
                var createdJob = await _jobService.CreateJobAsync(dto);
                return CreatedAtAction(nameof(GetJobById), new { id = createdJob.JobId }, MapToDTO(createdJob));
        }

        // PUT: api/jobs/{id}
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJob(int id, [FromBody] UpdateJobDTO dto)
        {
                var userId = User.GetUserIdFromToken();
                bool isRecruiter = User.IsInRole(UserRoles.Recruiter);

                await _jobService.UpdateJobAsync(id, dto, userId, isRecruiter);
                return Ok(new { message = "Update Success" });
        }

        // PATCH: api/jobs/{id}/status
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter)]
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateJobStatus(int id, [FromBody] JobUpdateStatusDTO dto)
        {
                var userId = User.GetUserIdFromToken();
                bool isRecruiter = User.IsInRole(UserRoles.Recruiter);

                await _jobService.UpdateJobStatusAsync(id, dto, userId, isRecruiter);
                return Ok(new { message = "Status update success" });
        }

        // DELETE: api/jobs/{id}
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJob(int id)
        {
                var userId = User.GetUserIdFromToken();
                bool isRecruiter = User.IsInRole(UserRoles.Recruiter);

                await _jobService.DeleteJobAsync(id, userId, isRecruiter);
                return Ok(new { message = "Delete success" });
        }

        // GET: api/jobs/{jobId}/match/{candidateId}
        [Authorize(Roles = UserRoles.Candidate + ", " + UserRoles.Admin)]
        [HttpGet("{jobId}/match/{candidateId}")]
        public async Task<IActionResult> GetJobMatchScore(int jobId, int candidateId)
        {
            var result = await _matchingService.GetJobMatchScoreAsync(jobId, candidateId);
            return Ok(result);
        }

        // GET: api/jobs/suggested?topN=6
        [Authorize(Roles = UserRoles.Candidate + ", " + UserRoles.Admin)]
        [HttpGet("suggested")]
        public async Task<IActionResult> GetSuggestedJobs([FromQuery] int topN = 6)
        {
            int userId = User.GetUserIdFromToken();
            var suggestions = await _matchingService.GetTopJobSuggestionsForCandidateAsync(userId, topN);
            return Ok(suggestions);
        }

        private JobDetailDTO MapToDTO(Job j)
        {
            return new JobDetailDTO
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
                Status = j.Status,
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