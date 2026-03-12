using System;
using System.Collections.Generic;
namespace JobSeekingAPI.DTOs
{
    public class CreateTagDTO
    {
        public string TagName { get; set; } = string.Empty;
        public string? Type { get; set; }
    }

    public class UpdateTagDTO
    {
        public string? TagName { get; set; }
        public string? Type { get; set; }
    }

    public class TagSummaryDTO
    {
        public int TagId { get; set; }
        public string TagName { get; set; } = string.Empty;
        public string? Type { get; set; }
        public int JobCount { get; set; }
        public int CandidateCount { get; set; }
        public int TotalUsage { get; set; }
    }

    public class TagDetailDTO : TagSummaryDTO
    {
        public List<JobSummaryDTO> Jobs { get; set; } = new();
        public List<CandidateSummaryDTO> Candidates { get; set; } = new();
    }

    public class JobTagDTO
    {
        public int JobId { get; set; }
        public int TagId { get; set; }
    }

    public class BulkJobTagDTO
    {
        public int JobId { get; set; }
        public List<int> TagIds { get; set; } = new();
    }

    public class CandidateTagDTO
    {
        public int UserId { get; set; }
        public int TagId { get; set; }
        public string? Proficiency { get; set; }
    }

    public class UpdateCandidateTagDTO
    {
        public string? Proficiency { get; set; }
    }

    public class BulkCandidateTagDTO
    {
        public int UserId { get; set; }
        public List<CandidateTagItemDTO> Tags { get; set; } = new();
    }

    public class CandidateTagItemDTO
    {
        public int TagId { get; set; }
        public string? Proficiency { get; set; }
    }
}