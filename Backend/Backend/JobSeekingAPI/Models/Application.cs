using System.ComponentModel.DataAnnotations;

namespace JobSeekingAPI.Models
{
    public class Application
    {
        [Key]
        public int AppId { get; set; }

        public int UserId { get; set; }            // FK trỏ về Candidate
        public int JobId { get; set; }             // FK trỏ về Job

        public DateTime AppliedDate { get; set; }
        public int Status { get; set; }
        public string? Message {get; set; }
        public DateTime? InterviewTime { get; set; }
        public string? InterviewLocation { get; set; }
        public string? CVUrl { get; set; }
        public DateTime? DeletedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Candidate? Candidate { get; set; }
        public Job? Job { get; set; }
    }
}