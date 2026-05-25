using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = UserRoles.Admin)]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;
        private readonly IMemoryCache _cache;

        public ReportsController(IReportService reportService, IMemoryCache cache)
        {
            _reportService = reportService;
            _cache = cache;
        }

        [HttpGet("market-trend")]
        public async Task<IActionResult> GetMarketTrend([FromQuery] int limit = 10)
        {
            var trends = await _reportService.GetMarketTrendAsync(limit);
            return Ok(trends);
        }

        [HttpGet("salary-by-location")]
        public async Task<IActionResult> GetSalaryByLocation()
        {
            var salaryReport = await _reportService.GetSalaryByLocationAsync();
            return Ok(salaryReport);
        }

        [HttpGet("dashboard-summary")]
        public async Task<IActionResult> GetDashboardSummary()
        {
            var stats = await _reportService.GetDashboardSummaryAsync();
            return Ok(stats);
        }

        [HttpGet("salary-forecast-ai")]
        public IActionResult GetSalaryForecastFromAI()
        {
            if (_cache.TryGetValue("SalaryForecastAI", out object forecastData))
            {
                return Ok(forecastData);
            }

            return Ok(new
            {
                status = "processing",
                message = "AI is processing the data. Please check back in a few minutes."
            });
        }

        [HttpGet("application-timeline")]
        public async Task<IActionResult> GetApplicationTimeline(
            [FromQuery] string period = "month",
            [FromQuery] int months = 6)
        {
            var result = await _reportService.GetApplicationTimelineAsync(period, months);
            return Ok(result);
        }

        [HttpGet("top-companies")]
        public async Task<IActionResult> GetTopCompanies([FromQuery] int limit = 5)
        {
            var topCompanies = await _reportService.GetTopCompaniesAsync(limit);
            return Ok(topCompanies);
        }

        [AllowAnonymous]
        [HttpGet("graph-skills")]
        public async Task<IActionResult> GetGraphSkills([FromQuery] int limit = 50)
        {
            var graphData = (dynamic)await _reportService.GetSkillsGraphAsync(limit);

            if (_cache.TryGetValue("GnnSkillEdges", out List<GraphEdgeDTO> aiEdges))
            {
                return Ok(new
                {
                    nodes = graphData.nodes,
                    edges = graphData.edges,
                    aiSuggestedEdges = aiEdges
                });
            }

            return Ok(new
            {
                nodes = graphData.nodes,
                edges = graphData.edges,
                aiSuggestedEdges = new List<GraphEdgeDTO>()
            });
        }
    }
}