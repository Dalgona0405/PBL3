using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Services
{
    public interface IAuthService
    {
        Task<object> RegisterAsync(CreateUserDTO userDto);
        Task<object> LoginAsync(LoginDTO loginDto);
    }
}