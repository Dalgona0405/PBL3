namespace JobSeekingAPI.Models
{
    public class CandidateTag
    {
        public int UserId { get; set; }  // PK, FK to Candidate.UserId
        public int TagId { get; set; }   // PK, FK to Tag.TagId
        
        public string? Proficiency { get; set; }  // Beginner, Intermediate, Expert
        
        // Navigation properties
        public Candidate? Candidate { get; set; }
        public Tag? Tag { get; set; }
    }
}