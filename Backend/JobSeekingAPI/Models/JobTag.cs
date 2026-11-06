namespace JobSeekingAPI.Models
{
    public class JobTag
    {
        public int JobId { get; set; }  // PK, FK
        public int TagId { get; set; }  // PK, FK
        
        // Navigation properties
        public Job? Job { get; set; }
        public Tag? Tag { get; set; }
    }
}