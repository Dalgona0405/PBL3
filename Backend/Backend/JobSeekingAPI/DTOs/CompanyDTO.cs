using System;
using System.Collections.Generic;
namespace JobSeekingAPI.DTOs
{   
    public class CreateCompanyDTO
    {
        public string CompanyName { get; set; } = string.Empty;
        public string? LogoImg { get; set; }
        public string? Website { get; set; }
        public string? Size { get; set; }
    }

    public class UpdateCompanyDTO
    {
        public string? CompanyName { get; set; }
        public string? LogoImg { get; set; }
        public string? Website { get; set; }
        public string? Size { get; set; }
    }

    public class CompanySummaryDTO
    {
        public int CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? LogoImg { get; set; }
        public string? Website { get; set; }
        public string? Size { get; set; }
        public int JobCount { get; set; }
        public List<JobSummaryDTO> Job1 { get; set; } = new();
        public List<JobResponseDTO> Job2 { get; set; } = new();
    }

    public class CompanyDetailDTO : CompanySummaryDTO
    {
        public List<JobSummaryDTO> Jobs { get; set; } = new();
        public List<RecruiterSummaryDTO> Recruiters { get; set; } = new();
        public List<CandidateSummaryDTO> Candidates { get; set; } = new();
    }
}