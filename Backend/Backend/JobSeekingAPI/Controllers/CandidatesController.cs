using Microsoft.AspNetCore.Mvc;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using JobSeekingAPI.Helpers;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CandidatesController : ControllerBase
    {
        private readonly ICandidateRepository _candidateRepo;
        private readonly IExperienceRepository _experienceRepo;

        public CandidatesController(ICandidateRepository candidateRepo, IExperienceRepository experienceRepo)
        {
            _candidateRepo = candidateRepo;
            _experienceRepo = experienceRepo;
        }

        // GET: api/candidates => Cân nhắc bỏ hoặc giới hạn quyền truy cập (chỉ admin). Nếu giữ thì phân trang
        //[Authorize(Roles = "Admin")]
        //[HttpGet]
        //public async Task<IActionResult> GetAllCandidates()
        //{
        //    var candidates = await _candidateRepo.GetAllCandidatesWithDetailsAsync();
        //    return Ok(candidates.Select(c => MapToDetailDTO(c)));
        //}

        // GET: api/candidates/{id}
        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCandidateById(int id)
        {
            var candidate = await _candidateRepo.GetCandidateDetailByIdAsync(id);
            if (candidate == null)
                return NotFound(new { message = "Candidate not found" });
            return Ok(MapToDetailDTO(candidate));
        }

        // GET: api/candidates/me => Cân nhắc, nếu giữ thì cần xác thực người dùng và lấy ID từ token
        [Authorize(Roles = "Candidate")]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            int userId = User.GetUserIdFromToken();
            var candidate = await _candidateRepo.GetCandidateDetailByIdAsync(userId);
            if (candidate == null)
                return NotFound(new { message = "Candidate not found" });
            return Ok(MapToDetailDTO(candidate));
        }

        // PUT: api/candidates/me
        [Authorize(Roles = "Candidate")]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateCandidateProfile([FromBody] UpdateCandidateDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            int userId = User.GetUserIdFromToken();
            var existingCandidate = await _candidateRepo.GetCandidateEntityByIdAsync(userId);
            if (existingCandidate == null)
                return NotFound(new { message = "Candidate not found" });

            if (existingCandidate.User != null)
            {
                existingCandidate.User.FullName = dto.FullName ?? existingCandidate.User.FullName;
                existingCandidate.User.Avatar = dto.Avatar ?? existingCandidate.User.Avatar;
            }

            existingCandidate.Gender = dto.Gender ?? existingCandidate.Gender;
            existingCandidate.Birthday = dto.Birthday ?? existingCandidate.Birthday;
            existingCandidate.Phone = dto.Phone ?? existingCandidate.Phone;
            existingCandidate.Address = dto.Address ?? existingCandidate.Address;
            existingCandidate.CVUrl = dto.CVUrl ?? existingCandidate.CVUrl;

            await _candidateRepo.UpdateAsync(existingCandidate);

            // Cập nhật riêng các kỹ năng (nếu có gửi lên)
            if (dto.Tags != null)
            {
                await _candidateRepo.UpdateCandidateTagsAsync(userId, dto.Tags);
            }

            return Ok(new { message = "Candidate profile updated successfully." });
        }

        // GET: api/candidates/search
        [Authorize(Roles = "Admin, Recruiter")]
        [HttpGet("search")]
        public async Task<IActionResult> SearchCandidates([FromQuery] string? keyword, [FromQuery] int? tagId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _candidateRepo.SearchCandidatesAsync(keyword, tagId, page, pageSize);
            return Ok(result);
        }

        // API VỀ EXPERIENCE
        // GET: api/candidates/{id}/experiences
        [Authorize(Roles = "Admin, Recruiter, Candidate")]
        [HttpGet("{id}/experiences")]
        public async Task<IActionResult> GetExperiences(int id)
        {
            var experiences = await _experienceRepo.GetExperiencesByCandidateIdAsync(id);
            return Ok(experiences.Select(e => MapExperienceToDTO(e)));
        }

        // POST: /api/candidates/me/experiences
        [Authorize(Roles = "Candidate")]
        [HttpPost("me/experiences")]
        public async Task<IActionResult> AddExperience([FromBody] CreateExperienceDTO dto)
        {
            int userId = User.GetUserIdFromToken();
            if (userId != dto.UserId) return BadRequest("User ID mismatch.");
            var candidate = await _candidateRepo.GetCandidateEntityByIdAsync(userId);

            var experience = new Experience
            {
                UserId = userId,
                JobTitle = dto.JobTitle,
                CompanyName = dto.CompanyName,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Description = dto.Description
            };
            var created = await _experienceRepo.AddExperienceAsync(experience);
            return CreatedAtAction(nameof(GetExperiences), new { id = userId } , MapExperienceToDTO(created));
        }

        // PUT: api/candidates/me/experiences/{expId}
        [Authorize(Roles = "Candidate")]
        [HttpPut("me/experiences/{expId}")]
        public async Task<IActionResult> UpdateExperience(int expId, [FromBody] UpdateExperienceDTO dto)
        {
            int userId = User.GetUserIdFromToken();
            if (userId != dto.UserId) 
                return BadRequest("User ID mismatch.");
            var existing = await _experienceRepo.GetExperienceByIdAsync(expId);
            if (existing == null || existing.UserId != userId)
                return NotFound(new { message = "Experience not found" });
            existing.JobTitle = dto.JobTitle ?? existing.JobTitle;
            existing.CompanyName = dto.CompanyName ?? existing.CompanyName;
            existing.StartDate = dto.StartDate ?? existing.StartDate;
            existing.EndDate = dto.EndDate ?? existing.EndDate;
            existing.Description = dto.Description ?? existing.Description;
            await _experienceRepo.UpdateExperienceAsync(existing);
            return Ok(MapExperienceToDTO(existing));
        }

        // DELETE: api/candidates/me/experiences/{expId}
        [Authorize(Roles = "Candidate")]
        [HttpDelete("me/experiences/{expId}")]
        public async Task<IActionResult> DeleteExperience(int expId)
        {
            int userId = User.GetUserIdFromToken();
            var existing = await _experienceRepo.GetExperienceByIdAsync(expId);
            if (existing == null || existing.UserId != userId)
                return NotFound(new { message = "Experience not found" });
            await _experienceRepo.DeleteExperienceAsync(expId);
            return NoContent();
        }

        // CÁC API VỀ SKILLS
        // GET: api/candidates/{id}/skills => Cân nhắc
        [Authorize(Roles = "Admin, Candidate, Recruiter")]
        [HttpGet("{id}/skills")]
        public async Task<IActionResult> GetCandidateSkills(int id)
        {
            var skills = await _candidateRepo.GetTagsByCandidateIdAsync(id);
            var dtos = skills.Select(s => new {
                s.TagId,
                TagName = s.Tag?.TagName,
                s.Proficiency
            });
            return Ok(dtos);
        }

        // PUT: api/candidates/me/skills - Cập nhật toàn bộ skill của chính ứng viên
        [Authorize(Roles = "Candidate")]
        [HttpPut("me/skills")]
        public async Task<IActionResult> UpdateCandidateSkills([FromBody] List<CandidateTagDTO> dtos)
        {
            int userId = User.GetUserIdFromToken();
            await _candidateRepo.UpdateCandidateTagsAsync(userId, dtos);
            return Ok(new { message = "Skills updated successfully." });
        }


        // === Private Mapping Methods ===
        private CandidateDetailDTO MapToDetailDTO(Candidate c)
        {
            return new CandidateDetailDTO
            {
                UserId = c.UserId,
                FullName = c.User?.FullName ?? "",
                Gender = c.Gender,
                Birthday = c.Birthday,
                Phone = c.Phone,
                Address = c.Address,
                CVUrl = c.CVUrl,
                Skills = c.CandidateTags.Select(ct => ct.Tag?.TagName ?? "").ToList(),
                Experiences = c.Experiences.Select(e => MapExperienceToDTO(e)).ToList()
            };
        }

        private ExperienceDetailDTO MapExperienceToDTO(Experience e)
        {
            return new ExperienceDetailDTO
            {
                ExpId = e.ExpId,
                UserId = e.UserId,
                JobTitle = e.JobTitle,
                CompanyName = e.CompanyName,
                StartDate = e.StartDate ?? DateTime.MinValue,
                EndDate = e.EndDate,
                Description = e.Description
            };
        }
    }
}