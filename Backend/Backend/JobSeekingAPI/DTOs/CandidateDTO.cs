using System;
using System.Collections.Generic;
namespace JobSeekingAPI.DTOs
{
    public class CreateCandidateDTO
    {
        public int UserId { get; set; }
        public string? FullName { get; set; }
        public string? Gender { get; set; }
        public DateTime? Birthday { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? CVUrl { get; set; }
        public string? Avatar { get; set; }
    }

    public class UpdateCandidateDTO
    {
        public string? FullName { get; set; }
        public string? Gender { get; set; }
        public DateTime? Birthday { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? CVUrl { get; set; }
        public string? Avatar { get; set; }
        public List<CandidateTagDTO>? Tags { get; set; }
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

    public class CandidateSummaryDTO
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string? Email { get; set; }
        public string? CVUrl { get; set; }
        public List<string> Skills { get; set; } = new();
        public string? Proficiency { get; set; }
        public int ExperienceYears { get; set; }
    }
    
    public class AddSkillDTO
    {
        public int TagId { get; set; }
        public string? Proficiency { get; set; }
    }
}