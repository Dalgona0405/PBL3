using JobSeekingAPI.DTOs;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Services;
using JobSeekingAPI.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ApplicationsController : ControllerBase
    {
        private readonly IApplicationService _applicationService;
        public ApplicationsController(IApplicationService applicationService)
        {
            _applicationService = applicationService;
        }

        [Authorize(Roles = UserRoles.Admin)]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetApplicationById(int id)
        {
            var result = await _applicationService.GetApplicationByIdAsync(id);
            return Ok(result);
        }

        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter)]
        [HttpGet("jobs/{jobId}")]
        public async Task<IActionResult> GetApplicationsByJob(int jobId)
        {
            var userId = User.GetUserIdFromToken();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            var result = await _applicationService.GetApplicationsByJobAsync(jobId, userId, role);
            return Ok(result);
        }

        [Authorize(Roles = UserRoles.Candidate)]
        [HttpGet("candidate/me")]
        public async Task<IActionResult> GetMyApplications()
        {
            int userId = User.GetUserIdFromToken();
            var result = await _applicationService.GetMyApplicationsAsync(userId);
            return Ok(result);
        }

        [Authorize(Roles = UserRoles.Admin)]
        [HttpGet("candidate/{userId}")]
        public async Task<IActionResult> GetApplicationsByUser(int userId)
        {
            var result = await _applicationService.GetApplicationsByUserAsync(userId);
            return Ok(result);
        }

        [Authorize(Roles = UserRoles.Candidate)]
        [HttpPost]
        public async Task<IActionResult> CreateApplication([FromBody] CreateApplicationDTO dto)
        {
            // Không cần try...catch nữa vì ExceptionMiddleware sẽ tự lo việc bắt lỗi!
            var createdApp = await _applicationService.ApplyForJobAsync(dto);
            return CreatedAtAction(nameof(GetApplicationById), new { id = createdApp.ApplicationId }, createdApp);
        }

        [Authorize(Roles = UserRoles.Candidate)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateApplication(int id, [FromBody] UpdateApplicationDTO dto)
        {
            var userId = User.GetUserIdFromToken();
            await _applicationService.UpdateApplicationAsync(id, dto, userId);
            return Ok(new { message = "Update success" });
        }

        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter)]
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateApplicationStatus(int id, [FromBody] UpdateApplicationStatusDTO dto)
        {
            var userId = User.GetUserIdFromToken();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            await _applicationService.UpdateApplicationStatusAsync(id, dto, userId, role);
            return Ok(new { message = "Status updated successfully!" });
        }

        [Authorize(Roles = UserRoles.Candidate)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> WithdrawApplication(int id)
        {
            var userId = User.GetUserIdFromToken();
            await _applicationService.WithdrawApplicationAsync(id, userId);
            return Ok(new { message = "Application withdrawn successfully!" });
        }

        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter)]
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