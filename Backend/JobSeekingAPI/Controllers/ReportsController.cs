using JobSeekingAPI.DTOs;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace JobSeekingAPI.Controllers
{
    /// <summary>
    /// Cung cấp các số liệu thống kê tổng quan, biểu đồ thị trường, dự báo lương và đồ thị kỹ năng AI
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;
        private readonly IMemoryCache _cache;

        public ReportsController(IReportService reportService, IMemoryCache cache)
        {
            _reportService = reportService;
            _cache = cache;
        }

        /// <summary>
        /// Lấy xu hướng kỹ năng được tuyển dụng nhiều nhất (có MemoryCache 1 giờ)
        /// </summary>
        [HttpGet("market-trend")]
        public async Task<IActionResult> GetMarketTrend([FromQuery] int limit = 10)
        {
            string cacheKey = $"MarketTrend_{limit}";
            var trends = await _cache.GetOrCreateAsync(cacheKey, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
                return await _reportService.GetMarketTrendAsync(limit);
            });
            return Ok(trends);
        }

        /// <summary>
        /// Thống kê mức lương trung bình theo từng địa điểm
        /// </summary>
        [HttpGet("salary-by-location")]
        public async Task<IActionResult> GetSalaryByLocation()
        {
            var salaryReport = await _reportService.GetSalaryByLocationAsync();
            return Ok(salaryReport);
        }

        /// <summary>
        /// Lấy bộ chỉ số tổng quan cho Dashboard (có MemoryCache 30 phút)
        /// </summary>
        [HttpGet("dashboard-summary")]
        public async Task<IActionResult> GetDashboardSummary()
        {
            string cacheKey = "DashboardSummary";
            var stats = await _cache.GetOrCreateAsync(cacheKey, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);
                return await _reportService.GetDashboardSummaryAsync();
            });
            return Ok(stats);
        }

        /// <summary>
        /// Lấy kết quả dự báo xu hướng lương từ AI Cache
        /// </summary>
        [HttpGet("salary-forecast-ai")]
        public IActionResult GetSalaryForecastFromAI()
        {
            if (_cache.TryGetValue("SalaryForecastAI", out object? forecastData) && forecastData != null)
            {
                return Ok(forecastData);
            }

            return Ok(new
            {
                status = "processing",
                message = "Hệ thống AI đang xử lý dữ liệu dự báo. Vui lòng thử lại sau ít phút."
            });
        }

        /// <summary>
        /// Thống kê số lượng đơn ứng tuyển theo dòng thời gian (ngày, tuần, tháng, năm)
        /// </summary>
        [HttpGet("application-timeline")]
        public async Task<IActionResult> GetApplicationTimeline(
            [FromQuery] string period = "month",
            [FromQuery] int months = 6)
        {
            var result = await _reportService.GetApplicationTimelineAsync(period, months);
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách các doanh nghiệp tuyển dụng nổi bật nhất
        /// </summary>
        [HttpGet("top-companies")]
        public async Task<IActionResult> GetTopCompanies([FromQuery] int limit = 5)
        {
            var topCompanies = await _reportService.GetTopCompaniesAsync(limit);
            return Ok(topCompanies);
        }

        /// <summary>
        /// Lấy dữ liệu đồ thị mối liên hệ kỹ năng kèm các cạnh dự đoán từ mô hình GNN
        /// </summary>
        [AllowAnonymous]
        [HttpGet("graph-skills")]
        public async Task<IActionResult> GetGraphSkills([FromQuery] int limit = 50)
        {
            var graphData = await _reportService.GetSkillsGraphAsync(limit);

            _cache.TryGetValue("GnnSkillEdges", out List<GraphEdgeDTO>? aiEdges);

            return Ok(new SkillsGraphResultDTO(
                graphData.Nodes,
                graphData.Edges,
                aiEdges ?? new List<GraphEdgeDTO>()
            ));
        }
    }
}
