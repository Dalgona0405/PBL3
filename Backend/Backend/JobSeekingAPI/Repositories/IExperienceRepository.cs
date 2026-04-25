using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface IExperienceRepository : IBaseRepository<Experience>
    {
        Task<IEnumerable<Experience>> GetExperiencesByCandidateIdAsync(int candidateId);
        Task<Experience?> GetExperienceByIdAsync(int experienceId);
        Task<Experience> AddExperienceAsync(Experience experience);
        Task UpdateExperienceAsync(Experience experience);
        Task DeleteExperienceAsync(int experienceId);
    }
}
