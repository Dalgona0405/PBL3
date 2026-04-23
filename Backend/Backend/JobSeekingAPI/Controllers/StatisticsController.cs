using Microsoft.AspNetCore.Mvc;
using JobSeekingAPI.Services;
using JobSeekingAPI.DTOs; // Đảm bảo có cái này để nhận diện DashboardSummaryDTO

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StatisticsController : ControllerBase
    {
        private readonly IStatisticsService _statsService;

        public StatisticsController(IStatisticsService statsService)
        {
            _statsService = statsService;
        }

        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(DashboardSummaryDTO), StatusCodes.Status200OK)] // Hiển thị rõ cấu trúc DTO mới lên Swagger
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetDashboard()
        {
            try 
            {
                var data = await _statsService.GetDashboardStatsAsync();
                return Ok(data); // Hàm này sẽ tự động map ra 3 nhóm JSON bạn vừa chia
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetDashboard: {ex.Message}");
                // Thêm cái này để nếu có lỗi trong Service thì mình còn biết đường mà fix
                return StatusCode(500, new { message = "An error occurred while fetching dashboard statistics : " + ex.Message });
            }
        }
    }
}