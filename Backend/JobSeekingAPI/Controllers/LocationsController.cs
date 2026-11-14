using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    /// <summary>
    /// Quản lý danh mục địa điểm tuyển dụng và tra cứu việc làm theo khu vực
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class LocationsController : ControllerBase
    {
        private readonly ILocationService _locationService;

        public LocationsController(ILocationService locationService)
        {
            _locationService = locationService;
        }

        /// <summary>
        /// Lấy danh sách tất cả địa điểm kèm số lượng việc làm đang mở
        /// </summary>
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAllLocations()
        {
            var locations = await _locationService.GetAllLocationsAsync();
            return Ok(locations);
        }

        /// <summary>
        /// Lấy chi tiết một địa điểm và danh sách việc làm thuộc địa điểm đó
        /// </summary>
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetLocationById(int id)
        {
            var location = await _locationService.GetLocationByIdAsync(id);
            return Ok(location);
        }

        /// <summary>
        /// Thêm mới một địa điểm (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpPost]
        public async Task<IActionResult> CreateLocation([FromBody] CreateLocationDTO dto)
        {
            var created = await _locationService.CreateLocationAsync(dto);
            return CreatedAtAction(nameof(GetLocationById), new { id = created.LocationId }, created);
        }

        /// <summary>
        /// Cập nhật tên địa điểm (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateLocation(int id, [FromBody] UpdateLocationDTO dto)
        {
            await _locationService.UpdateLocationAsync(id, dto);
            return Ok(new { message = "Cập nhật địa điểm thành công." });
        }

        /// <summary>
        /// Xóa địa điểm nếu chưa có tin tuyển dụng liên kết (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLocation(int id)
        {
            await _locationService.DeleteLocationAsync(id);
            return Ok(new { message = "Xóa địa điểm thành công." });
        }

        /// <summary>
        /// Tìm kiếm địa điểm theo từ khóa
        /// </summary>
        [AllowAnonymous]
        [HttpGet("search")]
        public async Task<IActionResult> SearchLocations([FromQuery] string keyword)
        {
            var locations = await _locationService.SearchLocationsAsync(keyword);
            return Ok(locations);
        }

        /// <summary>
        /// Lấy danh sách các địa điểm có nhiều tin tuyển dụng nhất
        /// </summary>
        [AllowAnonymous]
        [HttpGet("popular")]
        public async Task<IActionResult> GetPopularLocations([FromQuery] int limit = 10)
        {
            var popularLocations = await _locationService.GetPopularLocationsAsync(limit);
            return Ok(popularLocations);
        }

        /// <summary>
        /// Lấy danh sách việc làm theo mã địa điểm (phân trang)
        /// </summary>
        [AllowAnonymous]
        [HttpGet("{id}/jobs")]
        public async Task<IActionResult> GetJobsByLocation(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var (locationName, result) = await _locationService.GetJobsByLocationAsync(id, page, pageSize);
            return Ok(new
            {
                LocationId = id,
                LocationName = locationName,
                TotalCount = result.TotalCount,
                Page = result.Page,
                PageSize = result.PageSize,
                TotalPages = result.TotalPages,
                Data = result.Items
            });
        }
    }
}
