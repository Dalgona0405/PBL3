using System.ComponentModel.DataAnnotations;

namespace JobSeekingAPI.Models
{
    public class Location
    {
        [Key]
        public int LocationId { get; set; }
        
        [Required]
        public string LocationName { get; set; } = string.Empty;
        
        // Navigation properties
        public ICollection<Job> Jobs { get; set; } = new List<Job>();
    }
}