using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobSeekingAPI.Models
{
    public class Candidate
    {
        [Key, ForeignKey("User")]
        public int UserId { get; set; }           // PK = UserId
        
        public string FullName { get; set; } = string.Empty;
        // public string? Avatar { get; set; }
        [NotMapped] // Dòng này cực kỳ quan trọng: Nó bảo EF đừng tìm cột Avatar ở bảng Recruiter
        public string? Avatar 
        { 
            get => User?.Avatar; 
            set { if (User != null) User.Avatar = value; } 
        }

        public string? Gender { get; set; }        // Thêm Gender
        
        public DateTime? Birthday { get; set; }    // Thêm Birthday
        
        public string? Phone { get; set; }         // Thêm Phone
        
        public string? Address { get; set; }       // Thêm Address
        
        public string? CVUrl { get; set; }         // Thêm CVUrl
        
        // Navigation properties
        public User? User { get; set; }
        public ICollection<Experience> Experiences { get; set; } = new List<Experience>();
        public ICollection<Application> Applications { get; set; } = new List<Application>();
        public ICollection<CandidateTag> CandidateTags { get; set; } = new List<CandidateTag>();
    }
}