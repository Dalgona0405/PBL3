using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecruitersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RecruitersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/recruiters
        [HttpGet]
        public async Task<IActionResult> GetAllRecruiters()
        {
            var recruiters = await _context.Recruiters
                .Include(r => r.User)
                .Include(r => r.Company)
                .Where(r => r.User != null && r.User.DeletedAt == null)
                .Select(r => new RecruiterDetailDTO
                {
                    UserId = r.UserId,
                    Position = r.Position,
                    // ✅ ĐÃ SỬA: Lấy FullName và Avatar từ User
                    FullName = r.User != null ? r.User.FullName : "",
                    Avatar = r.User != null ? r.User.Avatar : null,

                    Email = r.User != null ? r.User.Email : "",
                    LastLogin = r.User != null ? r.User.LastLogin : null,
                    Company = r.Company == null ? null : new CompanySummaryDTO
                    {
                        CompanyId = r.Company.CompanyId,
                        CompanyName = r.Company.CompanyName,
                        LogoImg = r.Company.LogoImg,
                        Website = r.Company.Website
                    }
                })
                .ToListAsync();

            return Ok(recruiters);
        }

        // GET: api/recruiters/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRecruiterById(int id)
        {
            var recruiter = await _context.Recruiters
                .Include(r => r.User)
                .Include(r => r.Company!)
                    .ThenInclude(c => c.Jobs.Where(j => j.DeletedAt == null))
                        .ThenInclude(j => j.Location)
                .Include(r => r.Company!)
                    .ThenInclude(c => c.Jobs.Where(j => j.DeletedAt == null))
                        .ThenInclude(j => j.JobTags)
                        .ThenInclude(jt => jt.Tag)
                .Where(r => r.UserId == id && r.User != null && r.User.DeletedAt == null)
                .Select(r => new RecruiterDetailDTO
                {
                    UserId = r.UserId,
                    Position = r.Position,
                    // ✅ ĐÃ SỬA: Lấy FullName và Avatar từ User
                    FullName = r.User != null ? r.User.FullName : "",
                    Avatar = r.User != null ? r.User.Avatar : null,

                    Email = r.User != null ? r.User.Email : "",
                    LastLogin = r.User != null ? r.User.LastLogin : null,

                    Company = r.Company == null ? null : new CompanyDetailDTO
                    {
                        CompanyId = r.Company.CompanyId,
                        CompanyName = r.Company.CompanyName,
                        LogoImg = r.Company.LogoImg,
                        Website = r.Company.Website,
                        Size = r.Company.Size,
                        JobCount = r.Company.Jobs.Count,
                        Jobs = r.Company.Jobs
                            .OrderByDescending(j => j.PostedDate)
                            .Take(5)
                            .Select(j => new JobSummaryDTO
                            {
                                JobId = j.JobId,
                                Title = j.Title,
                                SalaryMin = j.SalaryMin,
                                SalaryMax = j.SalaryMax,
                                ExpYear = j.ExpYear,
                                Level = j.Level,
                                CompanyName = r.Company.CompanyName,
                                LocationName = j.Location != null ? j.Location.LocationName : "",
                                PostedDate = j.PostedDate,
                                Deadline = j.Deadline,
                                Status = j.DeletedAt == null ? "Active" : "Closed"
                            }).ToList()
                    }
                })
                .FirstOrDefaultAsync();

            if (recruiter == null)
                return NotFound("Recruiter not found");

            return Ok(recruiter);
        }

        // POST: api/recruiters
        [HttpPost]
        public async Task<IActionResult> CreateRecruiter([FromBody] CreateRecruiterDTO createRecruiterDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == createRecruiterDto.UserId && u.DeletedAt == null);

            if (user == null)
                return NotFound("User not found");

            var company = await _context.Companies
                .FirstOrDefaultAsync(c => c.CompanyId == createRecruiterDto.CompanyId && c.DeletedAt == null);

            if (company == null)
                return NotFound("Company not found");

            var existingRecruiter = await _context.Recruiters
                .AnyAsync(r => r.UserId == createRecruiterDto.UserId);

            if (existingRecruiter)
                return BadRequest("Recruiter already exists for this user");

            user.Role = "Recruiter";

            // ✅ ĐÃ SỬA: Cập nhật FullName và Avatar cho User
            if (!string.IsNullOrWhiteSpace(createRecruiterDto.FullName))
            {
                user.FullName = createRecruiterDto.FullName;
            }
            if (!string.IsNullOrWhiteSpace(createRecruiterDto.Avatar))
            {
                user.Avatar = createRecruiterDto.Avatar;
            }

            // Tạo Recruiter mới (Chỉ chứa thông tin công việc)
            var recruiter = new Recruiter
            {
                UserId = createRecruiterDto.UserId,
                CompanyId = createRecruiterDto.CompanyId,
                Position = createRecruiterDto.Position
            };

            _context.Recruiters.Add(recruiter);
            await _context.SaveChangesAsync();

            var recruiterDto = new RecruiterDetailDTO
            {
                UserId = recruiter.UserId,
                Position = recruiter.Position,
                // ✅ ĐÃ SỬA: Lấy lại từ user
                FullName = user.FullName,
                Avatar = user.Avatar,
                Email = user.Email,
                Company = new CompanySummaryDTO
                {
                    CompanyId = company.CompanyId,
                    CompanyName = company.CompanyName,
                    LogoImg = company.LogoImg,
                    Website = company.Website
                }
            };

            return CreatedAtAction(nameof(GetRecruiterById), new { id = recruiter.UserId }, recruiterDto);
        }

        // PUT: api/recruiters/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRecruiter(int id, [FromBody] UpdateRecruiterDTO updateRecruiterDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingRecruiter = await _context.Recruiters
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.UserId == id);

            if (existingRecruiter == null)
                return NotFound("Recruiter not found");

            // Update Recruiter
            existingRecruiter.Position = updateRecruiterDto.Position ?? existingRecruiter.Position;

            if (updateRecruiterDto.CompanyId.HasValue)
            {
                var company = await _context.Companies
                    .FirstOrDefaultAsync(c => c.CompanyId == updateRecruiterDto.CompanyId && c.DeletedAt == null);

                if (company == null)
                    return NotFound("Company not found");

                existingRecruiter.CompanyId = updateRecruiterDto.CompanyId.Value;
            }

            // ✅ ĐÃ SỬA: Update FullName và Avatar vào bảng User
            if (existingRecruiter.User != null)
            {
                if (!string.IsNullOrWhiteSpace(updateRecruiterDto.FullName))
                {
                    existingRecruiter.User.FullName = updateRecruiterDto.FullName;
                }
                if (!string.IsNullOrWhiteSpace(updateRecruiterDto.Avatar))
                {
                    existingRecruiter.User.Avatar = updateRecruiterDto.Avatar;
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/recruiters/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRecruiter(int id)
        {
            var recruiter = await _context.Recruiters
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.UserId == id);

            if (recruiter == null)
                return NotFound("Recruiter not found");

            if (recruiter.User != null)
            {
                recruiter.User.DeletedAt = DateTime.Now;
            }

            _context.Recruiters.Remove(recruiter);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/recruiters/company/{companyId}
        [HttpGet("company/{companyId}")]
        public async Task<IActionResult> GetRecruitersByCompany(int companyId)
        {
            var recruiters = await _context.Recruiters
                .Include(r => r.User)
                .Where(r => r.CompanyId == companyId && r.User != null && r.User.DeletedAt == null)
                .Select(r => new RecruiterSummaryDTO
                {
                    UserId = r.UserId,
                    Position = r.Position,
                    // ✅ ĐÃ SỬA: Lấy FullName và Avatar từ User
                    FullName = r.User != null ? r.User.FullName : "",
                    Avatar = r.User != null ? r.User.Avatar : null,
                    Email = r.User != null ? r.User.Email : ""
                })
                .ToListAsync();

            return Ok(recruiters);
        }

        // GET: api/recruiters/{id}/jobs
        [HttpGet("{id}/jobs")]
        public async Task<IActionResult> GetRecruiterJobs(int id)
        {
            var recruiter = await _context.Recruiters
                .Include(r => r.Company)
                .FirstOrDefaultAsync(r => r.UserId == id);

            if (recruiter == null)
                return NotFound("Recruiter not found");

            var jobs = await _context.Jobs
                .Include(j => j.Location)
                .Include(j => j.Company)
                .Include(j => j.JobTags).ThenInclude(jt => jt.Tag)
                .Where(j => j.CompanyId == recruiter.CompanyId && j.DeletedAt == null)
                .OrderByDescending(j => j.PostedDate)
                .Select(j => new JobResponseDTO
                {
                    JobId = j.JobId,
                    Title = j.Title,
                    SalaryMin = j.SalaryMin,
                    SalaryMax = j.SalaryMax,
                    ExpYear = j.ExpYear,
                    Level = j.Level,
                    PostedDate = j.PostedDate,
                    Deadline = j.Deadline,
                    Description = j.Description,
                    Requirement = j.Requirement,
                    Benefits = j.Benefits,
                    Address = j.Address,
                    ViewCount = j.ViewCount ?? 0,
                    Company = j.Company == null ? null : new CompanySummaryDTO
                    {
                        CompanyId = j.Company.CompanyId,
                        CompanyName = j.Company.CompanyName,
                        LogoImg = j.Company.LogoImg,
                        Website = j.Company.Website
                    },
                    Location = j.Location == null ? null : new LocationSummaryDTO
                    {
                        LocationId = j.Location.LocationId,
                        LocationName = j.Location.LocationName
                    },
                    Tags = j.JobTags
                        .Where(jt => jt.Tag != null)
                        .Select(jt => new TagSummaryDTO
                        {
                            TagId = jt.Tag!.TagId,
                            TagName = jt.Tag!.TagName,
                            Type = jt.Tag!.Type
                        }).ToList(),
                    ApplicationCount = j.Applications.Count(a => a.DeletedAt == null)
                })
                .ToListAsync();

            return Ok(jobs);
        }

        private bool RecruiterExists(int id)
        {
            return _context.Recruiters.Any(e => e.UserId == id);
        }
    }
}