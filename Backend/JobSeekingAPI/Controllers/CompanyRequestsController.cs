using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    /// <summary>
    /// Quản lý các yêu cầu gia nhập doanh nghiệp từ nhà tuyển dụng (Recruiter)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class CompanyRequestsController : ControllerBase
    {
        private readonly ICompanyRequestService _requestService;

        public CompanyRequestsController(ICompanyRequestService requestService)
        {
            _requestService = requestService;
        }

        /// <summary>
        /// Gửi yêu cầu gia nhập vào một doanh nghiệp (Dành cho Recruiter)
        /// </summary>
        [Authorize(Roles = UserRoles.Recruiter)]
        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] CreateCompanyRequestDTO dto)
        {
            int userId = User.GetUserIdFromToken();
            await _requestService.CreateRequestAsync(userId, dto);
            return Ok(new { message = "Đã gửi yêu cầu gia nhập doanh nghiệp thành công. Vui lòng chờ doanh nghiệp phê duyệt." });
        }

        /// <summary>
        /// Lấy danh sách yêu cầu gia nhập đang chờ duyệt của doanh nghiệp hiện tại
        /// </summary>
        [Authorize(Roles = UserRoles.Company)]
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            int companyOwnerId = User.GetUserIdFromToken();
            var dtos = await _requestService.GetPendingRequestsAsync(companyOwnerId);
            return Ok(dtos);
        }

        /// <summary>
        /// Phê duyệt hoặc từ chối yêu cầu gia nhập doanh nghiệp
        /// </summary>
        [Authorize(Roles = UserRoles.Company)]
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateRequestStatus(int id, [FromBody] UpdateCompanyRequestStatusDTO dto)
        {
            int companyOwnerId = User.GetUserIdFromToken();
            var msg = await _requestService.UpdateRequestStatusAsync(id, dto, companyOwnerId);
            return Ok(new { message = msg });
        }
    }
}
