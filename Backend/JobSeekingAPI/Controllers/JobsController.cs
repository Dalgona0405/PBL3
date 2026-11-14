using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    /// <summary>
    /// Quản lý tin tuyển dụng, tìm kiếm nâng cao, lưu việc làm và gợi ý việc làm phù hợp bằng AI
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class JobsController : ControllerBase
    {
        private readonly IJobService _jobService;
        private readonly IMatchingService _matchingService;

        public JobsController(IJobService jobService, IMatchingService matchingService)
        {
            _jobService = jobService;
            _matchingService = matchingService;
        }

        /// <summary>
        /// Lấy chi tiết tin tuyển dụng theo Id và tự động tăng lượt xem
        /// </summary>
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetJobById(int id)
        {
            var jobDto = await _jobService.GetJobByIdAsync(id);
            return Ok(jobDto);
        }

        /// <summary>
        /// Tìm kiếm và lọc tin tuyển dụng theo nhiều tiêu chí (phân trang)
        /// </summary>
        [AllowAnonymous]
        [HttpGet("search")]
        public async Task<IActionResult> SearchJobs([FromQuery] JobSearchDTO searchParams)
        {
            var result = await _jobService.SearchJobsAsync(searchParams);
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách tin tuyển dụng mới nhất
        /// </summary>
        [AllowAnonymous]
        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentJobs([FromQuery] int count = 8)
        {
            var jobDTOs = await _jobService.GetRecentJobsAsync(count);
            return Ok(jobDTOs);
        }

        /// <summary>
        /// Lấy danh sách tin tuyển dụng của một doanh nghiệp
        /// </summary>
        [AllowAnonymous]
        [HttpGet("company/{companyId}")]
        public async Task<IActionResult> GetJobsByCompany(int companyId)
        {
            var jobDTOs = await _jobService.GetJobsByCompanyAsync(companyId);
            return Ok(jobDTOs);
        }

        /// <summary>
        /// Lấy danh sách tin tuyển dụng của nhà tuyển dụng hiện tại (bao gồm Freelance Recruiter)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter + ", " + UserRoles.Company)]
        [HttpGet("my-jobs")]
        public async Task<IActionResult> GetMyJobs()
        {
            var userId = User.GetUserIdFromToken();
            var jobDTOs = await _jobService.GetMyJobsAsync(userId);
            return Ok(jobDTOs);
        }

        /// <summary>
        /// Đăng tin tuyển dụng mới
        /// </summary>
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter + ", " + UserRoles.Company)]
        [HttpPost]
        public async Task<IActionResult> CreateJob([FromBody] CreateJobDTO dto)
        {
            var userId = User.GetUserIdFromToken();
            bool isAdmin = User.IsInRole(UserRoles.Admin);
            var createdJob = await _jobService.CreateJobAsync(dto, userId, isAdmin);
            return CreatedAtAction(nameof(GetJobById), new { id = createdJob.JobId }, createdJob);
        }

        /// <summary>
        /// Cập nhật nội dung tin tuyển dụng
        /// </summary>
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter + ", " + UserRoles.Company)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJob(int id, [FromBody] UpdateJobDTO dto)
        {
            var userId = User.GetUserIdFromToken();
            bool isRecruiter = User.IsInRole(UserRoles.Recruiter) || User.IsInRole(UserRoles.Company);

            await _jobService.UpdateJobAsync(id, dto, userId, isRecruiter);
            return Ok(new { message = "Cập nhật tin tuyển dụng thành công." });
        }

        /// <summary>
        /// Đóng hoặc mở lại trạng thái hiển thị của tin tuyển dụng
        /// </summary>
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter + ", " + UserRoles.Company)]
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateJobStatus(int id, [FromBody] JobUpdateStatusDTO dto)
        {
            var userId = User.GetUserIdFromToken();
            bool isRecruiter = User.IsInRole(UserRoles.Recruiter) || User.IsInRole(UserRoles.Company);

            await _jobService.UpdateJobStatusAsync(id, dto, userId, isRecruiter);
            return Ok(new { message = "Cập nhật trạng thái tin tuyển dụng thành công." });
        }

        /// <summary>
        /// Xóa mềm tin tuyển dụng
        /// </summary>
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter + ", " + UserRoles.Company)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJob(int id)
        {
            var userId = User.GetUserIdFromToken();
            bool isRecruiter = User.IsInRole(UserRoles.Recruiter) || User.IsInRole(UserRoles.Company);

            await _jobService.DeleteJobAsync(id, userId, isRecruiter);
            return Ok(new { message = "Xóa tin tuyển dụng thành công." });
        }

        /// <summary>
        /// Tính điểm độ phù hợp (AI Match Score) giữa một tin tuyển dụng và một ứng viên
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate + ", " + UserRoles.Admin)]
        [HttpGet("{jobId}/match/{candidateId}")]
        public async Task<IActionResult> GetJobMatchScore(int jobId, int candidateId)
        {
            int currentUserId = User.GetUserIdFromToken();
            if (User.IsInRole(UserRoles.Candidate) && currentUserId != candidateId)
                throw new ForbiddenAccessException("Bạn không có quyền xem điểm phù hợp của ứng viên khác.");
            var result = await _matchingService.GetJobMatchScoreAsync(jobId, candidateId);
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách tin tuyển dụng được AI gợi ý phù hợp nhất cho ứng viên hiện tại
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate + ", " + UserRoles.Admin)]
        [HttpGet("suggested")]
        public async Task<IActionResult> GetSuggestedJobs([FromQuery] int topN = 6)
        {
            int userId = User.GetUserIdFromToken();
            var suggestions = await _matchingService.GetTopJobSuggestionsForCandidateAsync(userId, topN);
            return Ok(suggestions);
        }

        /// <summary>
        /// Lưu tin tuyển dụng vào danh sách quan tâm của ứng viên
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate)]
        [HttpPost("{id}/save")]
        public async Task<IActionResult> SaveJob(int id)
        {
            int userId = User.GetUserIdFromToken();
            await _jobService.SaveJobAsync(userId, id);

            return Ok(new { message = "Đã lưu tin tuyển dụng thành công." });
        }

        /// <summary>
        /// Bỏ lưu tin tuyển dụng khỏi danh sách quan tâm của ứng viên
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate)]
        [HttpDelete("{id}/save")]
        public async Task<IActionResult> UnsaveJob(int id)
        {
            int userId = User.GetUserIdFromToken();
            await _jobService.UnsaveJobAsync(userId, id);

            return Ok(new { message = "Đã bỏ lưu tin tuyển dụng." });
        }

        /// <summary>
        /// Bật hoặc tắt hiển thị các tin tuyển dụng tổng hợp (cào từ thị trường)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpPatch("scraped-visibility")]
        public IActionResult ToggleScrapedJobsVisibility([FromQuery] bool show)
        {
            var showScrapedJobs = _jobService.ToggleScrapedJobsVisibility(show);
            return Ok(new
            {
                showScrapedJobs,
                message = showScrapedJobs
                    ? "Đã BẬT hiển thị các tin tuyển dụng tổng hợp thị trường."
                    : "Đã TẮT hiển thị tin cào (Chỉ hiển thị tin đăng nội bộ trên hệ thống)."
            });
        }

        /// <summary>
        /// Kiểm tra trạng thái hiển thị hiện tại của nhóm tin tuyển dụng tổng hợp
        /// </summary>
        [AllowAnonymous]
        [HttpGet("scraped-visibility")]
        public IActionResult GetScrapedJobsVisibility()
        {
            return Ok(new { showScrapedJobs = _jobService.GetScrapedJobsVisibility() });
        }
    }
}
