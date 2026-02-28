using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;  
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Models
{
    public class Job
    {
        [Key]
        public int JobId { get; set; }
        
        public int CompanyId { get; set; }
        public string? OriginalId { get; set; }
        public string Title { get; set; } = string.Empty;
        
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string? ExpYear { get; set; }
        public string? Level { get; set; }
        
        public DateTime PostedDate { get; set; }
        public DateTime? Deadline { get; set; }
        
        public int LocationId { get; set; }
        
        public string? Description { get; set; }
        public string? Requirement { get; set; }
        public string? Benefits { get; set; }
        public string? Address { get; set; }
        
        public DateTime? DeletedAt { get; set; }
        public int? ViewCount { get; set; } = 0;
        public int Status { get; set; } = 1;      // ✅ Thêm Status
        
        // Navigation properties - CHỈ KHAI BÁO 1 LẦN
        public Company? Company { get; set; }
        public Location? Location { get; set; }
        public ICollection<JobTag> JobTags { get; set; } = new List<JobTag>();
        public ICollection<Application> Applications { get; set; } = new List<Application>();
    }
}