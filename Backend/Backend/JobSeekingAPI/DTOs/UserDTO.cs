using System;
using System.Collections.Generic;
namespace JobSeekingAPI.DTOs
{
// Create User
    public class CreateUserDTO
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string Role { get; set; } = "Candidate";
        public string? Avatar { get; set; }
    }

// Update User
    public class UpdateUserDTO
    {
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? Avatar { get; set; }          // ✅ THÊM: Cho phép update Avatar
        public string? NewPassword { get; set; }
    }

// Detail user
    public class UserDetailDTO
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string Role { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public DateTime? LastLogin { get; set; }
        public DateTime? DeletedAt { get; set; }
        
        public CandidateDetailDTO? Candidate { get; set; }
        public RecruiterDetailDTO? Recruiter { get; set; }  // ✅ Giữ lại, dùng từ RecruiterDTOs.cs
        
        // ✅ THÊM Applications ở đây (trong UserDetailDTO, không phải CandidateDetailDTO)
    public List<ApplicationResponseDTO>? Applications { get; set; }
    }

// List user (dùng cho admin)
    public class UserListDTO
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Avatar { get; set; }          // ✅ Avatar ở User, không phải Candidate
        public string? CompanyName { get; set; }     // ✅ Chỉ Recruiter mới có
        public bool? IsVerified { get; set; }        // ✅ Chỉ Recruiter mới có
        public DateTime? LastLogin { get; set; }     // ✅ THÊM: Theo ER của User
    }

// Change password
    public class ChangePasswordDTO
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    // Login
    public class LoginDTO
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}

