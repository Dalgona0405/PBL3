using JobSeekingAPI.Models;
using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Repositories
{
    public interface IUserRepository : IBaseRepository<User>
    {
        // AUTH
        Task<User?> GetByEmailAsync(string email);
        Task<bool> IsEmailExistsAsync(string email);

        // Hàm Register
        Task<User> RegisterUserAsync(CreateUserDTO userDto);

        // CRUD
        Task<PagedResultDTO<UserListDTO>> GetAllUsersWithDetailsAsync(int page, int pageSize);
        Task<User?> GetUserDetailByIdAsync(int id);
        Task SoftDeleteUserAsync(int id);

        // PROFILE
        Task<Candidate?> GetCandidateProfileAsync(int userId);
        Task<Recruiter?> GetRecruiterProfileAsync(int userId);
    }
}