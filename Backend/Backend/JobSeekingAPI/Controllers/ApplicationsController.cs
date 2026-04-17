using Microsoft.AspNetCore.Mvc;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ApplicationsController : ControllerBase
    {
        private readonly IApplicationRepository _applicationRepository;
        private readonly IJobRepository _jobRepository;

        public ApplicationsController(IApplicationRepository applicationRepository, IJobRepository jobRepository)
        {
            _applicationRepository = applicationRepository;
            _jobRepository = jobRepository;
        }

        // GET: api/applications
        [HttpGet]
        public async Task<IActionResult> GetAllApplications()
        {
            var applications = await _applicationRepository.GetAllApplicationsWithDetailsAsync();
            var dtos = applications.Select(a => MapToDTO(a));
            return Ok(dtos);
        }

        // GET: api/applications/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetApplicationById(int id)
        {
            var application = await _applicationRepository.GetApplicationDetailByIdAsync(id);
            if (application == null)
                return NotFound("Application not found");

            return Ok(MapToDTO(application));
        }

        // GET: api/applications/job/{jobId}
        [HttpGet("jobs/{jobId}")]
        public async Task<IActionResult> GetApplicationsByJob(int jobId)
        {
            var jobExists = await _jobRepository.GetByIdAsync(jobId);
            if (jobExists == null) 
                return NotFound(new { message = "Job not found!" });

            var applications = await _applicationRepository.GetByJobIdAsync(jobId);
            var dtos = applications.Select(a => MapToDTO(a));
            return Ok(dtos);
        }

        // GET: api/applications/user/{userId}
        [HttpGet("candidate/{userId}")]
        public async Task<IActionResult> GetApplicationsByUser(int userId)
        {
            var applications = await _applicationRepository.GetByUserIdAsync(userId);
            var dtos = applications.Select(a => MapToDTO(a));
            return Ok(dtos);
        }

        // POST: api/applications
        [HttpPost]
        public async Task<IActionResult> CreateApplication([FromBody] CreateApplicationDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Kiểm tra Job tồn tại
            var job = await _jobRepository.GetByIdAsync(dto.JobId);
            if (job == null) 
                return NotFound(new { message = "Job not found!" });

            // Job đã hết hạn chưa? (Không cho nộp Job quá hạn)
            if (job.Deadline.HasValue && job.Deadline.Value < DateTime.UtcNow)
                return BadRequest(new { message = "This job is already expired!" });

            // User đã nộp job này bao giờ chưa? (Chống Spam)
            var hasApplied = await _applicationRepository.IsAppliedAsync(dto.UserId, dto.JobId);
            if (hasApplied)
                return Conflict(new { message = "You have already applied for this job!" });

            // Tạo đơn ứng tuyển
            var application = new Application
            {
                UserId = dto.UserId,
                JobId = dto.JobId,
                CVUrl = dto.CVUrl
            };

            var createdApp = await _applicationRepository.CreateApplicationDetailAsync(application);
            return CreatedAtAction(nameof(GetApplicationById), new { id = createdApp.AppId }, MapToDTO(createdApp));
        }

        // PUT: api/applications/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateApplication(int id, [FromBody] UpdateApplicationDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingApplication = await _applicationRepository.GetApplicationEntityByIdAsync(id);
            if (existingApplication == null)
                return NotFound("Application not found");

            existingApplication.Status = dto.Status ?? existingApplication.Status;
            existingApplication.CVUrl = dto.CVUrl ?? existingApplication.CVUrl;

            await _applicationRepository.UpdateAsync(existingApplication);
            return Ok(new { message = "Update success" });
        }

        // DELETE: api/applications/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> WithdrawApplication(int id)
        {
            var application = await _applicationRepository.GetByIdAsync(id);
            if (application == null)
                return NotFound(new { message = "Application not found!" });

            await _applicationRepository.SoftDeleteApplicationAsync(id);

            return Ok(new { message = "Application withdrawn successfully!" });
        }

        // GET: api/applications/statistics/job/{jobId}
        [HttpGet("statistics/job/{jobId}")]
        public async Task<IActionResult> GetApplicationStatistics(int jobId)
        {
            var statistics = await _applicationRepository.GetApplicationStatusStatisticsAsync(jobId);

            // statistics likely contains KeyValuePair<int,int> mapping Status -> Count
            var total = statistics?.Sum(kv => kv.Value) ?? 0;

            var result = new
            {
                TotalApplications = total,
                Pending = statistics?.FirstOrDefault(kv => kv.Key == 1).Value ?? 0,
                Reviewed = statistics?.FirstOrDefault(kv => kv.Key == 2).Value ?? 0,
                Interviewed = statistics?.FirstOrDefault(kv => kv.Key == 3).Value ?? 0,
                Accepted = statistics?.FirstOrDefault(kv => kv.Key == 4).Value ?? 0,
                Rejected = statistics?.FirstOrDefault(kv => kv.Key == 5).Value ?? 0
            };

            return Ok(result);
        }

        private ApplicationResponseDTO MapToDTO(Application a)
        {
            return new ApplicationResponseDTO
            {
                ApplicationId = a.AppId,
                UserId = a.UserId,
                JobId = a.JobId,
                AppliedDate = a.AppliedDate,
                Status = a.Status,
                CVUrl = a.CVUrl,

                Candidate = a.Candidate == null ? null : new CandidateSummaryDTO
                {
                    UserId = a.Candidate.UserId,
                    FullName = a.Candidate.User?.FullName ?? "Unknown",
                    Avatar = a.Candidate.User?.Avatar,
                    Email = a.Candidate.User?.Email,
                    CVUrl = a.Candidate.CVUrl
                },

                Job = a.Job == null ? null : new JobSummaryDTO
                {
                    JobId = a.Job.JobId,
                    Title = a.Job.Title,
                    SalaryMin = a.Job.SalaryMin,
                    SalaryMax = a.Job.SalaryMax,
                    CompanyName = a.Job.Company?.CompanyName ?? "Unknown",
                    LocationName = a.Job.Location?.LocationName ?? "Unknown",
                    Deadline = a.Job.Deadline
                }
            };
        }
    }
}