using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompanyRequestsController : ControllerBase
    {
        private readonly ICompanyRequestService _requestService;

        public CompanyRequestsController(ICompanyRequestService requestService)
        {
            _requestService = requestService;
        }

        [Authorize(Roles = UserRoles.Recruiter)]
        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] CreateCompanyRequestDTO dto)
        {
            int userId = User.GetUserIdFromToken();
            await _requestService.CreateRequestAsync(userId, dto);
            return Ok(new { message = "Successfully sent a request to join the company. Please wait for the Admin to approve!" });
        }

        [Authorize(Roles = UserRoles.Company)]
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            int companyOwnerId = User.GetUserIdFromToken();
            var dtos = await _requestService.GetPendingRequestsAsync(companyOwnerId);
            return Ok(dtos);
        }

        [Authorize(Roles = UserRoles.Company)]
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateRequestStatus(int id, [FromBody] UpdateCompanyRequestStatusDTO dto)
        {
            var msg = await _requestService.UpdateRequestStatusAsync(id, dto);
            return Ok(new { message = msg });
        }
    }
}