using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Services
{
    public interface IUserService
    {
        Task<PagedResultDTO<UserListDTO>> GetAllUsersAsync(int page, int pageSize);
        Task<UserDetailDTO> GetUserByIdAsync(int id);
        Task UpdateUserAsync(int targetUserId, int currentUserId, UpdateUserDTO dto);
        Task DeleteUserAsync(int id);
        Task<PagedResultDTO<UserListDTO>> SearchUsersAsync(string? keyword, string? role, int page, int pageSize);
        Task ChangePasswordAsync(int targetUserId, int currentUserId, ChangePasswordDTO dto);
    }
}
