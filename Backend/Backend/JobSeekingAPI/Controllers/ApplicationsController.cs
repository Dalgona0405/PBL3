// using Microsoft.AspNetCore.Mvc;
// using JobSeekingAPI.DTOs;
// using JobSeekingAPI.Models;
// using JobSeekingAPI.Repositories;

// namespace JobSeekingAPI.Controllers
// {
//     [Route("api/[controller]")]
//     [ApiController]
//     public class ApplicationsController : ControllerBase
//     {
//         private readonly IApplicationRepository _appRepo;
//         private readonly IJobRepository _jobRepo;
//         private readonly ICandidateRepository _candidateRepo;

//         public ApplicationsController(IApplicationRepository appRepo, IJobRepository jobRepo, ICandidateRepository candidateRepo)
//         {
//             _appRepo = appRepo;
//             _jobRepo = jobRepo;
//             _candidateRepo = candidateRepo;
//         }

//         // GET: api/applications => Cân nhắc phân trang
//         [HttpGet]
//         public async Task<IActionResult> GetAllApplications()
//         {
//             var applications = await _appRepo.GetAllApplicationsWithDetailsAsync();
//             var dtos = applications.Select(a => MapToDTO(a));
//             return Ok(dtos);
//         }

//         // GET: api/applications/{id}
//         [HttpGet("{id}")]
//         public async Task<IActionResult> GetApplicationById(int id)
//         {
//             var application = await _appRepo.GetApplicationDetailByIdAsync(id);
//             if (application == null)
//                 return NotFound("Application not found");

//             return Ok(MapToDTO(application));
//         }

//         // GET: api/applications/job/{jobId}
//         [HttpGet("jobs/{jobId}")]
//         public async Task<IActionResult> GetApplicationsByJob(int jobId)
//         {
//             var jobExists = await _jobRepo.GetByIdAsync(jobId);
//             if (jobExists == null) 
//                 return NotFound(new { message = "Job not found!" });

//             var applications = await _appRepo.GetByJobIdAsync(jobId);
//             var dtos = applications.Select(a => MapToDTO(a));
//             return Ok(dtos);
//         }

//         // GET: api/applications/me
//         [HttpGet("candidate/me")]
//         public async Task<IActionResult> GetMyApplications()
//         {
//             int userId = GetUserIdFromToken();
//             var applications = await _appRepo.GetByUserIdAsync(userId);
//             var dtos = applications.Select(a => MapToDTO(a));
//             return Ok(dtos);
//         }

//         // GET: api/applications/candidate/{userId}
//         [HttpGet("candidate/{userId}")]
//         public async Task<IActionResult> GetApplicationsByUser(int userId)
//         {
//             var applications = await _appRepo.GetByUserIdAsync(userId);
//             var dtos = applications.Select(a => MapToDTO(a));
//             return Ok(dtos);
//         }

//         // POST: api/applications
//         [HttpPost]
//         public async Task<IActionResult> CreateApplication([FromBody] CreateApplicationDTO dto)
//         {
//             if (!ModelState.IsValid)
//                 return BadRequest(ModelState);

//             // Kiểm tra Candidate tồn tại
//             var candidate = await _candidateRepo.GetByIdAsync(dto.UserId);
//             if (candidate == null) 
//                 return NotFound(new { message = "Candidate not found!" });

//             // Kiểm tra Job tồn tại
//             var job = await _jobRepo.GetByIdAsync(dto.JobId);
//             if (job == null) 
//                 return NotFound(new { message = "Job not found!" });

//             // Kiểm tra Job đã hết hạn (Không cho nộp Job quá hạn)
//             if (job.Deadline.HasValue && job.Deadline.Value < DateTime.UtcNow)
//                 return BadRequest(new { message = "This job is already expired!" });

//             // User đã nộp job này bao giờ chưa? (Chống Spam)
//             var hasApplied = await _appRepo.IsAppliedAsync(dto.UserId, dto.JobId);
//             if (hasApplied)
//                 return Conflict(new { message = "You have already applied for this job!" });

//             // Xử lý cho CvUrl: Nếu không gửi CV mới thì lấy CV mặc định
//             string finalCvUrl = dto.CVUrl ?? "";
//             if (string.IsNullOrWhiteSpace(finalCvUrl))
//             {
//                 finalCvUrl = candidate.CVUrl ?? "";
//                 if (string.IsNullOrWhiteSpace(finalCvUrl))
//                     return BadRequest(new { message = "Please provide a CV to apply" });
//             }

//             // Tạo đơn ứng tuyển
//             var application = new Application
//             {
//                 UserId = dto.UserId,
//                 JobId = dto.JobId,
//                 CVUrl = finalCvUrl,
//             };

//             var createdApp = await _appRepo.CreateApplicationDetailAsync(application);
//             return CreatedAtAction(nameof(GetApplicationById), new { id = createdApp.AppId }, MapToDTO(createdApp));
//         }

//         // PUT: api/applications/candidate/me/{id}
//         [HttpPut("{id}")]
//         public async Task<IActionResult> UpdateApplication(int id, [FromBody] UpdateApplicationDTO dto)
//         {
//             if (!ModelState.IsValid)
//                 return BadRequest(ModelState);

//             var existApplication = await _appRepo.GetApplicationEntityByIdAsync(id);
//             if (existApplication == null)
//                 return NotFound("Application not found");

//             existApplication.CVUrl = dto.CVUrl ?? existApplication.CVUrl;

//             await _appRepo.UpdateAsync(existApplication);
//             return Ok(new { message = "Update success" });
//         }

//         // PUT: api/applications/{id}/status
//         [HttpPut("{id}/status")]
//         public async Task<IActionResult> UpdateApplicationStatus(int id, [FromBody] UpdateApplicationStatusDTO dto)
//         {
//             if (!ModelState.IsValid)
//                 return BadRequest(ModelState);
//             var existApplication = await _appRepo.GetApplicationEntityByIdAsync(id);
//             if (existApplication == null)
//                 return NotFound("Application not found");
//             existApplication.Status = dto.Status;
//             await _appRepo.UpdateAsync(existApplication);
//             return Ok(new { message = "Status updated successfully!" });
//         }

//         // DELETE: api/applications/{id}
//         [HttpDelete("{id}")]
//         public async Task<IActionResult> WithdrawApplication(int id)
//         {
//             var application = await _appRepo.GetByIdAsync(id);
//             if (application == null)
//                 return NotFound(new { message = "Application not found!" });

//             await _appRepo.SoftDeleteApplicationAsync(id);

//             return Ok(new { message = "Application withdrawn successfully!" });
//         }

//         // GET: api/applications/statistics/job/{jobId}
//         [HttpGet("statistics/job/{jobId}")]
//         public async Task<IActionResult> GetApplicationStatistics(int jobId)
//         {
//             var statistics = await _appRepo.GetApplicationStatusStatisticsAsync(jobId);

//             // statistics likely contains KeyValuePair<int,int> mapping Status -> Count
//             var total = statistics?.Sum(kv => kv.Value) ?? 0;

//             var result = new
//             {
//                 TotalApplications = total,
//                 Pending = statistics?.FirstOrDefault(kv => kv.Key == 1).Value ?? 0,
//                 Interviewed = statistics?.FirstOrDefault(kv => kv.Key == 2).Value ?? 0,
//                 Accepted = statistics?.FirstOrDefault(kv => kv.Key == 3).Value ?? 0,
//                 Rejected = statistics?.FirstOrDefault(kv => kv.Key == 4).Value ?? 0
//             };

//             return Ok(result);
//         }

//         private ApplicationResponseDTO MapToDTO(Application a)
//         {
//             return new ApplicationResponseDTO
//             {
//                 ApplicationId = a.AppId,
//                 UserId = a.UserId,
//                 JobId = a.JobId,
//                 AppliedDate = a.AppliedDate,
//                 Status = a.Status,
//                 CVUrl = a.CVUrl,

//                 Candidate = a.Candidate == null ? null : new CandidateSummaryDTO
//                 {
//                     UserId = a.Candidate.UserId,
//                     FullName = a.Candidate.User?.FullName ?? "Unknown",
//                     Avatar = a.Candidate.User?.Avatar,
//                     Email = a.Candidate.User?.Email,
//                     CVUrl = a.Candidate.CVUrl
//                 },

//                 Job = a.Job == null ? null : new JobSummaryDTO
//                 {
//                     JobId = a.Job.JobId,
//                     Title = a.Job.Title,
//                     SalaryMin = a.Job.SalaryMin,
//                     SalaryMax = a.Job.SalaryMax,
//                     CompanyName = a.Job.Company?.CompanyName ?? "Unknown",
//                     LocationName = a.Job.Location?.LocationName ?? "Unknown",
//                     Deadline = a.Job.Deadline
//                 }
//             };
//         }
//     }
// }