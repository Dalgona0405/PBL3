using JobSeekingAPI.DTOs;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepo;
        private readonly JwtService _jwtService;

        public AuthService(IUserRepository userRepo, JwtService jwtService)
        {
            _userRepo = userRepo;
            _jwtService = jwtService;
        }

        public async Task<object> RegisterAsync(CreateUserDTO userDto)
        {
            var emailExists = await _userRepo.IsEmailExistsAsync(userDto.Email);
            if (emailExists)
                throw new ArgumentException("Email already exists.");

            var newUser = await _userRepo.RegisterUserAsync(userDto);

            return new
            {
                newUser.UserId,
                newUser.Email,
                newUser.FullName,
                newUser.Role
            };
        }

        public async Task<object> LoginAsync(LoginDTO loginDto)
        {
            var user = await _userRepo.GetByEmailAsync(loginDto.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.Password))
            {
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            user.LastLogin = DateTime.UtcNow;
            await _userRepo.UpdateAsync(user);

            var token = _jwtService.GenerateToken(user);

            return new
            {
                message = "Login successful",
                token,
                user = new
                {
                    id = user.UserId,
                    email = user.Email,
                    role = user.Role,
                    name = user.FullName,
                    avatar = user.Avatar
                }
            };
        }
    }
}