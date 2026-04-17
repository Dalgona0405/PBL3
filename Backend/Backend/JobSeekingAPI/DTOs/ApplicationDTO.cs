using System;

namespace JobSeekingAPI.DTOs
{
    public class ApplicationResponseDTO
    {
        public int ApplicationId { get; set; }
        public int UserId { get; set; }
        public int JobId { get; set; }
        public DateTime AppliedDate { get; set; }
        public int Status { get; set; }
        public string? CVUrl { get; set; }
        public DateTime? DeletedAt { get; set; }

        public CandidateSummaryDTO? Candidate { get; set; }
        public JobSummaryDTO? Job { get; set; }
    }

    public class CreateApplicationDTO
    {
        public int UserId { get; set; }
        public int JobId { get; set; }
        public string? CVUrl { get; set; }
    }

    public class UpdateApplicationDTO
    {
        public int? Status { get; set; }
        public string? CVUrl { get; set; }
    }
}