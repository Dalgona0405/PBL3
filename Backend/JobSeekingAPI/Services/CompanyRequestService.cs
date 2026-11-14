using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    /// <summary>
    /// Xử lý quy trình gửi và xét duyệt yêu cầu gia nhập doanh nghiệp của nhà tuyển dụng
    /// </summary>
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

        /// <summary>
        /// Tạo yêu cầu gia nhập doanh nghiệp mới cho nhà tuyển dụng (kiểm tra trùng đơn chờ duyệt)
        /// </summary>
        public async Task CreateRequestAsync(int userId, CreateCompanyRequestDTO dto)
        {
            var company = await _companyRepo.GetByIdAsync(dto.CompanyId);
            if (company == null)
                throw new KeyNotFoundException("Không tìm thấy doanh nghiệp.");

            bool isPending = await _requestRepo.HasPendingRequestAsync(userId);
            if (isPending)
                throw new ArgumentException("Bạn đã có một yêu cầu đang chờ duyệt. Vui lòng đợi phản hồi từ doanh nghiệp.");

            var request = new CompanyJoinRequest
            {
                UserId = userId,
                CompanyId = dto.CompanyId,
                Status = (int)CompanyRequestStatus.Pending
            };

            await _requestRepo.CreateAsync(request);
        }

        /// <summary>
        /// Lấy danh sách các yêu cầu gia nhập đang chờ xét duyệt thuộc doanh nghiệp quản lý
        /// </summary>
        public async Task<IEnumerable<CompanyRequestSummaryDTO>> GetPendingRequestsAsync(int companyOwnerId)
        {
            var ownerProfile = await _recruiterRepo.GetRecruiterEntityByIdAsync(companyOwnerId);
            if (ownerProfile == null || !ownerProfile.CompanyId.HasValue)
                throw new ForbiddenAccessException("Bạn không có quyền quản lý yêu cầu gia nhập của doanh nghiệp này.");

            var requests = await _requestRepo.GetPendingRequestsByCompanyAsync(ownerProfile.CompanyId.Value);

            return requests.Select(r => r.ToSummaryDto());
        }

        /// <summary>
        /// Phê duyệt hoặc từ chối yêu cầu gia nhập và cập nhật CompanyId cho Recruiter khi được chấp thuận
        /// </summary>
        public async Task<string> UpdateRequestStatusAsync(int id, UpdateCompanyRequestStatusDTO dto, int companyOwnerId)
        {
            var request = await _requestRepo.GetByIdAsync(id);
            if (request == null)
                throw new KeyNotFoundException("Không tìm thấy yêu cầu gia nhập.");

            var ownerProfile = await _recruiterRepo.GetRecruiterEntityByIdAsync(companyOwnerId);
            if (ownerProfile == null || request.CompanyId != ownerProfile.CompanyId)
                throw new ForbiddenAccessException("Bạn không có quyền quản lý yêu cầu gia nhập của doanh nghiệp này.");

            if (request.Status != (int)CompanyRequestStatus.Pending)
                throw new ArgumentException("Yêu cầu này đã được xử lý trước đó.");

            request.Status = dto.Status;
            await _requestRepo.UpdateAsync(request);

            // Cập nhật CompanyId cho Recruiter khi yêu cầu được phê duyệt
            if (dto.Status == (int)CompanyRequestStatus.Approved)
            {
                var recruiter = await _recruiterRepo.GetRecruiterEntityByIdAsync(request.UserId);
                if (recruiter != null)
                {
                    recruiter.CompanyId = request.CompanyId;
                    await _recruiterRepo.UpdateAsync(recruiter);
                }
            }

            return dto.Status == (int)CompanyRequestStatus.Approved
                ? "Đã phê duyệt yêu cầu gia nhập doanh nghiệp."
                : "Đã từ chối yêu cầu gia nhập doanh nghiệp.";
        }
    }
}
