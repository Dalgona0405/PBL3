using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SearchController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/search/jobs
        [HttpGet("jobs")]
        public async Task<IActionResult> SearchJobs(
            [FromQuery] string? keyword,
            [FromQuery] int? locationId,
            [FromQuery] int? tagId,
            [FromQuery] decimal? minSalary,
            [FromQuery] decimal? maxSalary,
            [FromQuery] int? expYear,
            [FromQuery] string? level,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Location)
                .Include(j => j.JobTags)
                    .ThenInclude(jt => jt.Tag)
                .Where(j => j.DeletedAt == null)
                .AsQueryable();

            // Lọc theo keyword
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(j => 
                    j.Title.ToLower().Contains(keyword) ||
                    (j.Description != null && j.Description.ToLower().Contains(keyword)) ||
                    (j.Requirement != null && j.Requirement.ToLower().Contains(keyword)) ||
                    (j.Company != null && j.Company.CompanyName.ToLower().Contains(keyword)));
            }

            // Lọc theo location
            if (locationId.HasValue)
            {
                query = query.Where(j => j.LocationId == locationId);
            }

            // Lọc theo tag
            if (tagId.HasValue)
            {
                query = query.Where(j => j.JobTags.Any(jt => jt.TagId == tagId));
            }

            // Lọc theo salary
            if (minSalary.HasValue)
            {
                query = query.Where(j => 
                    (j.SalaryMax.HasValue && j.SalaryMax >= minSalary) ||
                    (j.SalaryMin.HasValue && j.SalaryMin >= minSalary));
            }

            if (maxSalary.HasValue)
            {
                query = query.Where(j => 
                    (j.SalaryMin.HasValue && j.SalaryMin <= maxSalary) ||
                    (j.SalaryMax.HasValue && j.SalaryMax <= maxSalary));
            }

            // Lọc theo kinh nghiệm
            //if (expYear.HasValue)
            //{
            //    query = query.Where(j =>
            //        j.ExpYear == null ||
            //        (int.TryParse(j.ExpYear, out var ey) && ey <= expYear.Value));
            //}

            // Lọc theo level
            if (!string.IsNullOrWhiteSpace(level))
            {
                query = query.Where(j => j.Level != null && j.Level == level);
            }

            // Phân trang
            var totalCount = await query.CountAsync();
            var jobs = await query
                .OrderByDescending(j => j.PostedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
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
                    
                    // ✅ FIX: Kiểm tra null Company
                    Company = j.Company == null ? null : new CompanySummaryDTO  
                    {
                        CompanyId = j.Company.CompanyId,
                        CompanyName = j.Company.CompanyName,
                        LogoImg = j.Company.LogoImg,
                        Website = j.Company.Website
                    },
                    
                    // ✅ FIX: Kiểm tra null Location
                    Location = j.Location == null ? null : new LocationSummaryDTO
                    {
                        LocationId = j.Location.LocationId,
                        LocationName = j.Location.LocationName
                    },
                    
                    // ✅ FIX: Dùng ?. và ?? cho Tag
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
            
            var result = new
            {
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Data = jobs
            };

            return Ok(result);
        }

        // GET: api/search/candidates
        [HttpGet("candidates")]
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
                    c.User.FullName.ToLower().Contains(keyword) ||
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

            var totalCount = await query.CountAsync();
            var candidates = await query
                .OrderBy(c => c.User.FullName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CandidateSummaryDTO
                {
                    UserId = c.UserId,
                    FullName = c.User.FullName,
                    Avatar = c.User != null ? c.User.Avatar : null,
                    Email = c.User != null ? c.User.Email : null,
                    CVUrl = c.CVUrl,
                    Skills = c.CandidateTags
                        .Where(ct => ct.Tag != null)
                        .Select(ct => ct.Tag!.TagName)
                        .Take(5)
                        .ToList(),
                    ExperienceYears = c.Experiences
                        .Select(e => (e.EndDate ?? DateTime.Now).Year - e.StartDate.Value.Year)
                        .DefaultIfEmpty(0)
                        .Sum()
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

        // GET: api/search/companies
        [HttpGet("companies")]
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

        // GET: api/search/tags
        [HttpGet("tags")]
        public async Task<IActionResult> SearchTags([FromQuery] string? keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest("Keyword is required");

            keyword = keyword.ToLower();
            var tags = await _context.Tags
                .Where(t => t.TagName.ToLower().Contains(keyword))
                .Select(t => new TagSummaryDTO
                {
                    TagId = t.TagId,
                    TagName = t.TagName,
                    Type = t.Type
                })
                .ToListAsync();

            return Ok(tags);
        }

        // GET: api/search/advanced
        [HttpGet("advanced")]
        public async Task<IActionResult> AdvancedSearch(
            [FromQuery] string? keyword,
            [FromQuery] int? locationId,
            [FromQuery] int[]? tagIds,
            [FromQuery] decimal? minSalary,
            [FromQuery] decimal? maxSalary,
            [FromQuery] int? expYear,
            [FromQuery] string? level,
            [FromQuery] string? jobType,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Location)
                .Include(j => j.JobTags)
                    .ThenInclude(jt => jt.Tag)
                .Where(j => j.DeletedAt == null)
                .AsQueryable();

            // Keyword
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(j => 
                    j.Title.ToLower().Contains(keyword) ||
                    (j.Description != null && j.Description.ToLower().Contains(keyword)) ||
                    (j.Requirement != null && j.Requirement.ToLower().Contains(keyword)));
            }

            // Location
            if (locationId.HasValue)
                query = query.Where(j => j.LocationId == locationId);

            // Multiple Tags
            if (tagIds != null && tagIds.Length > 0)
            {
                query = query.Where(j => 
                    j.JobTags.Any(jt => tagIds.Contains(jt.TagId)));
            }

            // Salary range
            if (minSalary.HasValue)
                query = query.Where(j => j.SalaryMax >= minSalary || j.SalaryMin >= minSalary);
            
            if (maxSalary.HasValue)
                query = query.Where(j => j.SalaryMin <= maxSalary || j.SalaryMax <= maxSalary);

            // Experience
            //if (expYear.HasValue)
            //{
            //    query = query.Where(j =>
            //        j.ExpYear == null ||
            //        (int.TryParse(j.ExpYear, out var ey) && ey <= expYear.Value));
            //}

            // Level
            if (!string.IsNullOrWhiteSpace(level))
                query = query.Where(j => j.Level == level);

            var totalCount = await query.CountAsync();
            var jobs = await query
                .OrderByDescending(j => j.PostedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(j => new JobResponseDTO
                {
                    JobId = j.JobId,
                    Title = j.Title,
                    SalaryMin = j.SalaryMin,
                    SalaryMax = j.SalaryMax,
                    Level = j.Level,
                    ExpYear = j.ExpYear,
                    PostedDate = j.PostedDate,
                    Deadline = j.Deadline,
                    
                    // ✅ FIX: Kiểm tra null Company
                    Company = j.Company == null ? null : new CompanySummaryDTO
                    {
                        CompanyId = j.Company.CompanyId,
                        CompanyName = j.Company.CompanyName,
                        LogoImg = j.Company.LogoImg
                    },
                    
                    // ✅ FIX: Kiểm tra null Location
                    Location = j.Location == null ? null : new LocationSummaryDTO
                    {
                        LocationId = j.Location.LocationId,
                        LocationName = j.Location.LocationName
                    },
                    
                    // ✅ FIX: Dùng ?. và ?? cho Tag
                    Tags = j.JobTags
                        .Where(jt => jt.Tag != null)
                        .Select(jt => new TagSummaryDTO
                        {
                            TagId = jt.Tag!.TagId,
                            TagName = jt.Tag!.TagName
                        }).ToList(),
                    
                    Address = j.Address,
                    Benefits = j.Benefits,
                    Description = j.Description,
                    Requirement = j.Requirement,
                    ViewCount = j.ViewCount ?? 0,
                    ApplicationCount = j.Applications.Count(a => a.DeletedAt == null)
                })
                .ToListAsync();

            return Ok(new
            {
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Data = jobs
            });
        }

        // GET: api/search/suggestions
        [HttpGet("suggestions")]
        public async Task<IActionResult> GetSearchSuggestions([FromQuery] string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword) || keyword.Length < 2)
                return Ok(new { suggestions = new List<string>() });

            keyword = keyword.ToLower();

            // Lấy gợi ý từ Job Titles
            var jobTitles = await _context.Jobs
                .Where(j => j.DeletedAt == null && j.Title.ToLower().Contains(keyword))
                .Select(j => j.Title)
                .Distinct()
                .Take(5)
                .ToListAsync();

            // Lấy gợi ý từ Company Names
            var companyNames = await _context.Companies
                .Where(c => c.DeletedAt == null && c.CompanyName.ToLower().Contains(keyword))
                .Select(c => c.CompanyName)
                .Distinct()
                .Take(5)
                .ToListAsync();

            // Lấy gợi ý từ Skills (Tags)
            var skills = await _context.Tags
                .Where(t => t.TagName.ToLower().Contains(keyword))
                .Select(t => t.TagName)
                .Distinct()
                .Take(5)
                .ToListAsync();

            var suggestions = jobTitles
                .Concat(companyNames)
                .Concat(skills)
                .Distinct()
                .Take(10)
                .ToList();

            return Ok(new { suggestions });
        }
    }
}