// using JobSeekingAPI.Data;
// using JobSeekingAPI.Models;
// using Microsoft.EntityFrameworkCore;
// using System.Text.Json;

// namespace JobSeekingAPI.Workers
// {
//     // Kế thừa BackgroundService để .NET biết đây là tiến trình chạy ngầm
//     public class AISuggestionWorker : BackgroundService
//     {
//         private readonly IServiceProvider _serviceProvider;
//         private readonly ILogger<AISuggestionWorker> _logger;

//         // DI IServiceProvider vì BackgroundService là Singleton, 
//         // cần tạo Scope để gọi Scoped Services như DbContext
//         public AISuggestionWorker(IServiceProvider serviceProvider, ILogger<AISuggestionWorker> logger)
//         {
//             _serviceProvider = serviceProvider;
//             _logger = logger;
//         }

//         protected override async Task ExecuteAsync(CancellationToken stoppingToken)
//         {
//             _logger.LogInformation("🚀 Trợ lý AI Background Service đã khởi động!");

//             // Vòng lặp vô hạn chạy ngầm cho đến khi bạn tắt Server C#
//             while (!stoppingToken.IsCancellationRequested)
//             {
//                 try
//                 {
//                     await RunAIBatchJobAsync();
//                 }
//                 catch (Exception ex)
//                 {
//                     _logger.LogError(ex, "❌ Có lỗi xảy ra trong quá trình AI tính toán.");
//                 }

//                 // Hẹn giờ chạy lại. Để test nghiệm thu, bạn có thể để 1 phút (TimeSpan.FromMinutes(1))
//                 // Khi đem đi chấm điểm hoặc chạy thật, đổi thành 24 tiếng (TimeSpan.FromHours(24))
//                 _logger.LogInformation("💤 AI đi ngủ. Sẽ chạy lại vòng lặp sau...");
//                 await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken); 
//             }
//         }

//         private async Task RunAIBatchJobAsync()
//         {
//             _logger.LogInformation("⚙️ Đang tiến hành cập nhật AI Suggestions...");

//             // Mở một Scope mới để lấy DbContext và HttpClient
//             using var scope = _serviceProvider.CreateScope();
//             var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
//             var httpClient = scope.ServiceProvider.GetRequiredService<HttpClient>();

//             // 1. Lấy danh sách toàn bộ ID kỹ năng hiện có trong Database
//             var allSkillIds = await dbContext.Tags
//                 .Where(t => t.Type == "Skill" || t.Type == null)
//                 .Select(t => t.TagId)
//                 .ToListAsync();

//             if (!allSkillIds.Any()) return;

//             // Xóa dữ liệu dự báo cũ (của ngày hôm qua) để cập nhật dữ liệu mới
//             dbContext.SkillSuggestions.RemoveRange(dbContext.SkillSuggestions);
//             await dbContext.SaveChangesAsync();

//             var newSuggestions = new List<SkillSuggestion>();

//             // 2. Hỏi AI cho từng kỹ năng
//             foreach (var skillId in allSkillIds)
//             {
//                 // Gửi ID kỹ năng hiện tại sang Python
//                 var payload = new { current_skills = new List<int> { skillId } };
//                 var response = await httpClient.PostAsJsonAsync("http://localhost:8000/api/predict", payload);

//                 if (response.IsSuccessStatusCode)
//                 {
//                     var resultStr = await response.Content.ReadAsStringAsync();
//                     var aiResult = JsonSerializer.Deserialize<JsonElement>(resultStr);

//                     if (aiResult.TryGetProperty("suggestions", out var suggestionsElement))
//                     {
//                         // 3. Map kết quả trả về vào Model của C#
//                         foreach (var item in suggestionsElement.EnumerateArray())
//                         {
//                             newSuggestions.Add(new SkillSuggestion
//                             {
//                                 SourceSkillId = skillId,
//                                 SuggestedSkillId = item.GetProperty("skill_id").GetInt32(),
//                                 SuggestedSkillName = item.GetProperty("skill_name").GetString() ?? "",
//                                 MatchScore = item.GetProperty("score").GetDouble(),
//                                 GeneratedAt = DateTime.UtcNow
//                             });
//                         }
//                     }
//                 }
//             }

//             // 4. Lưu toàn bộ kết quả mới vào PostgreSQL cực nhanh
//             if (newSuggestions.Any())
//             {
//                 await dbContext.SkillSuggestions.AddRangeAsync(newSuggestions);
//                 await dbContext.SaveChangesAsync();
//                 _logger.LogInformation($"✅ Cập nhật thành công {newSuggestions.Count} gợi ý từ AI vào Database!");
//             }
//         }
//     }
// }