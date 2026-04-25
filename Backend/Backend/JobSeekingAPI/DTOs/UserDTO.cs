namespace JobSeekingAPI.DTOs
{
    // Đăng ký User mới
    public class CreateUserDTO
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = "Candidate";
        public string? Avatar { get; set; }
    }

    // Đổi thông tin User
    public class UpdateUserDTO
    {
        public string? FullName { get; set; }
        public string? Avatar { get; set; }
        public string? NewPassword { get; set; }
    }

    // Chi tiết User (Bao gồm Profile con bên trong)
    public class UserDetailDTO
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public DateTime? LastLogin { get; set; }
        public DateTime? DeletedAt { get; set; }

        public CandidateDetailDTO? Candidate { get; set; }
        public RecruiterDetailDTO? Recruiter { get; set; }

        public List<ApplicationDetailDTO>? Applications { get; set; }
    }

    // Danh sách User (Dùng cho trang Quản trị Admin)
    public class UserListDTO
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string? CompanyName { get; set; }
        public DateTime? LastLogin { get; set; }
    }

    public class ChangePasswordDTO
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class LoginDTO
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}