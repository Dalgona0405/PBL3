using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Services
{
    public interface IApplicationService
    {
        Task<Application> ApplyForJobAsync(CreateApplicationDTO dto);
    }
}