using Microsoft.AspNetCore.Mvc;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CandidatesController : ControllerBase
    {
        private readonly ICandidateRepository _candidateRepository;

        public CandidatesController(ICandidateRepository candidateRepository)
        {
            _candidateRepository = candidateRepository;
        }

        // GET: api/candidates
        [HttpGet]
        public async Task<IActionResult> GetAllCandidates()
        {
            var candidates = await _candidateRepository.GetAllCandidatesWithDetailsAsync();
            return Ok(candidates.Select(c => MapToDetailDTO(c)));
        }

        // GET: api/candidates/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCandidateById(int id)
        {
            var candidate = await _candidateRepository.GetCandidateDetailByIdAsync(id);
            if (candidate == null)
                return NotFound(new { message = "Candidate not found" });
            return Ok(MapToDetailDTO(candidate));
        }

        // PUT: api/candidates/{id} - Cập nhật thông tin profile
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCandidateProfile(int id, [FromBody] UpdateCandidateDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingCandidate = await _candidateRepository.GetCandidateEntityByIdAsync(id);
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

            await _candidateRepository.UpdateAsync(existingCandidate);

            // Cập nhật riêng các kỹ năng (nếu có gửi lên)
            if (dto.Tags != null)
            {
                await _candidateRepository.UpdateCandidateTagsAsync(id, dto.Tags);
            }

            return Ok(new { message = "Candidate profile updated successfully." });
        }

        // GET: api/candidates/search
        [HttpGet("search")]
        public async Task<IActionResult> SearchCandidates([FromQuery] string? keyword, [FromQuery] int? tagId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _candidateRepository.SearchCandidatesAsync(keyword, tagId, page, pageSize);
            return Ok(result);
        }

        // API VỀ EXPERIENCE
        // GET: api/candidates/{id}/experiences
        [HttpGet("{id}/experiences")]
        public async Task<IActionResult> GetExperiences(int id)
        {
            var experiences = await _candidateRepository.GetExperiencesByCandidateIdAsync(id);
            return Ok(experiences.Select(e => MapExperienceToDTO(e)));
        }

        // POST: api/candidates/{id}/experiences
        [HttpPost("{id}/experiences")]
        public async Task<IActionResult> AddExperience(int id, [FromBody] CreateExperienceDTO dto)
        {
            if (id != dto.UserId) return BadRequest("User ID mismatch.");

            var experience = new Experience
            {
                UserId = id,
                JobTitle = dto.JobTitle,
                CompanyName = dto.CompanyName,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Description = dto.Description
            };
            var created = await _candidateRepository.AddExperienceAsync(experience);
            return CreatedAtAction(nameof(GetExperiences), new { id = id }, MapExperienceToDTO(created));
        }

        // CÁC API VỀ SKILLS
        // GET: api/candidates/{id}/skills
        [HttpGet("{id}/skills")]
        public async Task<IActionResult> GetCandidateSkills(int id)
        {
            var skills = await _candidateRepository.GetTagsByCandidateIdAsync(id);
            var dtos = skills.Select(s => new {
                s.TagId,
                TagName = s.Tag?.TagName,
                s.Proficiency
            });
            return Ok(dtos);
        }

        // PUT: api/candidates/{id}/skills - Cập nhật toàn bộ skill
        [HttpPut("{id}/skills")]
        public async Task<IActionResult> UpdateCandidateSkills(int id, [FromBody] List<CandidateTagDTO> dtos)
        {
            await _candidateRepository.UpdateCandidateTagsAsync(id, dtos);
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

        private ExperienceDTO MapExperienceToDTO(Experience e)
        {
            return new ExperienceDTO
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