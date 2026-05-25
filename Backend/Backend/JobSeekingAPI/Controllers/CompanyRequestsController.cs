using JobSeekingAPI.DTOs;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Services;
using JobSeekingAPI.Enums;
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

        [Authorize(Roles = UserRoles.Admin)]
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var dtos = await _requestService.GetPendingRequestsAsync();
            return Ok(dtos);
        }

        [Authorize(Roles = UserRoles.Admin)]
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateRequestStatus(int id, [FromBody] UpdateCompanyRequestStatusDTO dto)
        {
            var msg = await _requestService.UpdateRequestStatusAsync(id, dto);
            return Ok(new { message = msg });
        }
    }
}