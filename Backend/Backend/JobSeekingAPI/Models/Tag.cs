using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace JobSeekingAPI.Models
{
    public class Tag
    {
        [Key]
        public int TagId { get; set; }
        
        [Required]
        public string TagName { get; set; } = string.Empty;
        
        public string? Type { get; set; }  // Skill, Benefit, Language, etc.
        
        // Navigation properties
        public ICollection<JobTag> JobTags { get; set; } = new List<JobTag>();
        public ICollection<CandidateTag> CandidateTags { get; set; } = new List<CandidateTag>();
    }
}