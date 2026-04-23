// using Microsoft.AspNetCore.Mvc;
// using Microsoft.EntityFrameworkCore;
// using JobSeekingAPI.Data;
// using JobSeekingAPI.DTOs;

// namespace JobSeekingAPI.Controllers
// {
//     [Route("api/[controller]")]
//     [ApiController]
//     public class SearchController : ControllerBase
//     {
//         private readonly ApplicationDbContext _context;

//         public SearchController(ApplicationDbContext context)
//         {
//             _context = context;
//         }

//         // GET: api/search/advanced
//         [HttpGet("advanced")]
//         public async Task<IActionResult> AdvancedSearch(
//             [FromQuery] string? keyword,
//             [FromQuery] int? locationId,
//             [FromQuery] int[]? tagIds,
//             [FromQuery] decimal? minSalary,
//             [FromQuery] decimal? maxSalary,
//             [FromQuery] int? expYear,
//             [FromQuery] string? level,
//             [FromQuery] string? jobType,
//             [FromQuery] int page = 1,
//             [FromQuery] int pageSize = 20)
//         {
//             var query = _context.Jobs
//                 .Include(j => j.Company)
//                 .Include(j => j.Location)
//                 .Include(j => j.JobTags)
//                     .ThenInclude(jt => jt.Tag)
//                 .Where(j => j.DeletedAt == null)
//                 .AsQueryable();

//             // Keyword
//             if (!string.IsNullOrWhiteSpace(keyword))
//             {
//                 keyword = keyword.ToLower();
//                 query = query.Where(j =>
//                     j.Title.ToLower().Contains(keyword) ||
//                     (j.Description != null && j.Description.ToLower().Contains(keyword)) ||
//                     (j.Requirement != null && j.Requirement.ToLower().Contains(keyword)));
//             }

//             // Location
//             if (locationId.HasValue)
//                 query = query.Where(j => j.LocationId == locationId);

//             // Multiple Tags
//             if (tagIds != null && tagIds.Length > 0)
//             {
//                 query = query.Where(j =>
//                     j.JobTags.Any(jt => tagIds.Contains(jt.TagId)));
//             }

//             // Salary range
//             if (minSalary.HasValue)
//                 query = query.Where(j => j.SalaryMax >= minSalary || j.SalaryMin >= minSalary);

//             if (maxSalary.HasValue)
//                 query = query.Where(j => j.SalaryMin <= maxSalary || j.SalaryMax <= maxSalary);

//             // Experience
//             if (expYear.HasValue)
//             {
//                 query = query.Where(j =>
//                     j.ExpYear == null ||
//                     (int.TryParse(j.ExpYear, out var ey) && ey <= expYear.Value));
//             }

//             // Level
//             if (!string.IsNullOrWhiteSpace(level))
//                 query = query.Where(j => j.Level == level);

//             var totalCount = await query.CountAsync();
//             var jobs = await query
//                 .OrderByDescending(j => j.PostedDate)
//                 .Skip((page - 1) * pageSize)
//                 .Take(pageSize)
//                 .Select(j => new JobResponseDTO
//                 {
//                     JobId = j.JobId,
//                     Title = j.Title,
//                     SalaryMin = j.SalaryMin,
//                     SalaryMax = j.SalaryMax,
//                     Level = j.Level,
//                     ExpYear = j.ExpYear,
//                     PostedDate = j.PostedDate,
//                     Deadline = j.Deadline,

//                     // ✅ FIX: Kiểm tra null Company
//                     Company = j.Company == null ? null : new CompanySummaryDTO
//                     {
//                         CompanyId = j.Company.CompanyId,
//                         CompanyName = j.Company.CompanyName,
//                         LogoImg = j.Company.LogoImg
//                     },

//                     // ✅ FIX: Kiểm tra null Location
//                     Location = j.Location == null ? null : new LocationSummaryDTO
//                     {
//                         LocationId = j.Location.LocationId,
//                         LocationName = j.Location.LocationName
//                     },

//                     // ✅ FIX: Dùng ?. và ?? cho Tag
//                     Tags = j.JobTags
//                         .Where(jt => jt.Tag != null)
//                         .Select(jt => new TagSummaryDTO
//                         {
//                             TagId = jt.Tag!.TagId,
//                             TagName = jt.Tag!.TagName
//                         }).ToList(),

//                     Address = j.Address,
//                     Benefits = j.Benefits,
//                     Description = j.Description,
//                     Requirement = j.Requirement,
//                     ViewCount = j.ViewCount ?? 0,
//                     ApplicationCount = j.Applications.Count(a => a.DeletedAt == null)
//                 })
//                 .ToListAsync();

//             return Ok(new
//             {
//                 TotalCount = totalCount,
//                 Page = page,
//                 PageSize = pageSize,
//                 TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
//                 Data = jobs
//             });
//         }

//         // GET: api/search/suggestions
//         [HttpGet("suggestions")]
//         public async Task<IActionResult> GetSearchSuggestions([FromQuery] string keyword)
//         {
//             if (string.IsNullOrWhiteSpace(keyword) || keyword.Length < 2)
//                 return Ok(new { suggestions = new List<string>() });

//             keyword = keyword.ToLower();

//             // Lấy gợi ý từ Job Titles
//             var jobTitles = await _context.Jobs
//                 .Where(j => j.DeletedAt == null && j.Title.ToLower().Contains(keyword))
//                 .Select(j => j.Title)
//                 .Distinct()
//                 .Take(5)
//                 .ToListAsync();

//             // Lấy gợi ý từ Company Names
//             var companyNames = await _context.Companies
//                 .Where(c => c.DeletedAt == null && c.CompanyName.ToLower().Contains(keyword))
//                 .Select(c => c.CompanyName)
//                 .Distinct()
//                 .Take(5)
//                 .ToListAsync();

//             // Lấy gợi ý từ Skills (Tags)
//             var skills = await _context.Tags
//                 .Where(t => t.TagName.ToLower().Contains(keyword))
//                 .Select(t => t.TagName)
//                 .Distinct()
//                 .Take(5)
//                 .ToListAsync();

//             var suggestions = jobTitles
//                 .Concat(companyNames)
//                 .Concat(skills)
//                 .Distinct()
//                 .Take(10)
//                 .ToList();

//             return Ok(new { suggestions });
//         }
//     }
// }