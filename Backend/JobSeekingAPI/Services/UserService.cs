using JobSeekingAPI.DTOs;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    /// <summary>
    /// Xử lý nghiệp vụ quản lý tài khoản người dùng, tìm kiếm và đổi mật khẩu
    /// </summary>
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepo;

        public UserService(IUserRepository userRepo)
        {
            _userRepo = userRepo;
        }

        /// <summary>
        /// Lấy danh sách tất cả tài khoản người dùng có phân trang
        /// </summary>
        public async Task<PagedResultDTO<UserListDTO>> GetAllUsersAsync(int page, int pageSize)
        {
            return await _userRepo.GetAllUsersWithDetailsAsync(page, pageSize);
        }

        /// <summary>
        /// Lấy thông tin chi tiết một tài khoản người dùng
        /// </summary>
        public async Task<UserDetailDTO> GetUserByIdAsync(int id)
        {
            var user = await _userRepo.GetUserDetailByIdAsync(id)
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            return user.ToDetailDto();
        }

        /// <summary>
        /// Cập nhật thông tin tài khoản người dùng sau khi xác minh quyền sở hữu
        /// </summary>
        public async Task UpdateUserAsync(int targetUserId, int currentUserId, UpdateUserDTO dto)
        {
            if (targetUserId != currentUserId)
                throw new ForbiddenAccessException("Bạn không có quyền thao tác trên tài khoản của người khác.");

            var existingUser = await _userRepo.GetUserDetailByIdAsync(targetUserId)
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            if (!string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                existingUser.Password = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            }

            existingUser.FullName = dto.FullName ?? existingUser.FullName;
            existingUser.Avatar = dto.Avatar ?? existingUser.Avatar;

            await _userRepo.UpdateAsync(existingUser);
        }

        /// <summary>
        /// Xóa mềm một tài khoản người dùng
        /// </summary>
        public async Task DeleteUserAsync(int id)
        {
            var user = await _userRepo.GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            await _userRepo.SoftDeleteUserAsync(user.UserId);
        }

        /// <summary>
        /// Tìm kiếm và lọc người dùng theo từ khóa và vai trò
        /// </summary>
        public async Task<PagedResultDTO<UserListDTO>> SearchUsersAsync(string? keyword, string? role, int page, int pageSize)
        {
            return await _userRepo.SearchUsersAsync(keyword, role, page, pageSize);
        }

        /// <summary>
        /// Xác thực mật khẩu hiện tại và cập nhật mật khẩu mới cho tài khoản
        /// </summary>
        public async Task ChangePasswordAsync(int targetUserId, int currentUserId, ChangePasswordDTO dto)
        {
            if (targetUserId != currentUserId)
                throw new ForbiddenAccessException("Bạn không có quyền thao tác trên tài khoản của người khác.");

            var user = await _userRepo.GetByIdAsync(targetUserId)
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.Password))
                throw new ArgumentException("Mật khẩu hiện tại không chính xác.");

            user.Password = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _userRepo.UpdateAsync(user);
        }
    }
}
