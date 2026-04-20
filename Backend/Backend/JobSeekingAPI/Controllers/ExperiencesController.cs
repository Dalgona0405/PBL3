//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using JobSeekingAPI.Data;
//using JobSeekingAPI.DTOs;
//using JobSeekingAPI.Models;
//using JobSeekingAPI.Services;

//namespace JobSeekingAPI.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class ExperiencesController : ControllerBase
//    {
//        private readonly ApplicationDbContext _context;

//        public ExperiencesController(ApplicationDbContext context)
//        {
//            _context = context;
//        }

//        // GET: api/experiences
//        [HttpGet]
//        public async Task<IActionResult> GetAllExperiences()
//        {
//            var experiences = await _context.Experiences
//                .Include(e => e.Candidate!)
//                    .ThenInclude(c => c.User)
//                .Where(e => e.Candidate != null && e.Candidate.User != null && e.Candidate.User.DeletedAt == null)
//                .OrderByDescending(e => e.StartDate)
//                .Select(static e => new ExperienceDTO
//                {
//                    ExpId = e.ExpId,
//                    UserId = e.UserId,
//                    JobTitle = e.JobTitle,
//                    CompanyName = e.CompanyName,
//                    StartDate = e.StartDate ?? DateTime.MinValue,
//                    EndDate = e.EndDate,
//                    Description = e.Description,
//                    CandidateName = e.Candidate != null ? e.Candidate.User.FullName : "",
//                    Duration = e.EndDate.HasValue 
//                        ? $"{e.EndDate.Value.Year - e.StartDate.Value.Year} years" 
//                        : $"{DateTime.Now.Year - e.StartDate.Value.Year} years (Current)"
//                })
//                .ToListAsync();
            
//            return Ok(experiences);
//        }

//        // GET: api/experiences/{id}
//        [HttpGet("{id}")]
//        public async Task<IActionResult> GetExperienceById(int id)
//        {
//            var experience = await _context.Experiences
//                .Include(e => e.Candidate!)
//                    .ThenInclude(c => c.User)
//                .Where(e => e.ExpId == id)
//                .Select(e => new ExperienceDTO
//                {
//                    ExpId = e.ExpId,
//                    UserId = e.UserId,
//                    JobTitle = e.JobTitle,
//                    CompanyName = e.CompanyName,
//                    StartDate = e.StartDate ?? DateTime.MinValue,
//                    EndDate = e.EndDate,
//                    Description = e.Description,
//                    CandidateName = e.Candidate != null ? e.Candidate.User.FullName : "",
//                    CandidateEmail = e.Candidate != null && e.Candidate.User != null ? e.Candidate.User.Email : ""
//                })
//                .FirstOrDefaultAsync();

//            if (experience == null)
//                return NotFound("Experience not found");

//            return Ok(experience);
//        }

//        // POST: api/experiences
//        [HttpPost]
//        public async Task<IActionResult> CreateExperience([FromBody] CreateExperienceDTO createExperienceDto)
//        {
//            if (!ModelState.IsValid)
//                return BadRequest(ModelState);

//            // Kiểm tra Candidate tồn tại
//            var candidate = await _context.Candidates
//                .FirstOrDefaultAsync(c => c.UserId == createExperienceDto.UserId);
            
//            if (candidate == null)
//                return NotFound("Candidate not found");

//            // Validate ngày tháng
//            if (createExperienceDto.EndDate.HasValue && 
//                createExperienceDto.EndDate.Value < createExperienceDto.StartDate)
//            {
//                return BadRequest("End date cannot be before start date");
//            }

//            var experience = new Experience
//            {
//                UserId = createExperienceDto.UserId,
//                JobTitle = createExperienceDto.JobTitle,
//                CompanyName = createExperienceDto.CompanyName,
//                StartDate = createExperienceDto.StartDate,
//                EndDate = createExperienceDto.EndDate,
//                Description = createExperienceDto.Description
//            };

//            _context.Experiences.Add(experience);
//            await _context.SaveChangesAsync();

//            var experienceDto = new ExperienceDTO
//            {
//                ExpId = experience.ExpId,
//                UserId = experience.UserId,
//                JobTitle = experience.JobTitle,
//                CompanyName = experience.CompanyName,
//                StartDate = (DateTime)experience.StartDate,
//                EndDate = experience.EndDate,
//                Description = experience.Description,
//                CandidateName = candidate.User.FullName
//            };

//            return CreatedAtAction(nameof(GetExperienceById), new { id = experience.ExpId }, experienceDto);
//        }

//        // PUT: api/experiences/{id}
//        [HttpPut("{id}")]
//        public async Task<IActionResult> UpdateExperience(int id, [FromBody] UpdateExperienceDTO updateExperienceDto)
//        {
//            if (!ModelState.IsValid)
//                return BadRequest(ModelState);

//            var existingExperience = await _context.Experiences.FindAsync(id);
//            if (existingExperience == null)
//                return NotFound("Experience not found");

//            // Validate ngày tháng
//            if (updateExperienceDto.EndDate.HasValue && 
//                updateExperienceDto.EndDate.Value < updateExperienceDto.StartDate)
//            {
//                return BadRequest("End date cannot be before start date");
//            }

//            existingExperience.JobTitle = updateExperienceDto.JobTitle ?? existingExperience.JobTitle;
//            existingExperience.CompanyName = updateExperienceDto.CompanyName ?? existingExperience.CompanyName;
//            existingExperience.StartDate = updateExperienceDto.StartDate ?? existingExperience.StartDate;
//            existingExperience.EndDate = updateExperienceDto.EndDate;
//            existingExperience.Description = updateExperienceDto.Description ?? existingExperience.Description;

//            await _context.SaveChangesAsync();
//            return NoContent();
//        }

//        // DELETE: api/experiences/{id}
//        [HttpDelete("{id}")]
//        public async Task<IActionResult> DeleteExperience(int id)
//        {
//            var experience = await _context.Experiences.FindAsync(id);
//            if (experience == null)
//                return NotFound("Experience not found");

//            _context.Experiences.Remove(experience);
//            await _context.SaveChangesAsync();

//            return NoContent();
//        }

//        // GET: api/experiences/candidate/{userId}
//        [HttpGet("candidate/{userId}")]
//        public async Task<IActionResult> GetExperiencesByCandidate(int userId)
//        {
//            var candidate = await _context.Candidates
//                .FirstOrDefaultAsync(c => c.UserId == userId);

//            if (candidate == null)
//                return NotFound("Candidate not found");

//            var experiences = await _context.Experiences
//                .Where(e => e.UserId == userId)
//                .OrderByDescending(e => e.StartDate)
//                .Select(e => new ExperienceDTO
//                {
//                    ExpId = e.ExpId,
//                    UserId = e.UserId,
//                    JobTitle = e.JobTitle,
//                    CompanyName = e.CompanyName,
//                    StartDate = e.StartDate ?? DateTime.MinValue,
//                    EndDate = e.EndDate,
//                    Description = e.Description,
//                    Duration = e.EndDate.HasValue 
//                        ? $"{e.EndDate.Value.Year - e.StartDate.Value.Year} years" 
//                        : $"{DateTime.Now.Year - e.StartDate.Value.Year} years (Current)"
//                })
//                .ToListAsync();

//            return Ok(experiences);
//        }

//        // GET: api/experiences/candidate/{userId}/current
//        [HttpGet("candidate/{userId}/current")]
//        public async Task<IActionResult> GetCurrentExperience(int userId)
//        {
//            var currentExperience = await _context.Experiences
//                .Where(e => e.UserId == userId && e.EndDate == null)
//                .OrderByDescending(e => e.StartDate)
//                .Select(e => new ExperienceDTO
//                {
//                    ExpId = e.ExpId,
//                    JobTitle = e.JobTitle,
//                    CompanyName = e.CompanyName,
//                    StartDate = e.StartDate ?? DateTime.MinValue,
//                    Description = e.Description
//                })
//                .FirstOrDefaultAsync();

//            return Ok(currentExperience);
//        }

//        // GET: api/experiences/candidate/{userId}/timeline
//        [HttpGet("candidate/{userId}/timeline")]
//        public async Task<IActionResult> GetExperienceTimeline(int userId)
//        {
//            var experiences = await _context.Experiences
//                .Where(e => e.UserId == userId)
//                .OrderByDescending(e => e.StartDate)
//                .Select(e => new
//                {
//                    e.ExpId,
//                    e.JobTitle,
//                    e.CompanyName,
//                    e.StartDate,
//                    e.EndDate,
//                    e.Description,
//                    TotalMonths = e.EndDate.HasValue 
//                        ? ((e.EndDate.Value.Year - e.StartDate.Value.Year) * 12 + e.EndDate.Value.Month - e.StartDate.Value.Month)
//                        : ((DateTime.Now.Year - e.StartDate.Value.Year) * 12 + DateTime.Now.Month - e.StartDate.Value.Month)
//                })
//                .ToListAsync();

//            var totalExperienceMonths = experiences.Sum(e => e.TotalMonths);
//            var totalYears = totalExperienceMonths / 12;
//            var totalMonths = totalExperienceMonths % 12;

//            return Ok(new
//            {
//                Experiences = experiences,
//                TotalExperience = $"{totalYears} years {totalMonths} months",
//                TotalExperienceMonths = totalExperienceMonths,
//                CurrentJob = experiences.FirstOrDefault(e => !e.EndDate.HasValue)
//            });
//        }
//    }
//}