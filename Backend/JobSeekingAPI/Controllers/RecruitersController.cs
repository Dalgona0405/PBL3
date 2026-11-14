using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    /// <summary>
    /// Quản lý thông tin hồ sơ nhà tuyển dụng (Recruiter) và danh sách nhân sự theo doanh nghiệp
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class RecruitersController : ControllerBase
    {
        private readonly IRecruiterService _recruiterService;

        public RecruitersController(IRecruiterService recruiterService)
        {
            _recruiterService = recruiterService;
        }

        /// <summary>
        /// Lấy hồ sơ chi tiết của một nhà tuyển dụng theo UserId
        /// </summary>
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter + ", " + UserRoles.Company)]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRecruiterById(int id)
        {
            var dto = await _recruiterService.GetRecruiterByIdAsync(id);
            return Ok(dto);
        }

        /// <summary>
        /// Lấy danh sách các nhà tuyển dụng trực thuộc một doanh nghiệp
        /// </summary>
        [AllowAnonymous]
        [HttpGet("company/{companyId}")]
        public async Task<IActionResult> GetRecruitersByCompany(int companyId)
        {
            var dtos = await _recruiterService.GetRecruitersByCompanyAsync(companyId);
            return Ok(dtos);
        }

        /// <summary>
        /// Cập nhật hồ sơ nhà tuyển dụng hoặc gỡ nhân sự HR khỏi doanh nghiệp (Dành cho Company Master)
        /// </summary>
        [Authorize(Roles = UserRoles.Recruiter + ", " + UserRoles.Company)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRecruiter(int id, [FromBody] UpdateRecruiterDTO dto)
        {
            int currentUserId = User.GetUserIdFromToken();
            var message = await _recruiterService.UpdateRecruiterAsync(id, dto, currentUserId, User.IsInRole(UserRoles.Company));
            return Ok(new { message });
        }
    }
}
