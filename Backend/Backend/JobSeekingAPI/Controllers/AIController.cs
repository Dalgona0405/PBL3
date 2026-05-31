using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AIController : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private readonly string _pythonBaseUrl;

        // Tiêm HttpClient để C# có thể "gọi điện" sang Python
        public AIController(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            // Lấy số điện thoại của Python từ danh bạ (appsettings.json)
            _pythonBaseUrl = config["PythonAI:BaseUrl"] ?? "http://localhost:8000";
        }

        // Chỉ Admin mới có quyền bắt AI đi học!
        /// <summary>
        /// Kích hoạt AI tự động học lại dữ liệu mới (Chỉ dành cho Admin)
        /// </summary>
        /// <remarks>
        /// Quá trình này sẽ chạy ngầm (Background) bên server Python. 
        /// Không làm gián đoạn hệ thống. Thời gian hoàn thành khoảng 1-2 phút.
        /// </remarks>
        [Authorize(Roles = "Admin")]
        [HttpPost("retrain")]
        public async Task<IActionResult> RetrainAIModel()
        {
            try
            {
                // C# gọi điện sang Python qua đường dây POST
                var response = await _httpClient.PostAsync($"{_pythonBaseUrl}/api/train", null);
                
                if (response.IsSuccessStatusCode)
                {
                    return Ok(new { message = "Lệnh huấn luyện AI đã được gửi thành công! AI đang cập nhật bản đồ sao." });
                }
                
                return StatusCode(500, new { message = "AI Server từ chối yêu cầu. Vui lòng kiểm tra lại." });
            }
            catch (Exception ex)
            {
                // Bắt lỗi nếu Python chưa bật server
                return StatusCode(500, new { message = $"Không thể kết nối tới AI Server: {ex.Message}" });
            }
        }
    }
}