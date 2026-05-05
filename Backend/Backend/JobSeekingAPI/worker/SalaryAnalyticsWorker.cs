using Microsoft.Extensions.Caching.Memory;
using JobSeekingAPI.Data;
using Microsoft.EntityFrameworkCore;

public class SalaryAnalyticsWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;

    public SalaryAnalyticsWorker(IServiceScopeFactory scopeFactory, HttpClient httpClient, IMemoryCache cache)
    {
        _scopeFactory = scopeFactory;
        _httpClient = httpClient;
        _cache = cache;
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

                    // 2. Gửi sang Python xử lý ma trận[cite: 2]
                    var response = await _httpClient.PostAsJsonAsync("http://localhost:8000/api/analytics/salary-chart", new { jobs = rawSalaries }, stoppingToken);

                    if (response.IsSuccessStatusCode)
                    {
                        var chartResult = await response.Content.ReadFromJsonAsync<object>(cancellationToken: stoppingToken);
                        
                        // 3. Cất vào "tủ lạnh" Cache (Lưu trong 1 tiếng)
                        _cache.Set("CachedSalaryChart", chartResult, TimeSpan.FromHours(1));
                    }
                }
            }
            catch (Exception ex)
            {
                // Log lỗi nếu Python không phản hồi nhưng không làm sập App C#
            }

            // Chạy lại sau mỗi 30 phút để cập nhật số liệu mới nhất
            await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
        }
    }
}