using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Services
{
    public interface IAuthService
    {
        Task<RegisterResponseDTO> RegisterAsync(CreateUserDTO userDto);
        Task<object> LoginAsync(LoginDTO loginDto);
        Task<object> GoogleLoginAsync(GoogleLoginDTO googleDto, CancellationToken cancellationToken = default);
        Task<(object Response, string RefreshToken)> LoginWithRefreshAsync(LoginDTO loginDto);
        Task<(object Response, string RefreshToken)> GoogleLoginWithRefreshAsync(GoogleLoginDTO googleDto, CancellationToken cancellationToken = default);
        Task<(object Response, string RefreshToken)> RefreshTokenAsync(string refreshToken);
    }
}