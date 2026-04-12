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
        public async Task<IActionResult> GetDashboard()
        {
            try 
            {
                var data = await _statsService.GetDashboardStatsAsync();
                return Ok(data);
            }
            catch (Exception ex)
            {
                // Thêm cái này để nếu có lỗi trong Service thì mình còn biết đường mà fix
                return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
            }
        }
    }
}