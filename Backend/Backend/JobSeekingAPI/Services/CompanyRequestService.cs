using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    public class CompanyRequestService : ICompanyRequestService
    {
        private readonly ICompanyJoinRequestRepository _requestRepo;
        private readonly IRecruiterRepository _recruiterRepo;
        private readonly ICompanyRepository _companyRepo;

        public CompanyRequestService(ICompanyJoinRequestRepository requestRepo, IRecruiterRepository recruiterRepo, ICompanyRepository companyRepo)
        {
            _requestRepo = requestRepo;
            _recruiterRepo = recruiterRepo;
            _companyRepo = companyRepo;
        }

        public async Task CreateRequestAsync(int userId, CreateCompanyRequestDTO dto)
        {
            // 1. Kiểm tra công ty có tồn tại không
            var company = await _companyRepo.GetByIdAsync(dto.CompanyId);
            if (company == null)
                throw new KeyNotFoundException("Company not exists");

            // 2. Kiểm tra xem có đang chờ duyệt đơn nào khác không (Chống spam)
            bool isPending = await _requestRepo.HasPendingRequestAsync(userId);
            if (isPending)
                throw new ArgumentException("You already have a pending request. Please wait for the Admin to process it.");

            var request = new CompanyJoinRequest
            {
                UserId = userId,
                CompanyId = dto.CompanyId,
                Status = (int)CompanyRequestStatus.Pending
            };

            await _requestRepo.CreateAsync(request);
        }

        public async Task<IEnumerable<CompanyRequestSummaryDTO>> GetPendingRequestsAsync(int companyOwnerId)
        {
            var ownerProfile = await _recruiterRepo.GetRecruiterEntityByIdAsync(companyOwnerId);
            if (ownerProfile == null)
                throw new UnauthorizedAccessException("Not found your company information!");

            var requests = await _requestRepo.GetPendingRequestsByCompanyAsync(ownerProfile.CompanyId);
            
            return requests.Select(r => new CompanyRequestSummaryDTO
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
        }

        public async Task<string> UpdateRequestStatusAsync(int id, UpdateCompanyRequestStatusDTO dto)
        {
            var request = await _requestRepo.GetByIdAsync(id);
            if (request == null)
                throw new KeyNotFoundException("Request not found!");

            if (request.Status != (int)CompanyRequestStatus.Pending)
                throw new ArgumentException("This request has already been processed!");

            // Cập nhật trạng thái yêu cầu
            request.Status = dto.Status;
            await _requestRepo.UpdateAsync(request);

            // NẾU ADMIN DUYỆT -> Cập nhật CompanyId cho Recruiter
            if (dto.Status == (int)CompanyRequestStatus.Approved)
            {
                var recruiter = await _recruiterRepo.GetRecruiterEntityByIdAsync(request.UserId);
                if (recruiter != null)
                {
                    recruiter.CompanyId = request.CompanyId;
                    await _recruiterRepo.UpdateAsync(recruiter);
                }
            }

            return dto.Status == (int)CompanyRequestStatus.Approved ? "Request approved successfully!" : "Request rejected!";
        }
    }
}