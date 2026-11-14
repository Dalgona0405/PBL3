using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace JobSeekingAPI.Controllers
{
    /// <summary>
    /// Quản lý hồ sơ ứng tuyển, theo dõi quy trình tuyển dụng (ATS Pipeline) và thống kê nộp đơn
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ApplicationsController : ControllerBase
    {
        private readonly IApplicationService _applicationService;

        public ApplicationsController(IApplicationService applicationService)
        {
            _applicationService = applicationService;
        }

        /// <summary>
        /// Lấy chi tiết một hồ sơ ứng tuyển theo mã (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetApplicationById(int id)
        {
            var result = await _applicationService.GetApplicationByIdAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách hồ sơ ứng tuyển của một tin tuyển dụng
        /// </summary>
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter + ", " + UserRoles.Company)]
        [HttpGet("jobs/{jobId}")]
        public async Task<IActionResult> GetApplicationsByJob(int jobId)
        {
            var userId = User.GetUserIdFromToken();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            var result = await _applicationService.GetApplicationsByJobAsync(jobId, userId, role);
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách các công việc ứng viên đang đăng nhập đã ứng tuyển
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate)]
        [HttpGet("candidate/me")]
        public async Task<IActionResult> GetMyApplications()
        {
            int userId = User.GetUserIdFromToken();
            var result = await _applicationService.GetMyApplicationsAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Lấy lịch sử ứng tuyển của một ứng viên theo UserId (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpGet("candidate/{userId}")]
        public async Task<IActionResult> GetApplicationsByUser(int userId)
        {
            var result = await _applicationService.GetApplicationsByUserAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Nộp hồ sơ ứng tuyển vào tin tuyển dụng và tự động tính điểm AI Matching
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate)]
        [HttpPost]
        public async Task<IActionResult> CreateApplication([FromBody] CreateApplicationDTO dto)
        {
            int currentUserId = User.GetUserIdFromToken();
            if (dto.UserId != currentUserId)
                throw new ForbiddenAccessException("Bạn không thể nộp hồ sơ thay cho tài khoản khác.");
            var createdApp = await _applicationService.ApplyForJobAsync(dto);
            return CreatedAtAction(nameof(GetApplicationById), new { id = createdApp.ApplicationId }, createdApp);
        }

        /// <summary>
        /// Cập nhật tệp CV đính kèm cho đơn ứng tuyển đã nộp
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate)]
        [HttpPatch("{id}/cv")]
        public async Task<IActionResult> UpdateApplication(int id, [FromBody] UpdateApplicationDTO dto)
        {
            var userId = User.GetUserIdFromToken();
            await _applicationService.UpdateApplicationAsync(id, dto, userId);
            return Ok(new { message = "Cập nhật CV ứng tuyển thành công." });
        }

        /// <summary>
        /// Chuyển trạng thái hồ sơ trên Kanban ATS, tạo lịch phỏng vấn và gửi thông báo
        /// </summary>
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter + ", " + UserRoles.Company)]
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateApplicationStatus(int id, [FromBody] UpdateApplicationStatusDTO dto)
        {
            var userId = User.GetUserIdFromToken();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            await _applicationService.UpdateApplicationStatusAsync(id, dto, userId, role);
            return Ok(new { message = "Cập nhật trạng thái ứng tuyển thành công." });
        }

        /// <summary>
        /// Rút lại hồ sơ ứng tuyển (Soft delete)
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> WithdrawApplication(int id)
        {
            var userId = User.GetUserIdFromToken();
            await _applicationService.WithdrawApplicationAsync(id, userId);
            return Ok(new { message = "Rút hồ sơ ứng tuyển thành công." });
        }

        /// <summary>
        /// Thống kê số lượng hồ sơ theo từng giai đoạn tuyển dụng của một công việc
        /// </summary>
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter + ", " + UserRoles.Company)]
        [HttpGet("statistics/job/{jobId}")]
        public async Task<IActionResult> GetApplicationStatistics(int jobId)
        {
            var userId = User.GetUserIdFromToken();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            var result = await _applicationService.GetApplicationStatisticsAsync(jobId, userId, role);
            return Ok(result);
        }
    }
}
