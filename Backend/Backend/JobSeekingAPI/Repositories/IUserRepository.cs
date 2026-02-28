using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface IUserRepository
    {
        // Auth
        Task<User?> GetByEmailAsync(string email);
        Task<bool> IsEmailExistsAsync(string email);
        
        // CRUD
        Task<IEnumerable<User>> GetAllAsync();
        Task<User?> GetByIdAsync(int id);
        Task<User> CreateAsync(User user);
        Task UpdateAsync(User user);
        Task DeleteAsync(int id);
        
        // Profile
        Task<Candidate?> GetCandidateProfileAsync(int userId);
        Task<Recruiter?> GetRecruiterProfileAsync(int userId);
    }
}