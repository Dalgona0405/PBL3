using System;
using System.Collections.Generic;
namespace JobSeekingAPI.DTOs
{
    public class CreateLocationDTO
    {
        public string LocationName { get; set; } = string.Empty;
    }

    public class UpdateLocationDTO
    {
        public string? LocationName { get; set; }
    }

    public class LocationSummaryDTO
    {
        public int LocationId { get; set; }
        public string LocationName { get; set; } = string.Empty;
        public int JobCount { get; set; }
    }

    public class LocationDetailDTO : LocationSummaryDTO
    {
        public List<JobSummaryDTO> Jobs { get; set; } = new();
    }
}