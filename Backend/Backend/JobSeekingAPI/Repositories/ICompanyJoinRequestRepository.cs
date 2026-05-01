using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface ICompanyJoinRequestRepository : IBaseRepository<CompanyJoinRequest>
    {
        Task<IEnumerable<CompanyJoinRequest>> GetPendingRequestsAsync();
        Task<bool> HasPendingRequestAsync(int recruiterId);
    }
}