using Microsoft.AspNetCore.Mvc;
using JobSeekingAPI.Services;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Data; // Thêm dòng này để dùng ApplicationDbContext
using Microsoft.EntityFrameworkCore; // Thêm dòng này để dùng ToListAsync
using System.Net.Http.Json; // Thêm dòng này để dùng PostAsJsonAsync

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StatisticsController : ControllerBase
    {
        private readonly IStatisticsService _statsService;
        
        // 1. Khai báo thêm 2 biến này
        private readonly ApplicationDbContext _context;
        private readonly HttpClient _httpClient;

        // 2. Tiêm (Inject) chúng vào Constructor
        public StatisticsController(
            IStatisticsService statsService, 
            ApplicationDbContext context, 
            HttpClient httpClient)
        {
            _statsService = statsService;
            _context = context;
            _httpClient = httpClient;
        }

        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(DashboardSummaryDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetDashboard()
        {
            try
            {
                var data = await _statsService.GetDashboardStatsAsync();
                return Ok(data); 
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetDashboard: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while fetching dashboard statistics : " + ex.Message });
            }
        }

        // Đoạn code GetSalaryChartFromAI của bạn để ở dưới này là sẽ hết báo lỗi đỏ!
        [HttpGet("salary-chart-from-ai")]
        public async Task<IActionResult> GetSalaryChartFromAI()
        {
            try
            {
                var rawSalaries = await _context.Jobs
                    .Where(j => j.DeletedAt == null && j.Status == 1)
                    .Select(j => new 
                    { 
                        salary_min = j.SalaryMin ?? 0, 
                        salary_max = j.SalaryMax ?? 0 
                    })
                    .ToListAsync();

                var payload = new { jobs = rawSalaries };
                var response = await _httpClient.PostAsJsonAsync("http://localhost:8000/api/analytics/salary-chart", payload);

                if (response.IsSuccessStatusCode)
                {
                    var chartResult = await response.Content.ReadFromJsonAsync<object>();
                    return Ok(chartResult);
                }

                return StatusCode((int)response.StatusCode, "Python Service từ chối xử lý dữ liệu.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Lỗi kết nối C# đến Python: " + ex.Message);
            }
        }
    }
}