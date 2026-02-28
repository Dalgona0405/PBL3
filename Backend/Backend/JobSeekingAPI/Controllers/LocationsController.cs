using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LocationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LocationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/locations
        [HttpGet]
        public async Task<IActionResult> GetAllLocations()
        {
            var locations = await _context.Locations
                .Select(l => new LocationSummaryDTO
                {
                    LocationId = l.LocationId,
                    LocationName = l.LocationName,
                    JobCount = l.Jobs.Count(j => j.DeletedAt == null)
                })
                .OrderBy(l => l.LocationName)
                .ToListAsync();
            
            return Ok(locations);
        }

        // GET: api/locations/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetLocationById(int id)
        {
            var location = await _context.Locations
                .Include(l => l.Jobs.Where(j => j.DeletedAt == null))
                    .ThenInclude(j => j.Company)
                .Where(l => l.LocationId == id)
                .Select(l => new LocationDetailDTO
                {
                    LocationId = l.LocationId,
                    LocationName = l.LocationName,
                    JobCount = l.Jobs.Count,
                    Jobs = l.Jobs
                        .OrderByDescending(j => j.PostedDate)
                        .Take(20)
                        .Select(j => new JobSummaryDTO
                        {
                            JobId = j.JobId,
                            Title = j.Title,
                            SalaryMin = j.SalaryMin,
                            SalaryMax = j.SalaryMax,
                            ExpYear = j.ExpYear,
                            Level = j.Level,
                            CompanyName = j.Company != null ? j.Company.CompanyName : "",
                            PostedDate = j.PostedDate,
                            Deadline = j.Deadline
                        }).ToList()
                })
                .FirstOrDefaultAsync();

            if (location == null)
                return NotFound("Location not found");

            return Ok(location);
        }

        // POST: api/locations
        [HttpPost]
        public async Task<IActionResult> CreateLocation([FromBody] CreateLocationDTO createLocationDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Kiểm tra tên địa điểm đã tồn tại
            var existingLocation = await _context.Locations
                .AnyAsync(l => l.LocationName.ToLower() == createLocationDto.LocationName.ToLower());
            
            if (existingLocation)
                return BadRequest("Location already exists");

            var location = new Location
            {
                LocationName = createLocationDto.LocationName
            };

            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            var locationDto = new LocationSummaryDTO
            {
                LocationId = location.LocationId,
                LocationName = location.LocationName
            };

            return CreatedAtAction(nameof(GetLocationById), new { id = location.LocationId }, locationDto);
        }

        // PUT: api/locations/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLocation(int id, [FromBody] UpdateLocationDTO updateLocationDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingLocation = await _context.Locations.FindAsync(id);
            if (existingLocation == null)
                return NotFound("Location not found");

            // Kiểm tra tên mới không trùng
            if (!string.IsNullOrWhiteSpace(updateLocationDto.LocationName))
            {
                var duplicateLocation = await _context.Locations
                    .AnyAsync(l => l.LocationName.ToLower() == updateLocationDto.LocationName.ToLower() 
                        && l.LocationId != id);
                
                if (duplicateLocation)
                    return BadRequest("Location name already exists");

                existingLocation.LocationName = updateLocationDto.LocationName;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/locations/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLocation(int id)
        {
            var location = await _context.Locations
                .Include(l => l.Jobs)
                .FirstOrDefaultAsync(l => l.LocationId == id);
            
            if (location == null)
                return NotFound("Location not found");

            // Kiểm tra có job đang sử dụng không
            var hasJobs = location.Jobs.Any(j => j.DeletedAt == null);
            if (hasJobs)
                return BadRequest("Cannot delete location that is being used by active jobs");

            _context.Locations.Remove(location);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/locations/search
        [HttpGet("search")]
        public async Task<IActionResult> SearchLocations([FromQuery] string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest("Keyword is required");

            keyword = keyword.ToLower();
            var locations = await _context.Locations
                .Where(l => l.LocationName.ToLower().Contains(keyword))
                .Select(l => new LocationSummaryDTO
                {
                    LocationId = l.LocationId,
                    LocationName = l.LocationName,
                    JobCount = l.Jobs.Count(j => j.DeletedAt == null)
                })
                .OrderBy(l => l.LocationName)
                .ToListAsync();

            return Ok(locations);
        }

        // GET: api/locations/popular
        [HttpGet("popular")]
        public async Task<IActionResult> GetPopularLocations([FromQuery] int limit = 10)
        {
            var popularLocations = await _context.Locations
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

            return Ok(popularLocations);
        }

        // GET: api/locations/{id}/jobs
        [HttpGet("{id}/jobs")]
        public async Task<IActionResult> GetJobsByLocation(int id, 
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 20)
        {
            var location = await _context.Locations.FindAsync(id);
            if (location == null)
                return NotFound("Location not found");

            var query = _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.JobTags).ThenInclude(jt => jt.Tag)
                .Where(j => j.LocationId == id && j.DeletedAt == null);

            var totalCount = await query.CountAsync();
            var jobs = await query
                .OrderByDescending(j => j.PostedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(j => new JobResponseDTO
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

            var result = new
            {
                LocationId = id,
                LocationName = location.LocationName,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Data = jobs
            };

            return Ok(result);
        }

        private bool LocationExists(int id)
        {
            return _context.Locations.Any(e => e.LocationId == id);
        }
    }
}