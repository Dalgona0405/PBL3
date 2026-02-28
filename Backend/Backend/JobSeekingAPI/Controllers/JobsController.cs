using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public JobsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/jobs
        [HttpGet]
        public async Task<IActionResult> GetAllJobs()
        {
            var jobs = await _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Location)
                .Include(j => j.JobTags).ThenInclude(jt => jt.Tag)
                .Where(j => j.DeletedAt == null)
                .Select(j => new JobResponseDTO
                {
                    JobId = j.JobId,
                    CompanyId = j.CompanyId,
                    OriginalId = j.OriginalId,
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
                    
                    Company = new CompanySummaryDTO
                    {
                        CompanyId = j.Company!.CompanyId,
                        CompanyName = j.Company.CompanyName,
                        LogoImg = j.Company.LogoImg,
                        Website = j.Company.Website
                    },
                    
                    Location = new LocationSummaryDTO
                    {
                        LocationId = j.Location!.LocationId,
                        LocationName = j.Location.LocationName
                    },
                    
                    Tags = j.JobTags.Where(jt => jt.Tag != null)
                        .Select(jt => new TagSummaryDTO
                        {
                            TagId = jt.Tag!.TagId,
                            TagName = jt.Tag.TagName,
                            Type = jt.Tag.Type
                        }).ToList(),
                    
                    ApplicationCount = j.Applications != null ? 
                        j.Applications.Count(a => a.DeletedAt == null) : 0
                })
                .ToListAsync();
            
            return Ok(jobs);
        }

        // GET: api/jobs/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetJobById(int id)
        {
            var job = await _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Location)
                .Include(j => j.JobTags).ThenInclude(jt => jt.Tag)
                .Include(j => j.Applications)
                .Where(j => j.JobId == id && j.DeletedAt == null)
                .Select(j => new JobResponseDTO
                {
                    JobId = j.JobId,
                    CompanyId = j.CompanyId,
                    OriginalId = j.OriginalId,
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
                    
                    Company = new CompanySummaryDTO
                    {
                        CompanyId = j.Company!.CompanyId,
                        CompanyName = j.Company.CompanyName,
                        LogoImg = j.Company.LogoImg,
                        Website = j.Company.Website
                    },
                    
                    Location = new LocationSummaryDTO
                    {
                        LocationId = j.Location!.LocationId,
                        LocationName = j.Location.LocationName
                    },
                    
                    Tags = j.JobTags.Where(jt => jt.Tag != null)
                        .Select(jt => new TagSummaryDTO
                        {
                            TagId = jt.Tag!.TagId,
                            TagName = jt.Tag.TagName,
                            Type = jt.Tag.Type
                        }).ToList(),
                    
                    ApplicationCount = j.Applications != null ? 
                        j.Applications.Count(a => a.DeletedAt == null) : 0
                })
                .FirstOrDefaultAsync();

            if (job == null)
                return NotFound("Job not found");

            return Ok(job);
        }
    }
}