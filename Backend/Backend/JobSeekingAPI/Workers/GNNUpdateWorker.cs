using Microsoft.Extensions.Caching.Memory;
using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Workers
{
    public class GNNUpdateWorker : BackgroundService
    {
        private readonly IMemoryCache _cache;
        private readonly ILogger<GNNUpdateWorker> _logger;
        private readonly HttpClient _httpClient;

        public GNNUpdateWorker(IMemoryCache cache, ILogger<GNNUpdateWorker> logger, HttpClient httpClient)
        {
            _cache = cache;
            _logger = logger;
            _httpClient = httpClient;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("GNN AI Worker đã khởi động.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Worker : Đang kiểm tra kết nối và lấy dữ liệu Đồ thị Kỹ năng từ Python AI...");
                    
                    var response = await _httpClient.GetAsync("http://localhost:8000/api/graph/predict-edges", stoppingToken);

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
                            _logger.LogInformation($"AI trả về {aiEdges.Count} liên kết. Đã lọc và lưu Top {filteredEdges.Count} vào RAM thành công.");
                        }
                        else
                        {
                            _logger.LogWarning($"[CẢNH BÁO] Python AI trả về mã lỗi: {response.StatusCode}. Hệ thống vẫn tiếp tục dùng dữ liệu cũ.");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"[LỖI CHƯA XÁC ĐỊNH] GNN Worker gặp sự cố: {ex.Message}");
                }
                
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }
}