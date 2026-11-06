using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface ICompanyJoinRequestRepository : IBaseRepository<CompanyJoinRequest>
    {
        Task<IEnumerable<CompanyJoinRequest>> GetPendingRequestsAsync();
        Task<IEnumerable<CompanyJoinRequest>> GetPendingRequestsByCompanyAsync(int companyId);

        Task<bool> HasPendingRequestAsync(int recruiterId);
    }
}