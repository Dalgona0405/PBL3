using JobSeekingAPI.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace JobSeekingAPI.Workers
{
    /// <summary>
    /// Background worker định kỳ thống kê lương theo kỹ năng và gọi dịch vụ Python AI để dự báo xu hướng.
    /// </summary>
    public class SalaryAnalyticsWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly ILogger<SalaryAnalyticsWorker> _logger;
        private readonly string _pythonBaseUrl;

        public SalaryAnalyticsWorker(IServiceScopeFactory scopeFactory, HttpClient httpClient, IMemoryCache cache, ILogger<SalaryAnalyticsWorker> logger, IConfiguration config)
        {
            _scopeFactory = scopeFactory;
            _httpClient = httpClient;
            _cache = cache;
            _logger = logger;
            _pythonBaseUrl = config["PythonAI:BaseUrl"] ?? "http://localhost:8000";
        }

        /// <summary>
        /// Thực thi vòng lặp định kỳ tính lương trung bình theo kỹ năng và lưu kết quả dự báo từ AI vào bộ nhớ đệm.
        /// </summary>
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                        _logger.LogInformation("Worker: Calculating average salary by skill level...");

                        // Tính lương trung bình của các tin tuyển dụng còn hiệu lực theo từng thẻ kỹ năng
                        var skillsData = await context.Tags
                            .Where(t => t.Type == "Skill" || t.Type == "Language" || t.Type == "Role" || t.Type == "Domain")
                            .Select(t => new
                            {
                                skill_id = t.TagId,
                                skill_name = t.TagName,
                                current_avg_salary = t.JobTags
                                    .Where(jt => jt.Job != null && (jt.Job.SalaryMin > 0 || jt.Job.SalaryMax > 0))
                                    .Average(jt => (decimal?)((jt.Job!.SalaryMin + jt.Job.SalaryMax) / 2)) ?? 0
                            })
                            .Where(x => x.current_avg_salary > 0)
                            .ToListAsync(stoppingToken);

                        _logger.LogInformation("Worker: Calculated average salary for {SkillCount} skills. Sending to Python AI for forecasting...", skillsData.Count);

                        if (skillsData.Count > 0)
                        {
                            // Gửi dữ liệu lương tổng hợp sang dịch vụ Python AI để dự báo xu hướng
                            var payload = new { skills = skillsData };
                            var response = await _httpClient.PostAsJsonAsync($"{_pythonBaseUrl}/api/analytics/salary-forecast", payload, stoppingToken);

                            if (response.IsSuccessStatusCode)
                            {
                                var forecastResult = await response.Content.ReadFromJsonAsync<object>(cancellationToken: stoppingToken);

                                // Lưu kết quả dự báo vào MemoryCache
                                _cache.Set("SalaryForecastAI", forecastResult, TimeSpan.FromHours(2));
                                _logger.LogInformation("Worker: Got forecast results from AI and saved to cache successfully.");
                            }
                            else
                            {
                                _logger.LogWarning($"Worker: Python AI returned error {response.StatusCode}");
                            }
                        }
                    }

                    // Chạy lại sau mỗi 1 tiếng
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Worker: An error occurred while processing salary forecast data.");

                    try
                    {
                        await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                    }
                    catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                    {
                        break;
                    }
                }
            }
        }
    }
}