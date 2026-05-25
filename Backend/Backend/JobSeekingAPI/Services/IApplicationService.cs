using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Services
{
    public interface IApplicationService
    {
        Task<ApplicationDetailDTO> GetApplicationByIdAsync(int id);
        Task<IEnumerable<ApplicationDetailDTO>> GetApplicationsByJobAsync(int jobId, int userId, string role);
        Task<IEnumerable<ApplicationDetailDTO>> GetMyApplicationsAsync(int userId);
        Task<IEnumerable<ApplicationDetailDTO>> GetApplicationsByUserAsync(int userId);
        Task<ApplicationDetailDTO> ApplyForJobAsync(CreateApplicationDTO dto);
        Task UpdateApplicationAsync(int id, UpdateApplicationDTO dto, int userId);
        Task UpdateApplicationStatusAsync(int id, UpdateApplicationStatusDTO dto, int userId, string role);
        Task WithdrawApplicationAsync(int id, int userId);
        Task<object> GetApplicationStatisticsAsync(int jobId, int userId, string role);
    }
}