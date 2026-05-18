using JobSeekingAPI.Data; // Thêm dòng này để dùng ApplicationDbContext
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory; // Thêm dòng này để dùng IMemoryCache
namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StatisticsController : ControllerBase
    {
        private readonly IStatisticsService _statsService;
        private readonly IMemoryCache _cache;
        // 1. Khai báo thêm 2 biến này
        private readonly ApplicationDbContext _context;
        private readonly HttpClient _httpClient;

        // 2. Tiêm (Inject) chúng vào Constructor
        public StatisticsController(
            IStatisticsService statsService,
            IMemoryCache cache,
            ApplicationDbContext context,
            HttpClient httpClient)
        {
            _statsService = statsService;
            _context = context;
            _httpClient = httpClient;
            _cache = cache;
        }

        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(DashboardSummaryDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetDashboard()
        {
            var data = await _statsService.GetDashboardStatsAsync();
            return Ok(data);
        }

        // Đoạn code GetSalaryChartFromAI của bạn để ở dưới này là sẽ hết báo lỗi đỏ!
        [HttpGet("salary-chart-from-ai")]
        public IActionResult GetSalaryChart()
        {
            // Lấy dữ liệu đã được Worker chuẩn bị sẵn trong RAM
            if (_cache.TryGetValue("CachedSalaryChart", out object chartData))
            {
                return Ok(chartData);
            }

            // Nếu lúc mới bật máy mà Worker chưa kịp chạy xong
            return Ok(new { message = "Dữ liệu đang được AI xử lý ngầm, vui lòng quay lại sau." });
        }
    }
}