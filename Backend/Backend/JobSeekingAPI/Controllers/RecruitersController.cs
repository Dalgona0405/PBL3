using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecruitersController : ControllerBase
    {
        private readonly IRecruiterRepository _recruiterRepository;
        private readonly ICompanyRepository _companyRepository;

        public RecruitersController(IRecruiterRepository recruiterRepository, ICompanyRepository companyRepository)
        {
            _recruiterRepository = recruiterRepository;
            _companyRepository = companyRepository;
        }

        // GET: api/recruiters => Cân nhắc bỏ
        [HttpGet]
        public async Task<IActionResult> GetAllRecruiters()
        {
            var recruiters = await _recruiterRepository.GetAllRecruitersWithDetailsAsync();
            var dtos = recruiters.Select(r => MapToDTO(r));
            return Ok(dtos);
        }

        // GET: api/recruiters/me => Lấy thông tin recruiter hiện tại (dựa trên UserId trong token)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRecruiterById(int id)
        {
            var recruiter = await _recruiterRepository.GetRecruiterDetailByIdAsync(id);
            if (recruiter == null)
                return NotFound(new { message = "Recruiter not found" });
            return Ok(recruiter);
        }

        // GET: api/recruiters/company/{companyId}
        [HttpGet("company/{companyId}")]
        public async Task<IActionResult> GetRecruitersByCompany(int companyId)
        {
            var companyExists = await _companyRepository.GetByIdAsync(companyId);
            if (companyExists == null) 
                return NotFound(new { message = "Company not found!" });

            var recruiters = await _recruiterRepository.GetRecruitersByCompanyAsync(companyId);
            var dtos = recruiters.Select(r => new RecruiterSummaryDTO
            {
                UserId = r.UserId,
                FullName = r.User?.FullName ?? "Unknown",
                Email = r.User?.Email ?? "Unknown",
                Position = r.Position
            });
            return Ok(dtos);
        }

        // POST: api/recruiters
        //[HttpPost]
        //public async Task<IActionResult> CreateRecruiter([FromBody] CreateRecruiterDTO createRecruiterDto)
        //{
        //    if (!ModelState.IsValid)
        //        return BadRequest(ModelState);

        //    var user = await _context.Users
        //        .FirstOrDefaultAsync(u => u.UserId == createRecruiterDto.UserId && u.DeletedAt == null);

        //    if (user == null)
        //        return NotFound("User not found");

        //    var company = await _context.Companies
        //        .FirstOrDefaultAsync(c => c.CompanyId == createRecruiterDto.CompanyId && c.DeletedAt == null);

        //    if (company == null)
        //        return NotFound("Company not found");

        //    var existingRecruiter = await _context.Recruiters
        //        .AnyAsync(r => r.UserId == createRecruiterDto.UserId);

        //    if (existingRecruiter)
        //        return BadRequest("Recruiter already exists for this user");

        //    user.Role = "Recruiter";

        //    // ✅ ĐÃ SỬA: Cập nhật FullName và Avatar cho User
        //    if (!string.IsNullOrWhiteSpace(createRecruiterDto.FullName))
        //    {
        //        user.FullName = createRecruiterDto.FullName;
        //    }
        //    if (!string.IsNullOrWhiteSpace(createRecruiterDto.Avatar))
        //    {
        //        user.Avatar = createRecruiterDto.Avatar;
        //    }

        //    // Tạo Recruiter mới (Chỉ chứa thông tin công việc)
        //    var recruiter = new Recruiter
        //    {
        //        UserId = createRecruiterDto.UserId,
        //        CompanyId = createRecruiterDto.CompanyId,
        //        Position = createRecruiterDto.Position
        //    };

        //    _context.Recruiters.Add(recruiter);
        //    await _context.SaveChangesAsync();

        //    var recruiterDto = new RecruiterDetailDTO
        //    {
        //        UserId = recruiter.UserId,
        //        Position = recruiter.Position,
        //        // ✅ ĐÃ SỬA: Lấy lại từ user
        //        FullName = user.FullName,
        //        Avatar = user.Avatar,
        //        Email = user.Email,
        //        Company = new CompanySummaryDTO
        //        {
        //            CompanyId = company.CompanyId,
        //            CompanyName = company.CompanyName,
        //            LogoImg = company.LogoImg,
        //            Website = company.Website
        //        }
        //    };

        //    return CreatedAtAction(nameof(GetRecruiterById), new { id = recruiter.UserId }, recruiterDto);
        //}

        // PUT: api/recruiters/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRecruiter(int id, [FromBody] UpdateRecruiterDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingRecruiter = await _recruiterRepository.GetRecruiterEntityByIdAsync(id);
            if (existingRecruiter == null)
                return NotFound("Recruiter not found");

            if (existingRecruiter.User != null)
            {
                existingRecruiter.User.FullName = dto.FullName ?? existingRecruiter.User.FullName;
                existingRecruiter.User.Avatar = dto.Avatar ?? existingRecruiter.User.Avatar;
            }

            // Update Recruiter
            existingRecruiter.Position = dto.Position ?? existingRecruiter.Position;

            if (dto.CompanyId.HasValue && dto.CompanyId != existingRecruiter.CompanyId)
            {
                var companyExists = await _companyRepository.GetByIdAsync(dto.CompanyId.Value);
                if (companyExists == null) return BadRequest(new { message = "New company does not exist!" });
                existingRecruiter.CompanyId = dto.CompanyId.Value;
            }

            await _recruiterRepository.UpdateAsync(existingRecruiter);
            return Ok(new { message = "Update success" });
        }

        // DELETE: api/recruiters/{id}
        //[HttpDelete("{id}")]
        //public async Task<IActionResult> DeleteRecruiter(int id)
        //{
        //    var recruiter = await _context.Recruiters
        //        .Include(r => r.User)
        //        .FirstOrDefaultAsync(r => r.UserId == id);

        //    if (recruiter == null)
        //        return NotFound("Recruiter not found");

        //    if (recruiter.User != null)
        //    {
        //        recruiter.User.DeletedAt = DateTime.Now;
        //    }

        //    _context.Recruiters.Remove(recruiter);
        //    await _context.SaveChangesAsync();

        //    return NoContent();
        //}

        // GET: api/recruiters/{id}/jobs
        //[HttpGet("{id}/jobs")]
        //public async Task<IActionResult> GetRecruiterJobs(int id)
        //{
        //    var recruiter = await _context.Recruiters
        //        .Include(r => r.Company)
        //        .FirstOrDefaultAsync(r => r.UserId == id);

        //    if (recruiter == null)
        //        return NotFound("Recruiter not found");

        //    var jobs = await _context.Jobs
        //        .Include(j => j.Location)
        //        .Include(j => j.Company)
        //        .Include(j => j.JobTags).ThenInclude(jt => jt.Tag)
        //        .Where(j => j.CompanyId == recruiter.CompanyId && j.DeletedAt == null)
        //        .OrderByDescending(j => j.PostedDate)
        //        .Select(j => new JobResponseDTO
        //        {
        //            JobId = j.JobId,
        //            Title = j.Title,
        //            SalaryMin = j.SalaryMin,
        //            SalaryMax = j.SalaryMax,
        //            ExpYear = j.ExpYear,
        //            Level = j.Level,
        //            PostedDate = j.PostedDate,
        //            Deadline = j.Deadline,
        //            Description = j.Description,
        //            Requirement = j.Requirement,
        //            Benefits = j.Benefits,
        //            Address = j.Address,
        //            ViewCount = j.ViewCount ?? 0,
        //            Company = j.Company == null ? null : new CompanySummaryDTO
        //            {
        //                CompanyId = j.Company.CompanyId,
        //                CompanyName = j.Company.CompanyName,
        //                LogoImg = j.Company.LogoImg,
        //                Website = j.Company.Website
        //            },
        //            Location = j.Location == null ? null : new LocationSummaryDTO
        //            {
        //                LocationId = j.Location.LocationId,
        //                LocationName = j.Location.LocationName
        //            },
        //            Tags = j.JobTags
        //                .Where(jt => jt.Tag != null)
        //                .Select(jt => new TagSummaryDTO
        //                {
        //                    TagId = jt.Tag!.TagId,
        //                    TagName = jt.Tag!.TagName,
        //                    Type = jt.Tag!.Type
        //                }).ToList(),
        //            ApplicationCount = j.Applications.Count(a => a.DeletedAt == null)
        //        })
        //        .ToListAsync();

        //    return Ok(jobs);
        //}

        private RecruiterDetailDTO MapToDTO(Recruiter r)
        {
            return new RecruiterDetailDTO
            {
                UserId = r.UserId,
                FullName = r.User?.FullName ?? "Unknown",
                Email = r.User?.Email ?? "Unknown",
                Avatar = r.User?.Avatar,
                Position = r.Position,
                LastLogin = r.User?.LastLogin,

                Company = r.Company == null ? null : new CompanySummaryDTO
                {
                    CompanyId = r.Company.CompanyId,
                    CompanyName = r.Company.CompanyName,
                    LogoImg = r.Company.LogoImg,
                    Website = r.Company.Website
                },

                Jobs = r.Company?.Jobs?.Select(j => new JobSummaryDTO
                {
                    JobId = j.JobId,
                    Title = j.Title,
                    SalaryMin = j.SalaryMin,
                    SalaryMax = j.SalaryMax,
                    LocationName = j.Location?.LocationName,
                    Deadline = j.Deadline
                }).ToList() ?? new List<JobSummaryDTO>()
            };
        }
    }
}