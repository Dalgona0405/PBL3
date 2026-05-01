using Microsoft.AspNetCore.Mvc;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using JobSeekingAPI.Helpers;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompanyRequestsController : ControllerBase
    {
        private readonly ICompanyJoinRequestRepository _requestRepo;
        private readonly IRecruiterRepository _recruiterRepo;
        private readonly ICompanyRepository _companyRepo;

        public CompanyRequestsController(
            ICompanyJoinRequestRepository requestRepo,
            IRecruiterRepository recruiterRepo,
            ICompanyRepository companyRepo)
        {
            _requestRepo = requestRepo;
            _recruiterRepo = recruiterRepo;
            _companyRepo = companyRepo;
        }

        // POST: api/CompanyRequests/me
        [Authorize(Roles = "Recruiter")]
        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] CreateCompanyRequestDTO dto)
        {
            int userId = User.GetUserIdFromToken();

            // Kiểm tra công ty có tồn tại không
            var company = await _companyRepo.GetByIdAsync(dto.CompanyId);
            if (company == null) return NotFound(new { message = "Company not exists" });

            // Kiểm tra xem có đang chờ duyệt đơn nào khác không (Chống spam)
            bool isPending = await _requestRepo.HasPendingRequestAsync(userId);
            if (isPending) return BadRequest(new { message = "You already have a pending request. Please wait for the Admin to process it." });

            var request = new CompanyJoinRequest
            {
                UserId = userId,
                CompanyId = dto.CompanyId,
                Status = 0 // Pending
            };

            await _requestRepo.CreateAsync(request);
            return Ok(new { message = "Successfully sent a request to join the company. Please wait for the Admin to approve!" });
        }

        // GET: api/CompanyRequests/pending
        [Authorize(Roles = "Admin")]
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var requests = await _requestRepo.GetPendingRequestsAsync();
            var dtos = requests.Select(r => new CompanyRequestSummaryDTO
            {
                RequestId = r.RequestId,
                UserId = r.UserId,
                RecruiterName = r.Recruiter?.User?.FullName ?? "Unknown",
                RecruiterEmail = r.Recruiter?.User?.Email ?? "Unknown",
                CompanyId = r.CompanyId,
                CompanyName = r.Company?.CompanyName ?? "Unknown",
                Status = r.Status,
                CreatedAt = r.CreatedAt
            });

            return Ok(dtos);
        }

        // 3. ADMIN: Duyệt hoặc Từ chối yêu cầu
        [Authorize(Roles = "Admin")]
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateRequestStatus(int id, [FromBody] UpdateCompanyRequestStatusDTO dto)
        {
            // Lấy yêu cầu ra
            var request = await _requestRepo.GetByIdAsync(id);
            if (request == null) return NotFound(new { message = "Request not found!" });

            if (request.Status != 0) return BadRequest(new { message = "This request has already been processed!" });

            // Cập nhật trạng thái yêu cầu
            request.Status = dto.Status;
            await _requestRepo.UpdateAsync(request);

            // NẾU ADMIN DUYỆT (Status == 1) -> Cập nhật CompanyId cho Recruiter
            if (dto.Status == 1)
            {
                var recruiter = await _recruiterRepo.GetRecruiterEntityByIdAsync(request.UserId);
                if (recruiter != null)
                {
                    recruiter.CompanyId = request.CompanyId;
                    await _recruiterRepo.UpdateAsync(recruiter);
                }
            }

            string msg = dto.Status == 1 ? "Request approved successfully!" : "Request rejected!";
            return Ok(new { message = msg });
        }
    }
}