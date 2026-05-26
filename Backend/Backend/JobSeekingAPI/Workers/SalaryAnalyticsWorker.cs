using JobSeekingAPI.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace JobSeekingAPI.Workers
{
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

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                        _logger.LogInformation("Worker: Calculating average salary by skill level using C#...");

                        // 1. C# TỰ TÍNH TOÁN LƯƠNG TRUNG BÌNH (Rất nhanh nhờ EF Core)
                        var skillsData = await context.Tags
                            .Where(t => t.Type == "Skill" || t.Type == "Language")
                            .Select(t => new
                            {
                                skill_id = t.TagId,
                                skill_name = t.TagName,
                                // Tính lương trung bình của các Job có chứa Tag này
                                current_avg_salary = t.JobTags
                                    .Where(jt => jt.Job != null && jt.Job.DeletedAt == null && (jt.Job.SalaryMin > 0 || jt.Job.SalaryMax > 0))
                                    .Average(jt => (decimal?)((jt.Job.SalaryMin + jt.Job.SalaryMax) / 2)) ?? 0
                            })
                            .Where(x => x.current_avg_salary > 0) // Chỉ lấy những kỹ năng có data lương
                            .ToListAsync(stoppingToken);

                        _logger.LogInformation($"Worker: Calculated average salary for {skillsData.Count} skills. Sending to Python AI for forecasting...");

                        if (skillsData.Count > 0)
                        {
                            // 2. GỬI SANG PYTHON ĐỂ DỰ BÁO (Match với API mới)
                            var payload = new { skills = skillsData };
                            var response = await _httpClient.PostAsJsonAsync($"{_pythonBaseUrl}/api/analytics/salary-forecast", payload, stoppingToken);

                            if (response.IsSuccessStatusCode)
                            {
                                var forecastResult = await response.Content.ReadFromJsonAsync<object>(cancellationToken: stoppingToken);

                                // 3. LƯU KẾT QUẢ DỰ BÁO VÀO RAM
                                _cache.Set("SalaryForecastAI", forecastResult, TimeSpan.FromHours(2));
                                _logger.LogInformation("Worker: Got forecast results from AI and saved to Cache successfully!");
                            }
                            else
                            {
                                _logger.LogWarning($"Worker: Python AI returned error {response.StatusCode}");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Worker: An error occurred while processing salary forecast data.");
                }

                // Chạy lại sau mỗi 1 tiếng
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }
}