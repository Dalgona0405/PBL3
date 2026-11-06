namespace JobSeekingAPI.Models
{
    public class SavedJob
    {
        public int UserId { get; set; }  // Ai lưu? (Trỏ về Candidate)
        public int JobId { get; set; }   // Lưu công việc nào? (Trỏ về Job)

        public DateTime SavedAt { get; set; } = DateTime.UtcNow; // Lưu lúc mấy giờ?

        // Navigation properties
        public Candidate? Candidate { get; set; }
        public Job? Job { get; set; }
    }
}