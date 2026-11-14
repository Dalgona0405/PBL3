using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    /// <summary>
    /// Quản lý thông tin doanh nghiệp và trạng thái xác thực thương hiệu (Tick xanh)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class CompaniesController : ControllerBase
    {
        private readonly ICompanyService _companyService;

        public CompaniesController(ICompanyService companyService)
        {
            _companyService = companyService;
        }

        /// <summary>
        /// Lấy danh sách tóm tắt toàn bộ doanh nghiệp đang hoạt động
        /// </summary>
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAllCompanies()
        {
            var companies = await _companyService.GetAllCompaniesAsync();
            return Ok(companies);
        }

        /// <summary>
        /// Lấy thông tin chi tiết một doanh nghiệp cùng danh sách việc làm và nhà tuyển dụng
        /// </summary>
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCompanyById(int id)
        {
            var company = await _companyService.GetCompanyByIdAsync(id);
            return Ok(company);
        }

        /// <summary>
        /// Tra cứu mã doanh nghiệp thuộc quyền quản lý hoặc liên kết với nhà tuyển dụng
        /// </summary>
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter + ", " + UserRoles.Company)]
        [HttpGet("recruiters/{recruiterId}")]
        public async Task<IActionResult> GetCompanyIdByRecruiterId(int recruiterId)
        {
            var userId = User.GetUserIdFromToken();
            var companyId = await _companyService.GetCompanyIdByRecruiterIdAsync(recruiterId, userId, User.IsInRole(UserRoles.Recruiter));
            return Ok(new { CompanyId = companyId });
        }

        /// <summary>
        /// Tạo mới hồ sơ doanh nghiệp (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpPost]
        public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyDTO dto)
        {
            var company = await _companyService.CreateCompanyAsync(dto);
            return CreatedAtAction(nameof(GetCompanyById), new { id = company.CompanyId }, company);
        }

        /// <summary>
        /// Cập nhật thông tin doanh nghiệp của tài khoản Company Master
        /// </summary>
        [Authorize(Roles = UserRoles.Company)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompany(int id, [FromBody] UpdateCompanyDTO dto)
        {
            var userId = User.GetUserIdFromToken();
            await _companyService.UpdateCompanyAsync(id, dto, userId);
            return Ok(new { message = "Cập nhật thông tin doanh nghiệp thành công." });
        }

        /// <summary>
        /// Xóa mềm một doanh nghiệp (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompany(int id)
        {
            await _companyService.DeleteCompanyAsync(id);
            return Ok(new { message = "Xóa doanh nghiệp thành công." });
        }

        /// <summary>
        /// Tìm kiếm doanh nghiệp theo tên (phân trang)
        /// </summary>
        [AllowAnonymous]
        [HttpGet("search")]
        public async Task<IActionResult> SearchCompanies(
            [FromQuery] string? keyword,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _companyService.SearchCompaniesAsync(keyword, page, pageSize);
            return Ok(result);
        }

        /// <summary>
        /// Cấp hoặc thu hồi Tick Xanh xác thực cho doanh nghiệp (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpPatch("{id}/verify")]
        public async Task<IActionResult> VerifyCompanyBadge(int id, [FromQuery] bool isVerified = true)
        {
            var (message, companyId, verified, verifiedAt) = await _companyService.VerifyCompanyBadgeAsync(id, isVerified);
            return Ok(new
            {
                message,
                companyId,
                isVerified = verified,
                verifiedAt
            });
        }
    }
}
