using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompaniesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CompaniesController(ApplicationDbContext context) 
        {
            _context = context;
        }

        // GET: api/companies
        [HttpGet]
        public async Task<IActionResult> GetAllCompanies()
        {
            var companies = await _context.Companies
                .Include(c => c.Jobs.Where(j => j.DeletedAt == null))
                    .ThenInclude(j => j.Location)
                .Include(c => c.Recruiters)
                    .ThenInclude(r => r.User)
                .Where(c => c.DeletedAt == null)
                .Select(c => new CompanySummaryDTO
                {
                    CompanyId = c.CompanyId,
                    CompanyName = c.CompanyName,
                    LogoImg = c.LogoImg,
                    Website = c.Website,
                    Size = c.Size,
                    JobCount = c.Jobs.Count,
                    // ✅ FIX 1: Dùng JobSummaryDTO thay vì JobResponseDTO
                    Job1 = c.Jobs
                        .OrderByDescending(j => j.PostedDate)
                        .Take(5)
                        .Select(j => new JobSummaryDTO
                        {
                            JobId = j.JobId,
                            Title = j.Title,
                            SalaryMin = j.SalaryMin,
                            SalaryMax = j.SalaryMax,
                            LocationName = j.Location != null ? j.Location.LocationName : "",
                            Deadline = j.Deadline
                        }).ToList()
                })
                .ToListAsync();
            
            return Ok(companies);
        }

        // GET: api/companies/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCompanyById(int id)
        {
            var company = await _context.Companies
                .Include(c => c.Jobs.Where(j => j.DeletedAt == null))
                    .ThenInclude(j => j.Location)
                .Include(c => c.Jobs)
                    .ThenInclude(j => j.JobTags)
                    .ThenInclude(jt => jt.Tag)
                .Include(c => c.Recruiters)
                    .ThenInclude(r => r.User)
                .Where(c => c.CompanyId == id && c.DeletedAt == null)
                .Select(c => new CompanyDetailDTO
                {
                    CompanyId = c.CompanyId,
                    CompanyName = c.CompanyName,
                    LogoImg = c.LogoImg,
                    Website = c.Website,
                    Size = c.Size,
                    
                    // ✅ FIX 2: JobResponseDTO là đúng cho Detail
                    Job2 = c.Jobs
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
                            CompanyId = j.CompanyId,
                            OriginalId = j.OriginalId,
                            Description = j.Description,
                            Requirement = j.Requirement,
                            Benefits = j.Benefits,
                            Address = j.Address,
                            ViewCount = j.ViewCount ?? 0,
                            // ✅ Thêm LocationName cho JobResponseDTO
                            LocationName = j.Location != null ? j.Location.LocationName : null,
                            Company = new CompanySummaryDTO
                            {
                                CompanyId = c.CompanyId,
                                CompanyName = c.CompanyName,
                                LogoImg = c.LogoImg,
                                Website = c.Website
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
                        }).ToList(),
                    
                    Recruiters = c.Recruiters
                        .Where(r => r.User != null && r.User.DeletedAt == null)
                        .Select(r => new RecruiterSummaryDTO
                        {
                            UserId = r.UserId,
                            FullName = r.User != null ? r.User.FullName : "",
                            Position = r.Position,
                            Avatar = r.User != null ? r.User.Avatar : null
                        }).ToList()
                })
                .FirstOrDefaultAsync();

            if (company == null)
                return NotFound("Company not found");

            return Ok(company);
        }

        // POST: api/companies
        [HttpPost]
        public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyDTO createCompanyDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var company = new Company
            {
                CompanyName = createCompanyDto.CompanyName,
                LogoImg = createCompanyDto.LogoImg,
                Website = createCompanyDto.Website,
                Size = createCompanyDto.Size
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            var companyDto = new CompanySummaryDTO
            {
                CompanyId = company.CompanyId,
                CompanyName = company.CompanyName,
                LogoImg = company.LogoImg,
                Website = company.Website,
                Size = company.Size
            };

            return CreatedAtAction(nameof(GetCompanyById), new { id = company.CompanyId }, companyDto);
        }

        // PUT: api/companies/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompany(int id, [FromBody] UpdateCompanyDTO updateCompanyDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingCompany = await _context.Companies
                .FirstOrDefaultAsync(c => c.CompanyId == id && c.DeletedAt == null);
            
            if (existingCompany == null)
                return NotFound("Company not found");

            existingCompany.CompanyName = updateCompanyDto.CompanyName ?? existingCompany.CompanyName;
            existingCompany.LogoImg = updateCompanyDto.LogoImg ?? existingCompany.LogoImg;
            existingCompany.Website = updateCompanyDto.Website ?? existingCompany.Website;
            existingCompany.Size = updateCompanyDto.Size ?? existingCompany.Size;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/companies/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompany(int id)
        {
            var company = await _context.Companies
                .Include(c => c.Jobs)
                .Include(c => c.Recruiters)
                    .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(c => c.CompanyId == id && c.DeletedAt == null);
            
            if (company == null)
                return NotFound("Company not found");

            // Kiểm tra có jobs active không
            if (company.Jobs.Any(j => j.DeletedAt == null))
                return BadRequest("Cannot delete company with active jobs");

            // Soft delete
            company.DeletedAt = DateTime.Now;
            
            // Soft delete recruiters
            foreach (var recruiter in company.Recruiters)
            {
                if (recruiter.User != null)
                {
                    recruiter.User.DeletedAt = DateTime.Now;
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // GET: api/companies/search
        [HttpGet("search")]
        public async Task<IActionResult> SearchCompanies(
            [FromQuery] string? keyword,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _context.Companies
                .Where(c => c.DeletedAt == null)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(c => c.CompanyName.ToLower().Contains(keyword));
            }

            var totalCount = await query.CountAsync();
            var companies = await query
                .OrderBy(c => c.CompanyName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CompanySummaryDTO
                {
                    CompanyId = c.CompanyId,
                    CompanyName = c.CompanyName,
                    LogoImg = c.LogoImg,
                    Website = c.Website,
                    JobCount = c.Jobs.Count(j => j.DeletedAt == null)
                })
                .ToListAsync();

            var result = new
            {
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Data = companies
            };

            return Ok(result);
        }

        // GET: api/companies/{id}/jobs
        [HttpGet("{id}/jobs")]
        public async Task<IActionResult> GetCompanyJobs(int id)
        {
            var jobs = await _context.Jobs
                .Include(j => j.Location)
                .Include(j => j.JobTags).ThenInclude(jt => jt.Tag)
                .Where(j => j.CompanyId == id && j.DeletedAt == null)
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
                    LocationName = j.Location != null ? j.Location.LocationName : null,
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

        private bool CompanyExists(int id)
        {
            return _context.Companies.Any(e => e.CompanyId == id && e.DeletedAt == null);
        }
    }
}