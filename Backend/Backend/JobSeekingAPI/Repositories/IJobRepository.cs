using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface IJobRepository : IBaseRepository<Job>
    {
        // CRUD
        Task<IEnumerable<Job>> GetAllJobsWithDetailsAsync();
        Task<Job?> GetJobDetailByIdAsync(int id);
        Task<Job> CreateJobWithDefaultsAsync(Job job);
        Task SoftDeleteJobAsync(int id);
        Task<Job?> GetJobEntityByIdAsync(int id);

        // ===== TÌM KIẾM NÂNG CAO =====
        Task<PagedResultDTO<Job>> SearchJobsAsync(JobSearchDTO searchParams);
        
        // ===== LỌC THEO QUAN HỆ =====
        Task<IEnumerable<Job>> GetJobsByCompanyAsync(int companyId);
        Task<IEnumerable<Job>> GetJobsByLocationAsync(int locationId);
        Task<IEnumerable<Job>> GetJobsByTagAsync(int tagId);
        
        // ===== THỐNG KÊ =====
        Task<int> GetTotalJobsCountAsync();
        Task<Dictionary<string, int>> GetJobsByLevelAsync();
        Task<IEnumerable<Job>> GetRecentJobsAsync(int count);
    }
}