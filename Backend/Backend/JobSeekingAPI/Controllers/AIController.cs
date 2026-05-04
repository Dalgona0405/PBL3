using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data; // Thêm dòng này để gọi ApplicationDbContext

namespace JobSeekingAPI.Controllers
{
    [Route("api/ai")]
    [ApiController]
    public class AIController : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private readonly ApplicationDbContext _context; // Thêm DbContext

        // Tiêm (Inject) thêm ApplicationDbContext vào Constructor
        public AIController(HttpClient httpClient, ApplicationDbContext context)
        {
            _httpClient = httpClient;
            _context = context;
        }

        // =================================================================
        // 1. API CŨ: Dùng để gọi Python dự đoán tức thì (Real-time Inference)
        // Dành cho nút bấm "Khám phá bằng AI" ở giao diện trang chủ
        // =================================================================
        [HttpPost("suggest-skills")]
        public async Task<IActionResult> SuggestSkills([FromBody] List<int> currentSkillIds)
        {
            try
            {
                var requestData = new { current_skills = currentSkillIds };
                var response = await _httpClient.PostAsJsonAsync("http://localhost:8000/api/predict", requestData);

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<object>();
                    return Ok(result); 
                }
                return StatusCode((int)response.StatusCode, new { message = "AI Service (Python) xử lý thất bại." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Không thể kết nối tới AI Server: " + ex.Message });
            }
        }

        // =================================================================
        // 2. API MỚI: Dùng để lấy kết quả đã chạy ngầm (Batch Processing)
        // Gọi thẳng vào PostgreSQL cực nhanh (tính bằng mili-giây)
        // =================================================================
        [HttpGet("suggestions/{skillId}")]
        public async Task<IActionResult> GetPreCalculatedSuggestions(int skillId)
        {
            try
            {
                // Lấy từ PostgreSQL các dự báo có điểm cao nhất cho kỹ năng này
                var suggestions = await _context.SkillSuggestions
                    .Where(s => s.SourceSkillId == skillId)
                    .OrderByDescending(s => s.MatchScore) // Sắp xếp điểm từ cao xuống thấp
                    .Take(5) // Lấy Top 5 là đẹp nhất cho UI
                    .Select(s => new
                    {
                        skill_id = s.SuggestedSkillId,
                        skill_name = s.SuggestedSkillName,
                        score = s.MatchScore
                    })
                    .ToListAsync();

                if (!suggestions.Any())
                {
                    // Trả về mảng rỗng thay vì báo lỗi để Frontend dễ vẽ UI
                    return Ok(new { status = "success", suggestions = new List<object>() });
                }

                return Ok(new
                {
                    status = "success",
                    suggestions = suggestions
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi đọc dữ liệu từ Database: " + ex.Message });
            }
        }
    }
}