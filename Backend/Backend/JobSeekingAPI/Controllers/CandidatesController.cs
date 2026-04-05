using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Services;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CandidatesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CandidatesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/candidates
        [HttpGet]
        public async Task<IActionResult> GetAllCandidates()
        {
            var candidates = await _context.Candidates
                .Include(c => c.User)
                .Include(c => c.Experiences)
                .Include(c => c.CandidateTags)
                    .ThenInclude(ct => ct.Tag)
                .Where(c => c.User != null && c.User.DeletedAt == null)
                .Select(c => new CandidateDetailDTO
                { 
                    UserId = c.UserId,
                    FullName = c.FullName,
                    Gender = c.Gender,
                    Birthday = c.Birthday,
                    Phone = c.Phone,
                    Address = c.Address,
                    CVUrl = c.CVUrl,
                    Skills = c.CandidateTags
                        .Where(ct => ct.Tag != null)
                        .Select(ct => ct.Tag!.TagName)
                        .ToList(),
                    Experiences = c.Experiences
                        .OrderByDescending(e => e.StartDate)
                        .Select(e => new ExperienceDTO
                        {
                            ExpId = e.ExpId,
                            JobTitle = e.JobTitle,
                            CompanyName = e.CompanyName,
                            StartDate = e.StartDate ?? DateTime.MinValue,
                            EndDate = e.EndDate,
                            Description = e.Description
                        }).ToList()
                })
                .ToListAsync();
            
            return Ok(candidates);
        }

        // GET: api/candidates/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCandidateById(int id)
        {
            // ✅ CÁCH 2: Dùng UserDetailDTO để trả về đầy đủ thông tin
            var user = await _context.Users
                .Include(u => u.Candidate)
                    .ThenInclude(c => c!.Experiences)
                .Include(u => u.Candidate)
                    .ThenInclude(c => c!.CandidateTags)
                    .ThenInclude(ct => ct.Tag)
                .Include(u => u.Candidate!)
                    .ThenInclude(c => c.Applications)
                    .ThenInclude(a => a.Job!)
                    .ThenInclude(j => j.Company)
                .Include(u => u.Candidate!)
                    .ThenInclude(c => c.Applications)
                    .ThenInclude(a => a.Job!)
                    .ThenInclude(j => j.Location)
                .Where(u => u.UserId == id && u.DeletedAt == null && u.Candidate != null)
                .Select(u => new UserDetailDTO
                {
                    UserId = u.UserId,
                    Email = u.Email,
                    FullName = u.Candidate!.FullName,
                    Phone = u.Candidate.Phone,
                    Address = u.Candidate.Address,
                    Role = u.Role,
                    LastLogin = u.LastLogin,
                    DeletedAt = u.DeletedAt,
                    
                    Candidate = new CandidateDetailDTO
                    {
                        UserId = u.Candidate.UserId,
                        FullName = u.Candidate.FullName,
                        Gender = u.Candidate.Gender,
                        Birthday = u.Candidate.Birthday,
                        Phone = u.Candidate.Phone,
                        Address = u.Candidate.Address,
                        CVUrl = u.Candidate.CVUrl,
                        Skills = u.Candidate.CandidateTags
                            .Where(ct => ct.Tag != null)
                            .Select(ct => ct.Tag!.TagName)
                            .ToList(),
                        Experiences = u.Candidate.Experiences
                            .OrderByDescending(e => e.StartDate)
                            .Select(e => new ExperienceDTO
                            {
                                ExpId = e.ExpId,
                                JobTitle = e.JobTitle,
                                CompanyName = e.CompanyName,
                                StartDate = e.StartDate ?? DateTime.MinValue,
                                EndDate = e.EndDate,
                                Description = e.Description
                            }).ToList()
                    },
                    
                    // ✅ Applications được đặt trong UserDetailDTO
                    Applications = u.Candidate.Applications
                        .Where(a => a.DeletedAt == null)
                        .OrderByDescending(a => a.AppliedDate)
                        .Select(a => new ApplicationResponseDTO
                        {
                            ApplicationId = a.AppId,
                            UserId = a.UserId,
                            JobId = a.JobId,
                            AppliedDate = a.AppliedDate,
                            Status = a.Status,
                            Job = a.Job == null ? null : new JobSummaryDTO
                            {
                                JobId = a.Job.JobId,
                                Title = a.Job.Title,
                                SalaryMin = a.Job.SalaryMin,
                                SalaryMax = a.Job.SalaryMax,
                                CompanyName = a.Job.Company != null ? a.Job.Company.CompanyName : "",
                                LocationName = a.Job.Location != null ? a.Job.Location.LocationName : "",
                                Deadline = a.Job.Deadline
                            }
                        }).ToList()
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound("Candidate not found");

            return Ok(user);
        }

        // POST: api/candidates
        [HttpPost]
        public async Task<IActionResult> CreateCandidate([FromBody] CreateCandidateDTO createCandidateDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Kiểm tra User tồn tại
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == createCandidateDto.UserId && u.DeletedAt == null);
            
            if (user == null)
                return NotFound("User not found");

            // Kiểm tra Candidate đã tồn tại chưa
            var existingCandidate = await _context.Candidates
                .AnyAsync(c => c.UserId == createCandidateDto.UserId);
            
            if (existingCandidate)
                return BadRequest("Candidate already exists for this user");

            // Tạo Candidate mới
            var candidate = new Candidate
            {
                UserId = createCandidateDto.UserId,
                FullName = createCandidateDto.FullName,
                Gender = createCandidateDto.Gender,
                Birthday = createCandidateDto.Birthday,
                Phone = createCandidateDto.Phone,
                Address = createCandidateDto.Address,
                CVUrl = createCandidateDto.CVUrl
            };

            _context.Candidates.Add(candidate);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCandidateById), new { id = candidate.UserId }, candidate);
        }

        // PUT: api/candidates/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCandidate(int id, [FromBody] UpdateCandidateDTO updateCandidateDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingCandidate = await _context.Candidates
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.UserId == id);
            
            if (existingCandidate == null)
                return NotFound("Candidate not found");

            // Cập nhật thông tin
            existingCandidate.FullName = updateCandidateDto.FullName ?? existingCandidate.FullName;
            existingCandidate.Gender = updateCandidateDto.Gender ?? existingCandidate.Gender;
            existingCandidate.Birthday = updateCandidateDto.Birthday ?? existingCandidate.Birthday;
            existingCandidate.Phone = updateCandidateDto.Phone ?? existingCandidate.Phone;
            existingCandidate.Address = updateCandidateDto.Address ?? existingCandidate.Address;
            existingCandidate.CVUrl = updateCandidateDto.CVUrl ?? existingCandidate.CVUrl;

            // Cập nhật Avatar trong User nếu có
            if (updateCandidateDto.Avatar != null && existingCandidate.User != null)
            {
                existingCandidate.User.Avatar = updateCandidateDto.Avatar;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/candidates/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCandidate(int id)
        {
            var candidate = await _context.Candidates
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.UserId == id);
            
            if (candidate == null)
                return NotFound("Candidate not found");

            // Soft delete User
            if (candidate.User != null)
            {
                candidate.User.DeletedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/candidates/{id}/applications
        [HttpGet("{id}/applications")]
        public async Task<IActionResult> GetCandidateApplications(int id)
        {
            var applications = await _context.Applications
                .Include(a => a.Job!)
                    .ThenInclude(j => j.Company)
                .Include(a => a.Job!)
                    .ThenInclude(j => j.Location)
                .Where(a => a.UserId == id && a.DeletedAt == null)
                .OrderByDescending(a => a.AppliedDate)
                .Select(a => new ApplicationResponseDTO
                {
                    ApplicationId = a.AppId,
                    UserId = a.UserId,
                    JobId = a.JobId,
                    AppliedDate = a.AppliedDate,
                    Status = a.Status,
                    Job = a.Job == null ? null : new JobSummaryDTO
                    {
                        JobId = a.Job.JobId,
                        Title = a.Job.Title,
                        SalaryMin = a.Job.SalaryMin,
                        SalaryMax = a.Job.SalaryMax,
                        CompanyName = a.Job.Company != null ? a.Job.Company.CompanyName : "",
                        LocationName = a.Job.Location != null ? a.Job.Location.LocationName : "",
                        Deadline = a.Job.Deadline
                    }
                })
                .ToListAsync();

            return Ok(applications);
        }

        // GET: api/candidates/search
        [HttpGet("search")]
        public async Task<IActionResult> SearchCandidates(
            [FromQuery] string? keyword,
            [FromQuery] int? tagId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _context.Candidates
                .Include(c => c.User)
                .Include(c => c.CandidateTags)
                    .ThenInclude(ct => ct.Tag)
                .Include(c => c.Experiences)
                .Where(c => c.User != null && c.User.DeletedAt == null)
                .AsQueryable();

            // Lọc theo keyword
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(c => 
                    c.FullName.ToLower().Contains(keyword) ||
                    (c.Phone != null && c.Phone.Contains(keyword)) ||
                    c.Experiences.Any(e => 
                        e.JobTitle.ToLower().Contains(keyword) ||
                        e.CompanyName.ToLower().Contains(keyword)));
            }

            // Lọc theo tag
            if (tagId.HasValue)
            {
                query = query.Where(c => c.CandidateTags.Any(ct => ct.TagId == tagId));
            }

            // Phân trang
            var totalCount = await query.CountAsync();
            var candidates = await query
                .OrderBy(c => c.FullName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CandidateSummaryDTO
                {
                    UserId = c.UserId,
                    FullName = c.FullName,
                    Avatar = c.User != null ? c.User.Avatar : null,
                    CVUrl = c.CVUrl,
                    Email = c.User != null ? c.User.Email : null,
                    Skills = c.CandidateTags
                        .Where(ct => ct.Tag != null)
                        .Select(ct => ct.Tag!.TagName)
                        .Take(5)
                        .ToList()
                })
                .ToListAsync();

            var result = new
            {
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Data = candidates
            };

            return Ok(result);
        }

        // POST: api/candidates/{id}/skills
        [HttpPost("{id}/skills")]
        public async Task<IActionResult> AddSkillToCandidate(int id, [FromBody] AddSkillDTO addSkillDto)
        {
            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.UserId == id);
            
            if (candidate == null)
                return NotFound("Candidate not found");

            // Kiểm tra Tag tồn tại
            var tag = await _context.Tags.FindAsync(addSkillDto.TagId);
            if (tag == null)
                return NotFound("Tag not found");

            // Kiểm tra đã có chưa
            var existing = await _context.CandidateTags
                .AnyAsync(ct => ct.UserId == id && ct.TagId == addSkillDto.TagId);
            
            if (existing)
                return BadRequest("Skill already added");

            var candidateTag = new CandidateTag
            {
                UserId = id,
                TagId = addSkillDto.TagId,
                Proficiency = addSkillDto.Proficiency
            };

            _context.CandidateTags.Add(candidateTag);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Skill added successfully" });
        }

        // DELETE: api/candidates/{id}/skills/{tagId}
        [HttpDelete("{id}/skills/{tagId}")]
        public async Task<IActionResult> RemoveSkillFromCandidate(int id, int tagId)
        {
            var candidateTag = await _context.CandidateTags
                .FirstOrDefaultAsync(ct => ct.UserId == id && ct.TagId == tagId);
            
            if (candidateTag == null)
                return NotFound("Skill not found");

            _context.CandidateTags.Remove(candidateTag);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CandidateExists(int id)
        {
            return _context.Candidates.Any(e => e.UserId == id);
        }
    }
}