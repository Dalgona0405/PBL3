using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface IApplicationRepository : IBaseRepository<Application>
    {
        // CRUD
        Task<IEnumerable<Application>> GetAllApplicationsWithDetailsAsync();
        Task<Application?> GetApplicationDetailByIdAsync(int id);
        Task<Application> CreateApplicationDetailAsync(Application application);
        Task SoftDeleteApplicationAsync(int id);
        
        // Lọc theo quan hệ
        Task<IEnumerable<Application>> GetByJobIdAsync(int jobId);
        Task<IEnumerable<Application>> GetByUserIdAsync(int userId);
        
        // Kiểm tra & thống kê
        Task<bool> IsAppliedAsync(int userId, int jobId);
        Task<int> GetApplicationCountByJobIdAsync(int jobId);
        Task<Dictionary<int, int>> GetApplicationStatusStatisticsAsync(int jobId);
    }
}