//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using JobSeekingAPI.Data;
//using JobSeekingAPI.DTOs;
//using JobSeekingAPI.Models;
//using JobSeekingAPI.Repositories;

//namespace JobSeekingAPI.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class ApplicationsController : ControllerBase
//    {
//        private readonly IApplicationRepository _applicationRepository;
//        private readonly IJobRepository _jobRepository;
//        private readonly IUserRepository _userRepository;

//        public ApplicationsController(IApplicationRepository applicationRepository, IJobRepository jobRepository, IUserRepository userRepository)
//        {
//            _applicationRepository = applicationRepository;
//            _jobRepository = jobRepository;
//            _userRepository = userRepository;
//        }

//        // GET: api/applications
//        [HttpGet]
//        public async Task<IActionResult> GetAllApplications()
//        {
//            var applications = await _applicationRepository.GetAllApplicationsWithDetailsAsync();
//            var applicationDTOs = applications.Select(a => MapToDTO(a));
//            return Ok(applicationDTOs);
//        }

//        // GET: api/applications/{id}
//        [HttpGet("{id}")]
//        public async Task<IActionResult> GetApplicationById(int id)
//        {
//            var application = await _applicationRepository.GetApplicationDetailByIdAsync(id);
//            if (application == null)
//                return NotFound("Application not found");

//            return Ok(MapToDTO(application));
//        }

//        // POST: api/applications
//        [HttpPost]
//        public async Task<IActionResult> CreateApplication([FromBody] CreateApplicationDTO createApplicationDto)
//        {
//            if (!ModelState.IsValid)
//                return BadRequest(ModelState);

//            // Kiểm tra Candidate tồn tại
//            var candidate = await _userRepository.GetUserDetailByIdAsync(createApplicationDto.UserId);
//            if (candidate == null || candidate.Role != "Candidate")
//            {
//                return NotFound("Candidate not found");
//            }
            
//            if (candidate == null)
                

//            // Kiểm tra Job tồn tại
//            var job = await _jobRepository.GetJobDetailByIdAsync(createApplicationDto.JobId);
//            if (job == null || job.DeletedAt != null)
//                return NotFound("Job not found");

//            // Kiểm tra đã apply chưa
//            var existingApplication = await _context.Applications
//                .AnyAsync(a => a.UserId == createApplicationDto.UserId 
//                    && a.JobId == createApplicationDto.JobId 
//                    && a.DeletedAt == null);
            
//            if (existingApplication)
//                return BadRequest("Already applied for this job");

//            var application = new Application
//            {
//                UserId = createApplicationDto.UserId,
//                JobId = createApplicationDto.JobId,
//                AppliedDate = DateTime.Now,
//                Status = 1 // Đã nộp
//            };

//            _context.Applications.Add(application);
            
//            // Tăng ViewCount của Job
//            job.ViewCount = (job.ViewCount ?? 0) + 1;
            
//            await _context.SaveChangesAsync();

//            var applicationDto = new ApplicationResponseDTO
//            {
//                ApplicationId = application.AppId,
//                UserId = application.UserId,
//                JobId = application.JobId,
//                AppliedDate = application.AppliedDate,
//                Status = application.Status,
                
//                Candidate = new CandidateSummaryDTO
//                {
//                    UserId = candidate.UserId,
//                    FullName = candidate.User.FullName,
//                    Avatar = candidate.User != null ? candidate.User.Avatar : null,
//                    Email = candidate.User != null ? candidate.User.Email : null
//                },
                
//                Job = new JobSummaryDTO
//                {
//                    JobId = job.JobId,
//                    Title = job.Title,
//                    CompanyName = job.Company != null ? job.Company.CompanyName : ""
//                }
//            };

//            return CreatedAtAction(nameof(GetApplicationById), new { id = application.AppId }, applicationDto);
//        }

//        // PUT: api/applications/{id}
//        [HttpPut("{id}")]
//        public async Task<IActionResult> UpdateApplication(int id, [FromBody] UpdateApplicationDTO updateApplicationDto)
//        {
//            if (!ModelState.IsValid)
//                return BadRequest(ModelState);

//            var existingApplication = await _context.Applications
//                .FirstOrDefaultAsync(a => a.AppId == id && a.DeletedAt == null);
            
//            if (existingApplication == null)
//                return NotFound("Application not found");

//            existingApplication.Status = updateApplicationDto.Status ?? existingApplication.Status;

//            await _context.SaveChangesAsync();
//            return NoContent();
//        }

//        // DELETE: api/applications/{id}
//        [HttpDelete("{id}")]
//        public async Task<IActionResult> DeleteApplication(int id)
//        {
//            var application = await _context.Applications
//                .FirstOrDefaultAsync(a => a.AppId == id && a.DeletedAt == null);
            
//            if (application == null)
//                return NotFound("Application not found");

//            application.DeletedAt = DateTime.Now;
//            await _context.SaveChangesAsync();

//            return NoContent();
//        }

//        // GET: api/applications/job/{jobId}
//        [HttpGet("job/{jobId}")]
//        public async Task<IActionResult> GetApplicationsByJob(int jobId)
//        {
//            var applications = await _context.Applications
//                .Include(a => a.Candidate!)
//                    .ThenInclude(c => c.User)
//                .Where(a => a.JobId == jobId && a.DeletedAt == null)
//                .OrderByDescending(a => a.AppliedDate)
//                .Select(a => new ApplicationResponseDTO
//                {
//                    ApplicationId = a.AppId,
//                    UserId = a.UserId,
//                    JobId = a.JobId,
//                    AppliedDate = a.AppliedDate,
//                    Status = a.Status,
                    
//                    Candidate = a.Candidate == null ? null : new CandidateSummaryDTO
//                    {
//                        UserId = a.Candidate.UserId,
//                        FullName = a.Candidate.User.FullName,
//                        Avatar = a.Candidate.User != null ? a.Candidate.User.Avatar : null,
//                        Email = a.Candidate.User != null ? a.Candidate.User.Email : null,
//                        CVUrl = a.Candidate.CVUrl
//                    }
//                })
//                .ToListAsync();

//            return Ok(applications);
//        }

//        // GET: api/applications/candidate/{userId}
//        [HttpGet("candidate/{userId}")]
//        public async Task<IActionResult> GetApplicationsByCandidate(int userId)
//        {
//            var applications = await _context.Applications
//                .Include(a => a.Job!)
//                    .ThenInclude(j => j.Company)
//                .Include(a => a.Job!)
//                    .ThenInclude(j => j.Location)
//                .Where(a => a.UserId == userId && a.DeletedAt == null)
//                .OrderByDescending(a => a.AppliedDate)
//                .Select(a => new ApplicationResponseDTO
//                {
//                    ApplicationId = a.AppId,
//                    UserId = a.UserId,
//                    JobId = a.JobId,
//                    AppliedDate = a.AppliedDate,
//                    Status = a.Status,
                    
//                    Job = a.Job == null ? null : new JobSummaryDTO
//                    {
//                        JobId = a.Job.JobId,
//                        Title = a.Job.Title,
//                        SalaryMin = a.Job.SalaryMin,
//                        SalaryMax = a.Job.SalaryMax,
//                        CompanyName = a.Job.Company != null ? a.Job.Company.CompanyName : "",
//                        LocationName = a.Job.Location != null ? a.Job.Location.LocationName : "",
//                        Deadline = a.Job.Deadline,
//                        Status = a.Job.DeletedAt == null ? "Active" : "Closed"
//                    }
//                })
//                .ToListAsync();

//            return Ok(applications);
//        }

//        // PUT: api/applications/{id}/status
//        [HttpPut("{id}/status")]
//        public async Task<IActionResult> UpdateApplicationStatus(int id, [FromBody] int status)
//        {
//            var application = await _context.Applications
//                .FirstOrDefaultAsync(a => a.AppId == id && a.DeletedAt == null);
            
//            if (application == null)
//                return NotFound("Application not found");

//            application.Status = status;
//            await _context.SaveChangesAsync();

//            return Ok(new { message = $"Application status updated to {status}" });
//        }

//        // GET: api/applications/statistics/job/{jobId}
//        [HttpGet("statistics/job/{jobId}")]
//        public async Task<IActionResult> GetApplicationStatistics(int jobId)
//        {
//            var applications = await _context.Applications
//                .Where(a => a.JobId == jobId && a.DeletedAt == null)
//                .ToListAsync();

//            var statistics = new
//            {
//                TotalApplications = applications.Count,
//                Pending = applications.Count(a => a.Status == 1),
//                Reviewed = applications.Count(a => a.Status == 2),
//                Interviewed = applications.Count(a => a.Status == 3),
//                Accepted = applications.Count(a => a.Status == 4),
//                Rejected = applications.Count(a => a.Status == 5)
//            };

//            return Ok(statistics);
//        }

//        private bool ApplicationExists(int id)
//        {
//            return _context.Applications.Any(e => e.AppId == id && e.DeletedAt == null);
//        }
//        private ApplicationResponseDTO MapToDTO(Application a)
//        {
//            return new ApplicationResponseDTO
//            {
//                ApplicationId = a.AppId,
//                UserId = a.UserId,
//                JobId = a.JobId,
//                AppliedDate = a.AppliedDate,
//                Status = a.Status,

//                Candidate = a.Candidate == null ? null : new CandidateSummaryDTO
//                {
//                    UserId = a.Candidate.UserId,
//                    FullName = a.Candidate.User.FullName,
//                    Avatar = a.Candidate.User != null ? a.Candidate.User.Avatar : null,
//                    Email = a.Candidate.User != null ? a.Candidate.User.Email : null,
//                    CVUrl = a.Candidate.CVUrl
//                },

//                Job = a.Job == null ? null : new JobSummaryDTO
//                {
//                    JobId = a.Job.JobId,
//                    Title = a.Job.Title,
//                    SalaryMin = a.Job.SalaryMin,
//                    SalaryMax = a.Job.SalaryMax,
//                    CompanyName = a.Job.Company != null ? a.Job.Company.CompanyName : "",
//                    LocationName = a.Job.Location != null ? a.Job.Location.LocationName : "",
//                    Deadline = a.Job.Deadline
//                }
//            };
//        }
//    }
//}