using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Services
{
    public interface ICompanyRequestService
    {
        Task CreateRequestAsync(int userId, CreateCompanyRequestDTO dto);
        Task<IEnumerable<CompanyRequestSummaryDTO>> GetPendingRequestsAsync(int companyOwnerId);
        Task<string> UpdateRequestStatusAsync(int id, UpdateCompanyRequestStatusDTO dto);
    }
}