using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface IApplicationRepository
    {
        // CRUD
        Task<IEnumerable<Application>> GetAllAsync();
        Task<Application?> GetByIdAsync(int id);
        Task<Application> CreateAsync(Application application);
        Task UpdateAsync(Application application);
        Task DeleteAsync(int id);
        
        // Lọc theo quan hệ
        Task<IEnumerable<Application>> GetByJobIdAsync(int jobId);
        Task<IEnumerable<Application>> GetByUserIdAsync(int userId);
        
        // Kiểm tra & thống kê
        Task<bool> IsAppliedAsync(int userId, int jobId);
        Task<int> GetApplicationCountByJobIdAsync(int jobId);
        Task<Dictionary<int, int>> GetApplicationStatusStatisticsAsync(int jobId);
    }
}