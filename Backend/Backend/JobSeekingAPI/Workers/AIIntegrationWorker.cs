using Microsoft.Extensions.Caching.Memory;
using System.Net.Http.Json;

public class AIIntegrationWorker : BackgroundService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AIIntegrationWorker> _logger;

    public AIIntegrationWorker(HttpClient httpClient, IMemoryCache cache, ILogger<AIIntegrationWorker> logger)
    {
        _httpClient = httpClient;
        _cache = cache;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Gọi sang Python lấy Ma trận lương[cite: 2]
                var response = await _httpClient.GetAsync("http://localhost:8000/api/analytics/salary-matrix", stoppingToken);
                if (response.IsSuccessStatusCode)
                {
                    var data = await response.Content.ReadFromJsonAsync<object>(cancellationToken: stoppingToken);
                    // Lưu vào RAM với Key là "SalaryMatrix"
                    _cache.Set("SalaryMatrix", data, TimeSpan.FromMinutes(30));
                    _logger.LogInformation("Đã cập nhật Ma trận lương từ AI Service ngầm.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi Worker AI: {ex.Message}");
            }

            // Chạy lại sau mỗi 30 phút để cập nhật dữ liệu mới
            await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
        }
    }
}