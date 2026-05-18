using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using Microsoft.EntityFrameworkCore;

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

        public async Task<IEnumerable<LocationSummaryDTO>> SearchLocationsAsync(string keyword)
        {
            keyword = keyword.ToLower();
            return await _context.Locations
                .AsNoTracking()
                .Where(l => l.LocationName.ToLower().Contains(keyword))
                .Select(l => new LocationSummaryDTO
                {
                    LocationId = l.LocationId,
                    LocationName = l.LocationName,
                    JobCount = l.Jobs.Count(j => j.DeletedAt == null)
                })
                .OrderBy(l => l.LocationName)
                .ToListAsync();
        }

        public async Task<IEnumerable<LocationSummaryDTO>> GetPopularLocationsAsync(int limit)
        {
            return await _context.Locations
                .AsNoTracking()
                .Select(l => new LocationSummaryDTO
                {
                    LocationId = l.LocationId,
                    LocationName = l.LocationName,
                    JobCount = l.Jobs.Count(j => j.DeletedAt == null)
                })
                .Where(l => l.JobCount > 0)
                .OrderByDescending(l => l.JobCount)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<PagedResultDTO<JobDetailDTO>> GetJobsByLocationAsync(int locationId, int page, int pageSize)
        {
            var query = _context.Jobs
                .AsNoTracking()
                .Include(j => j.Company)
                .Include(j => j.JobTags).ThenInclude(jt => jt.Tag)
                .Where(j => j.LocationId == locationId && j.DeletedAt == null);

            var totalCount = await query.CountAsync();
            var jobs = await query
                .OrderByDescending(j => j.PostedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(j => new JobDetailDTO
                {
                    JobId = j.JobId,
                    Title = j.Title,
                    SalaryMin = j.SalaryMin,
                    SalaryMax = j.SalaryMax,
                    ExpYear = j.ExpYear,
                    Level = j.Level,
                    PostedDate = j.PostedDate,
                    Deadline = j.Deadline,
                    Description = j.Description,
                    Requirement = j.Requirement,
                    Benefits = j.Benefits,
                    Address = j.Address,
                    ViewCount = j.ViewCount ?? 0,
                    Company = j.Company == null ? null : new CompanySummaryDTO
                    {
                        CompanyId = j.Company.CompanyId,
                        CompanyName = j.Company.CompanyName,
                        LogoImg = j.Company.LogoImg
                    },
                    Tags = j.JobTags == null ? new List<TagSummaryDTO>() : j.JobTags
                        .Where(jt => jt.Tag != null)
                        .Select(jt => new TagSummaryDTO
                        {
                            TagId = jt.Tag!.TagId,
                            TagName = jt.Tag.TagName
                        }).ToList()
                })
                .ToListAsync();

            return new PagedResultDTO<JobDetailDTO>
            {
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Items = jobs
            };
        }
    }
}