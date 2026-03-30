using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(ApplicationDbContext context, ILogger<ReportsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// 1. Xu hướng thị trường: Top kỹ năng được tuyển dụng nhiều nhất
        /// </summary>
        [HttpGet("market-trend")]
        [ProducesResponseType(typeof(List<MarketTrendDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetMarketTrend([FromQuery] int limit = 10)
        {
            try
            {
                var totalJobs = await _context.Jobs
                    .CountAsync(j => j.DeletedAt == null);

                if (totalJobs == 0)
                {
                    return Ok(new List<MarketTrendDTO>());
                }

                var trends = await _context.Tags
                    .Where(t => t.JobTags.Any(jt => jt.Job != null && jt.Job.DeletedAt == null))
                    .Select(t => new MarketTrendDTO
                    (
                        t.TagName,
                        t.JobTags.Count(jt => jt.Job != null && jt.Job.DeletedAt == null),
                        Math.Round((double)t.JobTags.Count(jt => jt.Job != null && jt.Job.DeletedAt == null) / totalJobs * 100, 2)
                    ))
                    .OrderByDescending(x => x.JobCount)
                    .Take(limit)
                    .ToListAsync();

                return Ok(trends);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting market trend");
                return StatusCode(500, new { message = "An error occurred while fetching market trend" });
            }
        }

        /// <summary>
        /// 2. Dự báo lương: Mức lương trung bình theo địa điểm
        /// </summary>
        [HttpGet("salary-by-location")]
        [ProducesResponseType(typeof(List<SalaryReportDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetSalaryByLocation()
        {
            try
            {
                var salaryReport = await _context.Jobs
                    .Where(j => j.DeletedAt == null 
                        && j.SalaryMin.HasValue 
                        && j.SalaryMax.HasValue 
                        && j.Location != null)
                    .GroupBy(j => j.Location!.LocationName)
                    .Select(g => new SalaryReportDTO
                    (
                        g.Key,
                        Math.Round(g.Average(x => x.SalaryMin ?? 0), 0),
                        Math.Round(g.Average(x => x.SalaryMax ?? 0), 0),
                        g.Count()
                    ))
                    .OrderByDescending(x => x.AverageMaxSalary)
                    .ToListAsync();

                return Ok(salaryReport);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting salary by location");
                return StatusCode(500, new { message = "An error occurred while fetching salary data" });
            }
        }

        /// <summary>
        /// 3. Graph AI Data: Các kỹ năng thường đi kèm với nhau (Nodes & Edges)
        /// </summary>
        [HttpGet("graph-skills")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetSkillsGraph([FromQuery] int limit = 30)
        {
            try
            {
                // Lấy danh sách các Tag phổ biến nhất làm Nodes
                var popularTagIds = await _context.JobTags
                    .Where(jt => jt.Job != null && jt.Job.DeletedAt == null)
                    .GroupBy(jt => jt.TagId)
                    .OrderByDescending(g => g.Count())
                    .Select(g => g.Key)
                    .Take(limit)
                    .ToListAsync();

                var nodes = await _context.Tags
                    .Where(t => popularTagIds.Contains(t.TagId))
                    .Select(t => new
                    {
                        id = t.TagId,
                        label = t.TagName,
                        group = t.Type ?? "general",
                        size = t.JobTags.Count(jt => jt.Job != null && jt.Job.DeletedAt == null)
                    })
                    .ToListAsync();

                if (!nodes.Any())
                {
                    return Ok(new { nodes = new List<object>(), edges = new List<object>() });
                }

                // Lấy tất cả các cặp Job-Tag để tính edges
                var jobTagLookup = await _context.JobTags
                    .Where(jt => jt.Job != null 
                        && jt.Job.DeletedAt == null 
                        && popularTagIds.Contains(jt.TagId))
                    .GroupBy(jt => jt.JobId)
                    .Select(g => g.Select(x => x.TagId).ToList())
                    .ToListAsync();

                // Tạo Dictionary để đếm cặp hiệu quả hơn
                var edgeCounts = new Dictionary<(int, int), int>();
                
                foreach (var tagIds in jobTagLookup)
                {
                    var sortedTags = tagIds.Where(id => popularTagIds.Contains(id)).Distinct().ToList();
                    
                    for (int i = 0; i < sortedTags.Count; i++)
                    {
                        for (int j = i + 1; j < sortedTags.Count; j++)
                        {
                            var key = (Math.Min(sortedTags[i], sortedTags[j]), 
                                      Math.Max(sortedTags[i], sortedTags[j]));
                            
                            edgeCounts.TryAdd(key, 0);
                            edgeCounts[key]++;
                        }
                    }
                }

                // Tạo edges từ dictionary
                var edges = edgeCounts
                    .Where(x => x.Value > 1) // Chỉ lấy các cặp xuất hiện từ 2 lần trở lên
                    .Select(x => new
                    {
                        from = x.Key.Item1,
                        to = x.Key.Item2,
                        value = x.Value,
                        strength = Math.Round((double)x.Value / jobTagLookup.Count * 100, 2)
                    })
                    .OrderByDescending(x => x.value)
                    .Take(50) // Giới hạn số lượng edges
                    .ToList();

                return Ok(new { nodes, edges });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating skills graph");
                return StatusCode(500, new { message = "An error occurred while generating skills graph" });
            }
        }

        /// <summary>
        /// 4. Thống kê tổng quan (Dashboard Summary)
        /// </summary>
        [HttpGet("dashboard-summary")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetDashboardSummary()
        {
            try
            {
                var today = DateTime.Today;
                var startOfWeek = today.AddDays(-(int)today.DayOfWeek + 1);
                var startOfMonth = new DateTime(today.Year, today.Month, 1);
                var startOfYear = new DateTime(today.Year, 1, 1);

                // Sử dụng Task.WhenAll để chạy song song các truy vấn
                var totalJobsTask = _context.Jobs.CountAsync(j => j.DeletedAt == null);
                var totalCandidatesTask = _context.Candidates.CountAsync(c => c.User != null && c.User.DeletedAt == null);
                var totalCompaniesTask = _context.Companies.CountAsync(c => c.DeletedAt == null);
                var totalRecruitersTask = _context.Recruiters.CountAsync(r => r.User != null && r.User.DeletedAt == null);
                
                var applicationsTask = _context.Applications
                    .Where(a => a.DeletedAt == null)
                    .GroupBy(a => 1)
                    .Select(g => new
                    {
                        Total = g.Count(),
                        ThisWeek = g.Count(a => a.AppliedDate >= startOfWeek),
                        ThisMonth = g.Count(a => a.AppliedDate >= startOfMonth),
                        ThisYear = g.Count(a => a.AppliedDate >= startOfYear)
                    })
                    .FirstOrDefaultAsync();

                var jobsByStatusTask = _context.Jobs
                    .Where(j => j.DeletedAt == null)
                    .GroupBy(j => 1)
                    .Select(g => new
                    {
                        Active = g.Count(j => j.Deadline >= today),
                        Expired = g.Count(j => j.Deadline < today),
                        Total = g.Count()
                    })
                    .FirstOrDefaultAsync();

                // Chờ tất cả tasks hoàn thành
                await Task.WhenAll(
                    totalJobsTask, 
                    totalCandidatesTask, 
                    totalCompaniesTask, 
                    totalRecruitersTask,
                    applicationsTask,
                    jobsByStatusTask
                );

                var stats = new
                {
                    TotalJobs = await totalJobsTask,
                    TotalCandidates = await totalCandidatesTask,
                    TotalCompanies = await totalCompaniesTask,
                    TotalRecruiters = await totalRecruitersTask,
                    
                    Applications = await applicationsTask ?? new { Total = 0, ThisWeek = 0, ThisMonth = 0, ThisYear = 0 },
                    
                    JobsByStatus = await jobsByStatusTask ?? new { Active = 0, Expired = 0, Total = 0 },
                    
                    // Tính tỷ lệ
                    ApplicationRate = await totalJobsTask > 0 
                        ? Math.Round((double)(await applicationsTask)?.Total / (await totalJobsTask) * 100, 2) 
                        : 0,
                    
                    LastUpdated = DateTime.Now
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard summary");
                return StatusCode(500, new { message = "An error occurred while fetching dashboard summary" });
            }
        }

        /// <summary>
        /// 5. Thống kê ứng tuyển theo thời gian
        /// </summary>
        [HttpGet("application-timeline")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetApplicationTimeline(
            [FromQuery] string period = "month", // day, week, month, year
            [FromQuery] int months = 6)
        {
            try
            {
                var endDate = DateTime.Now;
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
                            Interviewed = g.Count(a => a.Status == 3),
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
                            Interviewed = groupedData.Sum(x => x.ByStatus.Interviewed),
                            Accepted = groupedData.Sum(x => x.ByStatus.Accepted),
                            Rejected = groupedData.Sum(x => x.ByStatus.Rejected)
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting application timeline");
                return StatusCode(500, new { message = "An error occurred while fetching application timeline" });
            }
        }

        /// <summary>
        /// 6. Thống kê theo ngành nghề (Job Categories)
        /// </summary>
        [HttpGet("job-categories")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetJobCategories()
        {
            try
            {
                var categories = await _context.Tags
                    .Where(t => t.Type == "job_category" || t.Type == "industry")
                    .Select(t => new
                    {
                        CategoryId = t.TagId,
                        CategoryName = t.TagName,
                        JobCount = t.JobTags.Count(jt => jt.Job != null && jt.Job.DeletedAt == null),
                        AverageSalary = t.JobTags
                            .Where(jt => jt.Job != null && jt.Job.DeletedAt == null)
                            .Average(jt => (jt.Job!.SalaryMin + jt.Job!.SalaryMax) / 2 ?? 0),
                        TopCompanies = t.JobTags
                            .Where(jt => jt.Job != null && jt.Job.DeletedAt == null)
                            .Select(jt => jt.Job!.Company!.CompanyName)
                            .Distinct()
                            .Take(5)
                            .ToList()
                    })
                    .OrderByDescending(x => x.JobCount)
                    .ToListAsync();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting job categories");
                return StatusCode(500, new { message = "An error occurred while fetching job categories" });
            }
        }

        /// <summary>
        /// 7. Top nhà tuyển dụng (Companies) tích cực nhất
        /// </summary>
        [HttpGet("top-companies")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetTopCompanies([FromQuery] int limit = 10)
        {
            try
            {
                var topCompanies = await _context.Companies
                    .Where(c => c.DeletedAt == null && c.Jobs.Any(j => j.DeletedAt == null))
                    .Select(c => new
                    {
                        CompanyId = c.CompanyId,
                        CompanyName = c.CompanyName,
                        LogoImg = c.LogoImg,
                        JobCount = c.Jobs.Count(j => j.DeletedAt == null),
                        TotalApplications = c.Jobs
                            .Where(j => j.DeletedAt == null)
                            .SelectMany(j => j.Applications)
                            .Count(a => a.DeletedAt == null),
                        TotalViews = c.Jobs
                            .Where(j => j.DeletedAt == null)
                            .Sum(j => j.ViewCount ?? 0),
                        AvgSalary = c.Jobs
                            .Where(j => j.DeletedAt == null && j.SalaryMin.HasValue && j.SalaryMax.HasValue)
                            .Average(j => (j.SalaryMin + j.SalaryMax) / 2 ?? 0),
                        LatestJobDate = c.Jobs
                            .Where(j => j.DeletedAt == null)
                            .Max(j => (DateTime?)j.PostedDate)
                    })
                    .OrderByDescending(x => x.TotalApplications)
                    .Take(limit)
                    .ToListAsync();

                return Ok(topCompanies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top companies");
                return StatusCode(500, new { message = "An error occurred while fetching top companies" });
            }
        }
    }
}