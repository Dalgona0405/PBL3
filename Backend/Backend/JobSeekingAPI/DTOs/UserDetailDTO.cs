using System;
using System.Collections.Generic;

namespace JobSeekingAPI.DTOs
{
    // 📋 DTO ĐẦY ĐỦ - DÙNG CHO CHI TIẾT
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
    
    public class CandidateDetailDTO
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Gender { get; set; }
        public DateTime? Birthday { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? CVUrl { get; set; }
        public List<string> Skills { get; set; } = new();
        public List<ExperienceDTO> Experiences { get; set; } = new();
    }
    
    // ❌ XÓA TOÀN BỘ RecruiterDetailDTO ở đây
    // Vì đã có trong RecruiterDTOs.cs rồi
}