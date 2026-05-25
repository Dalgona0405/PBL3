using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Services
{
    public interface IJobService
    {
        Task<Job> CreateJobAsync(CreateJobDTO dto);
        Task UpdateJobAsync(int id, UpdateJobDTO dto, int userId, bool isRecruiter);
        Task UpdateJobStatusAsync(int id, JobUpdateStatusDTO dto, int userId, bool isRecruiter);
        Task DeleteJobAsync(int id, int userId, bool isRecruiter);
    }
}