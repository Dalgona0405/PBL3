using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace JobSeekingAPI.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        public string Password { get; set; } = string.Empty;  // Đổi từ PasswordHash thành Password
        
        public string Role { get; set; } = string.Empty;      // Candidate, Recruiter, Admin
        
        
        public DateTime? DeletedAt { get; set; }              // Soft delete
        
        public DateTime? LastLogin { get; set; }              // Thêm LastLogin
        
        // Navigation properties
        public Candidate? Candidate { get; set; }
        public Recruiter? Recruiter { get; set; }
    }
}