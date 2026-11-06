using JobSeekingAPI.DTOs;
using Microsoft.Extensions.Caching.Memory;

namespace JobSeekingAPI.Workers
{
    public class GNNUpdateWorker : BackgroundService
    {
        private readonly IMemoryCache _cache;
        private readonly ILogger<GNNUpdateWorker> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _pythonBaeseUrl;

        public GNNUpdateWorker(IMemoryCache cache, ILogger<GNNUpdateWorker> logger, HttpClient httpClient, IConfiguration config)
        {
            _cache = cache;
            _logger = logger;
            _httpClient = httpClient;
            _pythonBaeseUrl = config["PythonAI:BaseUrl"] ?? "http://localhost:8000";

        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("GNN AI Worker started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Worker : Checking connection and fetching skill graph data from Python AI...");
                    
                    var response = await _httpClient.GetAsync($"{_pythonBaeseUrl}/api/graph/predict-edges", stoppingToken);

                    if (response.IsSuccessStatusCode)
                    {
                        var aiEdges = await response.Content.ReadFromJsonAsync<List<GraphEdgeDTO>>(cancellationToken: stoppingToken);
                        
                        if (aiEdges != null && aiEdges.Any())
                        {
                            // =========================================================
                            // LỌC DỮ LIỆU ĐỂ TRÁNH RỐI BIỂU ĐỒ (HAIRBALL)
                            // Sắp xếp theo Value (độ tin cậy) giảm dần và chỉ lấy Top 150
                            // =========================================================
                            var filteredEdges = aiEdges
                                .OrderByDescending(e => e.Value)
                                .Take(150)
                                .ToList();

                            // LƯU VÀO RAM thay vì Database
                            var cacheOptions = new MemoryCacheEntryOptions()
                                .SetAbsoluteExpiration(TimeSpan.FromHours(2));

                            // Chú ý: Ta lưu filteredEdges (đã lọc) thay vì aiEdges (chưa lọc)
                            _cache.Set("GnnSkillEdges", filteredEdges, cacheOptions);
                            
                            // Cập nhật lại Log để biết hệ thống đã lọc bớt bao nhiêu
                            _logger.LogInformation($"AI returned {aiEdges.Count} connections. Filtered and saved Top {filteredEdges.Count} to RAM successfully.");
                        }
                        else
                        {
                            _logger.LogWarning($"[CẢNH BÁO] Python AI returned error code: {response.StatusCode}. System will continue using old data.");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"[UNKNOWN ERROR] GNN Worker encountered a problem: {ex.Message}");
                }
                
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }
}