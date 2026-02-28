namespace JobSeekingAPI.DTOs
{
    public class CreateCandidateDTO
    {
        public int UserId { get; set; }
        public string? FullName { get; set; }
        public string? Gender { get; set; }
        public DateTime? Birthday { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? CVUrl { get; set; }
        public string? Avatar { get; set; }
    }

    public class UpdateCandidateDTO
    {
        public string? FullName { get; set; }
        public string? Gender { get; set; }
        public DateTime? Birthday { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? CVUrl { get; set; }
        public string? Avatar { get; set; }
    }

    public class AddSkillDTO
    {
        public int TagId { get; set; }
        public string? Proficiency { get; set; }
    }
}