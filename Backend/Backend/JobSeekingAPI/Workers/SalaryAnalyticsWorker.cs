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

                        // 1. Lấy dữ liệu thô từ Postgres
                        var rawSalaries = await context.Jobs
                            .Where(j => j.DeletedAt == null && j.Status == 1)
                            .Select(j => new { salary_min = j.SalaryMin ?? 0, salary_max = j.SalaryMax ?? 0 })
                            .ToListAsync(stoppingToken);

                        _logger.LogInformation($"Worker: Lấy được {rawSalaries.Count} công việc để gửi sang Python.");

                        if (rawSalaries.Count > 0)
                        {
                            // ====================================================
                            // LẤY BIỂU ĐỒ LƯƠNG
                            // ====================================================
                            var chartResponse = await _httpClient.PostAsJsonAsync($"{_pythonBaseUrl}/api/analytics/salary-chart", new { jobs = rawSalaries }, stoppingToken);
                            if (chartResponse.IsSuccessStatusCode)
                            {
                                var chartResult = await chartResponse.Content.ReadFromJsonAsync<object>(cancellationToken: stoppingToken);
                                _cache.Set("CachedSalaryChart", chartResult, TimeSpan.FromHours(1));
                                _logger.LogInformation("Worker: Đã cập nhật biểu đồ lương mới vào cache.");
                            }

                            // ====================================================
                            // LẤY MA TRẬN LƯƠNG
                            // ====================================================
                            var matrixResponse = await _httpClient.GetAsync($"{_pythonBaseUrl}/api/analytics/salary-matrix", stoppingToken);
                            if (matrixResponse.IsSuccessStatusCode)
                            {
                                var matrixData = await matrixResponse.Content.ReadFromJsonAsync<object>(cancellationToken: stoppingToken);
                                _cache.Set("SalaryMatrix", matrixData, TimeSpan.FromMinutes(30));
                                _logger.LogInformation("Worker: Đã cập nhật Ma trận lương từ AI Service ngầm.");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Worker: Đã xảy ra lỗi khi xử lý dữ liệu lương.");
                }

                // Chạy lại sau mỗi 30 phút để cập nhật số liệu mới nhất
                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
            }
        }
    }
}