using JobSeekingAPI.Enums;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    /// <summary>
    /// Điều phối các tác vụ kích hoạt và huấn luyện mô hình AI gợi ý việc làm
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class AIController : ControllerBase
    {
        private readonly IMatchingService _matchingService;

        public AIController(IMatchingService matchingService)
        {
            _matchingService = matchingService;
        }

        // Chỉ Admin mới có quyền retrain AI!
        /// <summary>
        /// Kích hoạt AI tự động học lại dữ liệu mới (Chỉ dành cho Admin)
        /// </summary>
        /// <remarks>
        /// Quá trình này sẽ chạy ngầm (Background) bên server Python. 
        /// Không làm gián đoạn hệ thống. Thời gian hoàn thành khoảng 1-2 phút.
        /// </remarks>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpPost("retrain")]
        public async Task<IActionResult> RetrainAIModel()
        {
            await _matchingService.TriggerRetrainAsync();
            return Ok(new { message = "Lệnh huấn luyện AI đã được gửi thành công! AI đang cập nhật bản đồ sao." });
        }
    }
}
