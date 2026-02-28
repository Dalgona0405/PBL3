namespace JobSeekingAPI.DTOs
{
    public class ExperienceDTO
    {
        public int ExpId { get; set; }
        public int UserId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Description { get; set; }
        public string? CandidateName { get; set; }
        public string? CandidateEmail { get; set; }
        public string? Duration { get; set; }
    }

    public class CreateExperienceDTO
    {
        public int UserId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Description { get; set; }
    }

    public class UpdateExperienceDTO
    {
        public string? JobTitle { get; set; }
        public string? CompanyName { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Description { get; set; }
    }
}