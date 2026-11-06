using System.ComponentModel.DataAnnotations;

namespace JobSeekingAPI.Models
{
    public class Experience
    {
        [Key]
        public int ExpId { get; set; }
        
        public int UserId { get; set; }  // FK to Candidate.UserId
        
        public string? CompanyName { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        
        public string? Description { get; set; }
        
        // Navigation properties
        public Candidate? Candidate { get; set; }
    }
}