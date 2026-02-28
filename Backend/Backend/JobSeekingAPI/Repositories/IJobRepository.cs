using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface IJobRepository
    {
        // ===== CRUD CƠ BẢN =====
        Task<IEnumerable<Job>> GetAllAsync();
        Task<Job?> GetByIdAsync(int id);
        Task<Job> CreateAsync(Job job);
        Task UpdateAsync(Job job);
        Task DeleteAsync(int id);
        
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