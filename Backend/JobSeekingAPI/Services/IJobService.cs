using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Services
{
    public interface IJobService
    {
        Task<JobDetailDTO> GetJobByIdAsync(int id);
        Task<PagedResultDTO<JobDetailDTO>> SearchJobsAsync(JobSearchDTO searchParams);
        Task<IEnumerable<JobDetailDTO>> GetRecentJobsAsync(int count);
        Task<IEnumerable<JobDetailDTO>> GetJobsByCompanyAsync(int companyId);
        Task<IEnumerable<JobDetailDTO>> GetMyJobsAsync(int currentUserId);
        Task<JobDetailDTO> CreateJobAsync(CreateJobDTO dto, int userId, bool isAdmin);
        Task UpdateJobAsync(int id, UpdateJobDTO dto, int userId, bool isRecruiter);
        Task UpdateJobStatusAsync(int id, JobUpdateStatusDTO dto, int userId, bool isRecruiter);
        Task DeleteJobAsync(int id, int userId, bool isRecruiter);
        Task SaveJobAsync(int userId, int jobId);
        Task UnsaveJobAsync(int userId, int jobId);
        Task<IEnumerable<JobSummaryDTO>> GetSavedJobsAsync(int userId);
        bool ToggleScrapedJobsVisibility(bool show);
        bool GetScrapedJobsVisibility();
    }
}
