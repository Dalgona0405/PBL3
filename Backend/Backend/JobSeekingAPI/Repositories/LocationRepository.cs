using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.Models;
using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Repositories
{
    public class LocationRepository : BaseRepository<Location>, ILocationRepository
    {
        public LocationRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<LocationSummaryDTO>> GetAllLocationsSummaryAsync()
        {
            return await _context.Locations
                .AsNoTracking()
                .Select(l => new LocationSummaryDTO
                {
                    LocationId = l.LocationId,
                    LocationName = l.LocationName,
                    JobCount = l.Jobs.Count(j => j.DeletedAt == null)
                })
                .OrderBy(l => l.LocationName)
                .ToListAsync();
        }

        public async Task<LocationDetailDTO?> GetLocationDetailByIdAsync(int id)
        {
            return await _context.Locations
                .AsNoTracking()
                .Where(l => l.LocationId == id)
                .Select(l => new LocationDetailDTO
                {
                    LocationId = l.LocationId,
                    LocationName = l.LocationName,
                    JobCount = l.Jobs.Count(j => j.DeletedAt == null),
                    Jobs = l.Jobs.Where(j => j.DeletedAt == null)
                                 .OrderByDescending(j => j.PostedDate)
                                 .Select(j => new JobSummaryDTO
                                 {
                                     JobId = j.JobId,
                                     Title = j.Title,
                                     SalaryMin = j.SalaryMin,
                                     SalaryMax = j.SalaryMax,
                                     CompanyName = j.Company != null ? j.Company.CompanyName : "Unknown",
                                     LogoImg = j.Company != null ? j.Company.LogoImg : null
                                 }).ToList()
                })
                .FirstOrDefaultAsync();
        }

        public async Task<Location?> GetLocationEntityByIdAsync(int id)
        {
            return await _context.Locations.FindAsync(id);
        }
    }
}