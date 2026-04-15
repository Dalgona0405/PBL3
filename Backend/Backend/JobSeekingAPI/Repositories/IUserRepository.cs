using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface IUserRepository : IBaseRepository<User>
    {
        // AUTH
        Task<User?> GetByEmailAsync(string email);
        Task<bool> IsEmailExistsAsync(string email);

        // CRUD
        Task<IEnumerable<User>> GetAllUsersWithDetailsAsync();
        Task<User?> GetUserDetailByIdAsync(int id);
        Task SoftDeleteUserAsync(int id);

        // ===== PROFILE (Gom chung Candidates & Recruiters vào đây) =====
        Task<Candidate?> GetCandidateProfileAsync(int userId);
        Task<Recruiter?> GetRecruiterProfileAsync(int userId);
    }
}