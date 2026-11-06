using System.ComponentModel.DataAnnotations;

namespace JobSeekingAPI.Models
{
    public class Company
    {
        [Key]
        public int CompanyId { get; set; }
        
        [Required]
        public string CompanyName { get; set; } = string.Empty;
        
        public string? LogoImg { get; set; }
        
        public string? Website { get; set; }
        
        public string? Size { get; set; }         // Quy mô: 1-50, 50-200, 200-1000, 1000+
        
        public DateTime? DeletedAt { get; set; }  // Soft delete
        
        // Navigation properties
        public ICollection<Job> Jobs { get; set; } = new List<Job>();
        public ICollection<Recruiter> Recruiters { get; set; } = new List<Recruiter>();
    }
}