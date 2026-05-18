using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReportsController> _logger;
        private readonly IReportService _reportService;
        private readonly IMemoryCache _cache;

        public ReportsController(ApplicationDbContext context, ILogger<ReportsController> logger, IReportService reportService, IMemoryCache cache)
        {
            _context = context;
            _logger = logger;
            _reportService = reportService;
            _cache = cache;
        }

        /// <summary>
        /// 1. Xu hướng thị trường: Top kỹ năng được tuyển dụng nhiều nhất
        /// </summary>
        [HttpGet("market-trend")]
        [ProducesResponseType(typeof(List<MarketTrendDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetMarketTrend([FromQuery] int limit = 10)
        {
            var trends = await _reportService.GetMarketTrendAsync(limit);
            return Ok(trends);
        }

        /// <summary>
        /// 2. Dự báo lương: Mức lương trung bình theo địa điểm
        /// </summary>
        [HttpGet("salary-by-location")]
        [ProducesResponseType(typeof(List<SalaryReportDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetSalaryByLocation()
        {
            var salaryReport = await _reportService.GetSalaryByLocationAsync();
            return Ok(salaryReport);
        }

        /// <summary>
        /// 3. Thống kê tổng quan (Dashboard Summary)
        /// </summary>
        [HttpGet("dashboard-summary")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetDashboardSummary()
        {
            var today = DateTime.Today;
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek + 1);
            var startOfMonth = new DateTime(today.Year, today.Month, 1);
            var startOfYear = new DateTime(today.Year, 1, 1);

            // 1. Thực hiện từng câu lệnh await. 
            // EF Core sẽ tự động tối ưu hóa các lệnh này, không cần chạy song song.
            var totalJobs = await _context.Jobs.CountAsync(j => j.DeletedAt == null);
            var totalCandidates = await _context.Candidates.CountAsync(c => c.User != null && c.User.DeletedAt == null);
            var totalCompanies = await _context.Companies.CountAsync(c => c.DeletedAt == null);
            var totalRecruiters = await _context.Recruiters.CountAsync(r => r.User != null && r.User.DeletedAt == null);

            var apps = await _context.Applications
                .Where(a => a.DeletedAt == null)
                .GroupBy(a => 1)
                .Select(g => new
                {
                    Total = g.Count(),
                    ThisWeek = g.Count(a => a.AppliedDate >= startOfWeek),
                    ThisMonth = g.Count(a => a.AppliedDate >= startOfMonth),
                    ThisYear = g.Count(a => a.AppliedDate >= startOfYear)
                })
                .FirstOrDefaultAsync() ?? new { Total = 0, ThisWeek = 0, ThisMonth = 0, ThisYear = 0 };

            var status = await _context.Jobs
                .Where(j => j.DeletedAt == null)
                .GroupBy(j => 1)
                .Select(g => new
                {
                    Active = g.Count(j => j.Deadline >= today),
                    Expired = g.Count(j => j.Deadline < today),
                    Total = g.Count()
                })
                .FirstOrDefaultAsync() ?? new { Active = 0, Expired = 0, Total = 0 };

            // 2. Tính toán kết quả
            var stats = new
            {
                TotalJobs = totalJobs,
                TotalCandidates = totalCandidates,
                TotalCompanies = totalCompanies,
                TotalRecruiters = totalRecruiters,
                Applications = apps,
                JobsByStatus = status,
                ApplicationRate = totalJobs > 0 ? Math.Round((double)apps.Total / totalJobs * 100, 2) : 0,
                LastUpdated = DateTime.UtcNow
            };

            return Ok(stats);
        }

        /// <summary>
        /// 4. Thống kê ứng tuyển theo thời gian
        /// </summary>
        [HttpGet("application-timeline")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetApplicationTimeline(
            [FromQuery] string period = "month", // day, week, month, year
            [FromQuery] int months = 6)
        {
            var endDate = DateTime.UtcNow;
            var startDate = period.ToLower() switch
            {
                "day" => endDate.AddDays(-30),
                "week" => endDate.AddDays(-90),
                "month" => endDate.AddMonths(-months),
                "year" => endDate.AddYears(-3),
                _ => endDate.AddMonths(-6)
            };
            // PHẦN 1: Query dữ liệu thô từ database
            var rawData = await _context.Applications
                .Where(a => a.DeletedAt == null && a.AppliedDate >= startDate)
                .Select(a => new
                {
                    a.AppliedDate,
                    a.Status,
                    Year = a.AppliedDate.Year,
                    Month = a.AppliedDate.Month,
                    // Week = EF.Functions.DateDiffWeek(startDate, a.AppliedDate),
                    Week = (a.AppliedDate - startDate).Days / 7,
                    Day = a.AppliedDate.Date
                })
                .ToListAsync(); // Thực thi query ngay tại đây

            if (!rawData.Any())
            {
                return Ok(new
                {
                    Period = period,
                    StartDate = startDate,
                    EndDate = endDate,
                    Data = new List<object>(),
                    Total = 0
                });
            }
            // PHẦN 2: Xử lý dữ liệu trong memory (C# code thuần túy)
            var groupedData = rawData
                .GroupBy(a => new
                {
                    a.Year,
                    a.Month,
                    a.Week,
                    a.Day
                })
                .Select(g => new
                {
                    Period = period.ToLower() switch // Switch expression chạy trong memory, OK!
                    {
                        "day" => g.Key.Day.ToString("yyyy-MM-dd"),
                        "week" => $"Week {g.Key.Week}",
                        "month" => $"{g.Key.Year}-{g.Key.Month:D2}",
                        "year" => g.Key.Year.ToString(),
                        _ => $"{g.Key.Year}-{g.Key.Month:D2}"
                    },
                    Total = g.Count(),
                    ByStatus = new
                    {
                        Pending = g.Count(a => a.Status == 1),
                        Reviewed = g.Count(a => a.Status == 2),
                        Interviewing = g.Count(a => a.Status == 3),
                        Accepted = g.Count(a => a.Status == 4),
                        Rejected = g.Count(a => a.Status == 5)
                    }
                })
                .OrderBy(x => x.Period)
                .ToList();

            return Ok(new
            {
                Period = period,
                StartDate = startDate,
                EndDate = endDate,
                Data = groupedData,
                Total = groupedData.Sum(x => x.Total),
                Summary = new
                {
                    TotalApplications = groupedData.Sum(x => x.Total),
                    ByStatus = new
                    {
                        Pending = groupedData.Sum(x => x.ByStatus.Pending),
                        Reviewed = groupedData.Sum(x => x.ByStatus.Reviewed),
                        Interviewing = groupedData.Sum(x => x.ByStatus.Interviewing),
                        Accepted = groupedData.Sum(x => x.ByStatus.Accepted),
                        Rejected = groupedData.Sum(x => x.ByStatus.Rejected)
                    }
                }
            });
        }
        /// <summary>
        /// 5. Top nhà tuyển dụng (Companies) tích cực nhất
        /// </summary>
        [HttpGet("top-companies")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetTopCompanies([FromQuery] int limit = 5)
        {
            try
            {
                // Sử dụng Service để tách biệt logic, Controller chỉ tập trung vào việc nhận request và trả response
                var topCompanies = await _reportService.GetTopCompaniesAsync(limit);
                return Ok(topCompanies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top companies");
                return StatusCode(500, new { message = "An error occurred while fetching top companies : " + ex.Message });
            }
        }
        /// <summary>
        /// 6. Lấy dữ liệu vẽ biểu đồ Mạng nén đồ thị (GNN) cho Kỹ năng
        /// </summary>
        [HttpGet("graph-skills")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetGraphSkills([FromQuery] int limit = 50)
        {
            // 1. Lấy dữ liệu GỐC từ C# (Các kỹ năng thực tế đang liên kết với nhau)
            // Dùng dynamic vì Service đang trả về một Anonymous Object { nodes, edges }
            var graphData = (dynamic)await _reportService.GetSkillsGraphAsync(limit);

            // 2. Mở "tủ lạnh" Cache lấy dữ liệu DỰ BÁO từ AI (Do GNNUpdateWorker cất vào)
            if (_cache.TryGetValue("GnnSkillEdges", out List<GraphEdgeDTO> aiEdges))
            {
                // 3. Nếu có AI, gộp chung lại và trả về 3 mảng riêng biệt
                return Ok(new
                {
                    nodes = graphData.nodes,
                    edges = graphData.edges,           // Nét vẽ bình thường (Thực tế)
                    aiSuggestedEdges = aiEdges         // Nét vẽ đứt/màu đỏ (AI dự báo)
                });
            }

            // 4. Nếu AI chưa kịp chạy xong (hoặc Python đang tắt), cứ trả về dữ liệu gốc để Frontend không bị lỗi
            return Ok(new
            {
                nodes = graphData.nodes,
                edges = graphData.edges,
                aiSuggestedEdges = new List<GraphEdgeDTO>() // Trả về mảng rỗng để ReactJS không bị undefined
            });
        }
    }
}