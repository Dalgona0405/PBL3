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
        public string? Size { get; set; }

        public string? TaxCode { get; set; }
        public bool IsVerified { get; set; } = false;
        public DateTime? VerifiedAt { get; set; }
        public int? MasterUserId { get; set; }

        public DateTime? DeletedAt { get; set; }

        // Navigation properties
        public User? MasterUser { get; set; }
        public ICollection<Job> Jobs { get; set; } = new List<Job>();
        public ICollection<Recruiter> Recruiters { get; set; } = new List<Recruiter>();
    }
}