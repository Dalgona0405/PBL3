using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAllLocations()
        {
            var locations = await _locationRepository.GetAllLocationsSummaryAsync();
            return Ok(locations);
        }

        // GET: api/locations/{id}
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetLocationById(int id)
        {
            var location = await _locationRepository.GetLocationDetailByIdAsync(id);
            if (location == null)
                return NotFound(new { message = "Location not found" });
            return Ok(location);
        }

        // POST: api/locations
        [Authorize(Roles = UserRoles.Admin)]
        [HttpPost]
        public async Task<IActionResult> CreateLocation([FromBody] CreateLocationDTO dto)
        {
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

        // PATCH: api/locations/{id}
        [Authorize(Roles = UserRoles.Admin)]
        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateLocation(int id, [FromBody] UpdateLocationDTO dto)
        {
            var location = await _locationRepository.GetLocationEntityByIdAsync(id);
            if (location == null)
                return NotFound(new { message = "Location not found!" });

            location.LocationName = dto.LocationName ?? location.LocationName;

            await _locationRepository.UpdateAsync(location);

            return Ok(new { message = "Location updated successfully!" });
        }

        // DELETE: api/locations/{id}
        [Authorize(Roles = UserRoles.Admin)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLocation(int id)
        {
            var location = await _locationRepository.GetLocationEntityByIdAsync(id);
            if (location == null)
                return NotFound(new { message = "Location not found!" });

            var detail = await _locationRepository.GetLocationDetailByIdAsync(id);
            if (detail != null && detail.JobCount > 0)
            {
                return BadRequest(new { message = "Cannot delete location with active jobs!" });
            }

            await _locationRepository.DeleteAsync(id);

            return Ok(new { message = "Location deleted successfully!" });
        }

        // GET: api/locations/search
        [AllowAnonymous]
        [HttpGet("search")]
        public async Task<IActionResult> SearchLocations([FromQuery] string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest(new { message = "Keyword is required" });

            var locations = await _locationRepository.SearchLocationsAsync(keyword);
            return Ok(locations);
        }

        // GET: api/locations/popular
        [AllowAnonymous]
        [HttpGet("popular")]
        public async Task<IActionResult> GetPopularLocations([FromQuery] int limit = 10)
        {
            var popularLocations = await _locationRepository.GetPopularLocationsAsync(limit);
            return Ok(popularLocations);
        }

        // GET: api/locations/{id}/jobs
        [AllowAnonymous]
        [HttpGet("{id}/jobs")]
        public async Task<IActionResult> GetJobsByLocation(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var location = await _locationRepository.GetLocationEntityByIdAsync(id);
            if (location == null)
                return NotFound(new { message = "Location not found" });

            var result = await _locationRepository.GetJobsByLocationAsync(id, page, pageSize);
            return Ok(new
            {
                LocationId = id,
                LocationName = location.LocationName,
                TotalCount = result.TotalCount,
                Page = result.Page,
                PageSize = result.PageSize,
                TotalPages = result.TotalPages,
                Data = result.Items
            });
        }
    }
}
