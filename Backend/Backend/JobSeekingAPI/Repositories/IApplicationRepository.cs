using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface IApplicationRepository : IBaseRepository<Application>
    {
        // CRUD ĐẶC THÙ
        //Task<IEnumerable<Application>> GetAllApplicationsWithDetailsAsync();
        Task<Application?> GetApplicationDetailByIdAsync(int id);
        Task<Application?> GetApplicationEntityByIdAsync(int id);
        Task<Application> CreateApplicationDetailAsync(Application application);
        Task SoftDeleteApplicationAsync(int id);

        // LỌC THEO QUAN HỆ
        Task<IEnumerable<Application>> GetByJobIdAsync(int jobId);
        Task<IEnumerable<Application>> GetByUserIdAsync(int userId);

        // KIỂM TRA & THỐNG KÊ
        Task<bool> IsAppliedAsync(int userId, int jobId);
        Task<int> GetApplicationCountByJobIdAsync(int jobId);
        Task<Dictionary<int, int>> GetApplicationStatusStatisticsAsync(int jobId);
    }
}