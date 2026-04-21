using Microsoft.AspNetCore.Mvc;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LocationsController : ControllerBase
    {
        private readonly ILocationRepository _locationRepository;

        public LocationsController(ILocationRepository locationRepository)
        {
            _locationRepository = locationRepository;
        }

        // GET: api/locations
        [HttpGet]
        public async Task<IActionResult> GetAllLocations()
        {
            var locations = await _locationRepository.GetAllLocationsSummaryAsync();

            return Ok(locations);
        }

        // GET: api/locations/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetLocationById(int id)
        {
            var location = await _locationRepository.GetLocationDetailByIdAsync(id);
            if (location == null)
                return NotFound(new { message = "Location not found" });
            return Ok(location);
        }

        // POST: api/locations
        [HttpPost]
        public async Task<IActionResult> CreateLocation([FromBody] CreateLocationDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            //var existingLocation = await _locationRepository.

            //if (existingLocation)
            //    return BadRequest("Location already exists");

            var location = new Location
            {
                LocationName = dto.LocationName
            };

            var createdLocation = await _locationRepository.CreateAsync(location);

            return CreatedAtAction(nameof(GetLocationById), new { id = createdLocation.LocationId }, new LocationSummaryDTO
            {
                LocationId = createdLocation.LocationId,
                LocationName = createdLocation.LocationName,
                JobCount = 0
            });
        }

        // PUT: api/locations/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLocation(int id, [FromBody] UpdateLocationDTO dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var location = await _locationRepository.GetLocationEntityByIdAsync(id);
            if (location == null)
                return NotFound(new { message = "Location not found!" });

            location.LocationName = dto.LocationName ?? location.LocationName;

            await _locationRepository.UpdateAsync(location);

            return Ok(new { message = "Location updated successfully!" });
        }

        // DELETE: api/locations/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLocation(int id)
        {
            var location = await _locationRepository.GetLocationEntityByIdAsync(id);
            if (location == null)
                return NotFound(new { message = "Location not found!" });

            // Check xem Location này có đang chứa Job nào không (Dùng hàm GetAll để đếm tạm, 
            // hoặc lý tưởng nhất là viết thêm hàm đếm trong Repo)
            var detail = await _locationRepository.GetLocationDetailByIdAsync(id);
            if (detail != null && detail.JobCount > 0)
            {
                return BadRequest(new { message = "Cannot delete location with active jobs!" });
            }

            // Xóa cứng vì Location thường không xài Soft Delete
            await _locationRepository.DeleteAsync(id);

            return Ok(new { message = "Location deleted successfully!" });
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
    }
}