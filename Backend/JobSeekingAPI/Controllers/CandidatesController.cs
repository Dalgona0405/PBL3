using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    /// <summary>
    /// Quản lý hồ sơ ứng viên, kinh nghiệm làm việc, kỹ năng, việc làm đã lưu và bóc tách CV bằng AI
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class CandidatesController : ControllerBase
    {
        private readonly ICandidateService _candidateService;
        private readonly IJobService _jobService;

        public CandidatesController(ICandidateService candidateService, IJobService jobService)
        {
            _candidateService = candidateService;
            _jobService = jobService;
        }

        /// <summary>
        /// Lấy thông tin chi tiết của một ứng viên theo UserId
        /// </summary>
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter + ", " + UserRoles.Company)]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCandidateById(int id)
        {
            var result = await _candidateService.GetCandidateByIdAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Lấy thông tin hồ sơ cá nhân của ứng viên đang đăng nhập
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate)]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            int userId = User.GetUserIdFromToken();
            var result = await _candidateService.GetCandidateByIdAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Cập nhật thông tin hồ sơ cá nhân của ứng viên đang đăng nhập
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate)]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateCandidateProfile([FromBody] UpdateCandidateDTO dto)
        {
            int userId = User.GetUserIdFromToken();
            await _candidateService.UpdateCandidateProfileAsync(userId, dto);
            return Ok(new { message = "Cập nhật hồ sơ ứng viên thành công." });
        }

        /// <summary>
        /// Tìm kiếm và lọc ứng viên theo từ khóa và kỹ năng (phân trang)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter + ", " + UserRoles.Company)]
        [HttpGet("search")]
        public async Task<IActionResult> SearchCandidates(
            [FromQuery] string? keyword,
            [FromQuery] int? tagId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _candidateService.SearchCandidatesAsync(keyword, tagId, page, pageSize);
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách kinh nghiệm làm việc của một ứng viên
        /// </summary>
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Recruiter + ", " + UserRoles.Company + ", " + UserRoles.Candidate)]
        [HttpGet("{id}/experiences")]
        public async Task<IActionResult> GetExperiences(int id)
        {
            var result = await _candidateService.GetExperiencesAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Thêm mới một mốc kinh nghiệm làm việc cho ứng viên hiện tại
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate)]
        [HttpPost("me/experiences")]
        public async Task<IActionResult> AddExperience([FromBody] CreateExperienceDTO dto)
        {
            int userId = User.GetUserIdFromToken();
            var created = await _candidateService.AddExperienceAsync(userId, dto);
            return CreatedAtAction(nameof(GetExperiences), new { id = userId }, created);
        }

        /// <summary>
        /// Cập nhật thông tin một mốc kinh nghiệm làm việc
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate)]
        [HttpPut("me/experiences/{expId}")]
        public async Task<IActionResult> UpdateExperience(int expId, [FromBody] UpdateExperienceDTO dto)
        {
            int userId = User.GetUserIdFromToken();
            var updated = await _candidateService.UpdateExperienceAsync(userId, expId, dto);
            return Ok(updated);
        }

        /// <summary>
        /// Xóa một mốc kinh nghiệm làm việc của ứng viên hiện tại
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate)]
        [HttpDelete("me/experiences/{expId}")]
        public async Task<IActionResult> DeleteExperience(int expId)
        {
            int userId = User.GetUserIdFromToken();
            await _candidateService.DeleteExperienceAsync(userId, expId);
            return NoContent();
        }

        /// <summary>
        /// Lấy danh sách kỹ năng (Tags) của một ứng viên
        /// </summary>
        [Authorize(Roles = UserRoles.Admin + ", " + UserRoles.Candidate + ", " + UserRoles.Recruiter + ", " + UserRoles.Company)]
        [HttpGet("{id}/skills")]
        public async Task<IActionResult> GetCandidateSkills(int id)
        {
            var result = await _candidateService.GetCandidateSkillsAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Cập nhật toàn bộ danh sách kỹ năng của ứng viên hiện tại
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate)]
        [HttpPut("me/skills")]
        public async Task<IActionResult> UpdateCandidateSkills([FromBody] List<CandidateTagDTO> dtos)
        {
            int userId = User.GetUserIdFromToken();
            await _candidateService.UpdateCandidateSkillsAsync(userId, dtos);
            return Ok(new { message = "Cập nhật danh sách kỹ năng thành công." });
        }

        /// <summary>
        /// Đặt đường dẫn CV mặc định cho ứng viên hiện tại
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate)]
        [HttpPatch("me/default-cv")]
        public async Task<IActionResult> UpdateDefaultCV([FromBody] UpdateDefaultCVDTO dto)
        {
            int userId = User.GetUserIdFromToken();
            var cvUrl = await _candidateService.UpdateDefaultCVAsync(userId, dto.CVUrl);
            return Ok(new { message = "Cập nhật CV mặc định thành công.", cvUrl });
        }

        /// <summary>
        /// Lấy danh sách tin tuyển dụng đã lưu (Bookmark) của ứng viên hiện tại
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate)]
        [HttpGet("me/saved-jobs")]
        public async Task<IActionResult> GetMySavedJobs()
        {
            int userId = User.GetUserIdFromToken();
            var savedJobs = await _jobService.GetSavedJobsAsync(userId);
            return Ok(savedJobs);
        }

        /// <summary>
        /// Tải lên tệp CV PDF và gọi AI Service tự động trích xuất thông tin hồ sơ
        /// </summary>
        [Authorize(Roles = UserRoles.Candidate)]
        [HttpPost("me/parse-cv")]
        public async Task<IActionResult> ParseResumePdf(IFormFile file, CancellationToken cancellationToken)
        {
            int userId = User.GetUserIdFromToken();
            var (data, storedCvUrl, aiSuccess) = await _candidateService.ParseResumePdfAsync(userId, file, cancellationToken);

            if (!aiSuccess)
            {
                return StatusCode(502, new
                {
                    message = "Dịch vụ AI Parse đang bận, nhưng tệp CV của bạn đã được tải lên thành công.",
                    cvUrl = storedCvUrl
                });
            }

            return Ok(data);
        }
    }
}
