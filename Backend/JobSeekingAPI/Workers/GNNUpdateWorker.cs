using JobSeekingAPI.DTOs;
using Microsoft.Extensions.Caching.Memory;

namespace JobSeekingAPI.Workers
{
    /// <summary>
    /// Background worker định kỳ lấy dữ liệu đồ thị kỹ năng dự đoán từ Python AI và lưu vào bộ nhớ đệm.
    /// </summary>
    public class GNNUpdateWorker : BackgroundService
    {
        private readonly IMemoryCache _cache;
        private readonly ILogger<GNNUpdateWorker> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _pythonBaseUrl;

        public GNNUpdateWorker(IMemoryCache cache, ILogger<GNNUpdateWorker> logger, HttpClient httpClient, IConfiguration config)
        {
            _cache = cache;
            _logger = logger;
            _httpClient = httpClient;
            _pythonBaseUrl = config["PythonAI:BaseUrl"] ?? "http://localhost:8000";

        }

        /// <summary>
        /// Thực thi vòng lặp định kỳ gọi dịch vụ Python AI để cập nhật top 150 cạnh đồ thị kỹ năng vào MemoryCache.
        /// </summary>
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("GNN AI Worker started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Worker: Checking connection and fetching skill graph data from Python AI...");

                    var response = await _httpClient.GetAsync($"{_pythonBaseUrl}/api/graph/predict-edges", stoppingToken);

                    if (response.IsSuccessStatusCode)
                    {
                        var aiEdges = await response.Content.ReadFromJsonAsync<List<GraphEdgeDTO>>(cancellationToken: stoppingToken);

                        if (aiEdges != null && aiEdges.Any())
                        {
                            // Giữ lại top 150 cạnh có trọng số cao nhất để tránh làm rối biểu đồ khi hiển thị
                            var filteredEdges = aiEdges
                                .OrderByDescending(e => e.Value)
                                .Take(150)
                                .ToList();

                            var cacheOptions = new MemoryCacheEntryOptions()
                                .SetAbsoluteExpiration(TimeSpan.FromHours(2));

                            _cache.Set("GnnSkillEdges", filteredEdges, cacheOptions);

                            _logger.LogInformation(
                                "AI returned {TotalCount} connections. Filtered and saved top {FilteredCount} to cache successfully.",
                                aiEdges.Count,
                                filteredEdges.Count);
                        }
                        else
                        {
                            _logger.LogWarning("Python AI returned no edges or unexpected status code: {StatusCode}. System will continue using cached data.", response.StatusCode);
                        }
                    }

                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "GNN Worker encountered an error while updating skill graph cache.");

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