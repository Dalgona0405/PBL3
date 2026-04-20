using System;
using System.Collections.Generic;

namespace JobSeekingAPI.DTOs
{
    // Khởi tạo Candidate (Không chứa FullName/Avatar vì nó nằm ở Users)
    public class CreateCandidateDTO
    {
        public int UserId { get; set; }
        public string? Gender { get; set; }
        public DateTime? Birthday { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? CVUrl { get; set; }
    }

    // Sửa thông tin trang Profile
    public class UpdateCandidateDTO
    {
        public string? FullName { get; set; } // Map -> Users
        public string? Avatar { get; set; }   // Map -> Users
        public string? Gender { get; set; }   // Map -> Candidates
        public DateTime? Birthday { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? CVUrl { get; set; }
        public List<CandidateTagDTO>? Tags { get; set; }
    }

    // Xem hồ sơ chi tiết của Ứng viên (Dành cho NTD)
    public class CandidateDetailDTO
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string? Email { get; set; }
        public string? Gender { get; set; }
        public DateTime? Birthday { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? CVUrl { get; set; }
        public List<string> Skills { get; set; } = new();
        public List<ExperienceDTO> Experiences { get; set; } = new();
    }

    // Hiển thị dạng danh sách (Card Ứng viên)
    public class CandidateSummaryDTO
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string? Email { get; set; }
        public string? CVUrl { get; set; }
        public List<string> Skills { get; set; } = new();
        public string? Proficiency { get; set; }
        public string? ExperienceYears { get; set; }
    }

    public class AddSkillDTO
    {
        public int TagId { get; set; }
        public string? Proficiency { get; set; }
    }
}