using System.ComponentModel.DataAnnotations;

namespace JobSeekingAPI.DTOs
{
    // Đăng ký User mới
    public class CreateUserDTO
    {
        [Required(ErrorMessage = "Please enter Email")]
        [EmailAddress(ErrorMessage = "Invalid Email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Please enter Password")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Please enter FullName")]
        [MaxLength(100, ErrorMessage = "FullName too long")]
        public string FullName { get; set; } = string.Empty;
        [Required(ErrorMessage = "Please enter Role")]
        [RegularExpression("^(Candidate|Recruiter|Company)$", ErrorMessage = "Role just can be Candidate, Recruiter or Company")]
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
        [Required(ErrorMessage = "Please enter Current Password")]
        public string CurrentPassword { get; set; } = string.Empty;
        [Required(ErrorMessage = "Please enter New Password")]
        [MinLength(6, ErrorMessage = "New Password must be at least 6 characters long")]
        public string NewPassword { get; set; } = string.Empty;
        [Required(ErrorMessage = "Please enter Confirm Password")]
        [Compare("NewPassword", ErrorMessage = "Confirm Password does not match New Password")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class LoginDTO
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}