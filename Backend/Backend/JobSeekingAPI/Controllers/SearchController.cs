//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using JobSeekingAPI.Data;
//using JobSeekingAPI.DTOs;
//using Microsoft.AspNetCore.Authorization;

//// namespace JobSeekingAPI.Controllers
//// {
////     [Route("api/[controller]")]
////     [ApiController]
////     public class SearchController : ControllerBase
////     {
////         private readonly ApplicationDbContext _context;

////         public SearchController(ApplicationDbContext context)
////         {
////             _context = context;
////         }

//        // GET: api/search/advanced
//        [AllowAnonymous]
//        [HttpGet("advanced")]
//        public async Task<IActionResult> AdvancedSearch(
//            [FromQuery] string? keyword,
//            [FromQuery] int? locationId,
//            [FromQuery] int[]? tagIds,
//            [FromQuery] decimal? minSalary,
//            [FromQuery] decimal? maxSalary,
//            [FromQuery] int? expYear,
//            [FromQuery] string? level,
//            [FromQuery] string? jobType,
//            [FromQuery] int page = 1,
//            [FromQuery] int pageSize = 20)
//        {
//            var baseQuery = _context.Jobs
//                .Include(j => j.Company)
//                .Include(j => j.Location)
//                .Include(j => j.JobTags)
//                    .ThenInclude(jt => jt.Tag)
//                .Where(j => j.DeletedAt == null)
//                .AsQueryable();

//            // Keyword
//            if (!string.IsNullOrWhiteSpace(keyword))
//            {
//                var kw = keyword.ToLower();
//                baseQuery = baseQuery.Where(j =>
//                    j.Title.ToLower().Contains(kw) ||
//                    (j.Description != null && j.Description.ToLower().Contains(kw)) ||
//                    (j.Requirement != null && j.Requirement.ToLower().Contains(kw)));
//            }

//            // Location
//            if (locationId.HasValue)
//                baseQuery = baseQuery.Where(j => j.LocationId == locationId);

//            // Multiple Tags
//            if (tagIds != null && tagIds.Length > 0)
//            {
//                baseQuery = baseQuery.Where(j =>
//                    j.JobTags.Any(jt => tagIds.Contains(jt.TagId)));
//            }

//            // Salary range
//            if (minSalary.HasValue)
//                baseQuery = baseQuery.Where(j => j.SalaryMax >= minSalary || j.SalaryMin >= minSalary);

//            if (maxSalary.HasValue)
//                baseQuery = baseQuery.Where(j => j.SalaryMin <= maxSalary || j.SalaryMax <= maxSalary);

//            // Level
//            if (!string.IsNullOrWhiteSpace(level))
//                baseQuery = baseQuery.Where(j => j.Level == level);

//            // NOTE: EF Core cannot translate int.TryParse (or out var declarations) into SQL.
//            // If expYear filtering is required, we must evaluate that predicate on the client.
//            if (expYear.HasValue)
//            {
//                var exp = expYear.Value;

//                // Materialize remaining server-side filters, include Applications because we'll compute ApplicationCount in-memory
//                var materialized = await baseQuery
//                    .Include(j => j.Applications)
//                    .ToListAsync();

//                // Apply expYear filter on client side using int.TryParse (safe because we're in-memory)
//                var filtered = materialized
//                    .Where(j => j.ExpYear == null || (int.TryParse(j.ExpYear, out var ey) && ey <= exp))
//                    .ToList();

//                var totalCount = filtered.Count;

//                var jobs = filtered
//                    .OrderByDescending(j => j.PostedDate)
//                    .Skip((page - 1) * pageSize)
//                    .Take(pageSize)
//                    .Select(j => new JobDetailDTO
//                    {
//                        JobId = j.JobId,
//                        Title = j.Title,
//                        SalaryMin = j.SalaryMin,
//                        SalaryMax = j.SalaryMax,
//                        Level = j.Level,
//                        ExpYear = j.ExpYear,
//                        PostedDate = j.PostedDate,
//                        Deadline = j.Deadline,

//                        Company = j.Company == null ? null : new CompanySummaryDTO
//                        {
//                            CompanyId = j.Company.CompanyId,
//                            CompanyName = j.Company.CompanyName,
//                            LogoImg = j.Company.LogoImg
//                        },

//                        Location = j.Location == null ? null : new LocationSummaryDTO
//                        {
//                            LocationId = j.Location.LocationId,
//                            LocationName = j.Location.LocationName
//                        },

//                        Tags = j.JobTags
//                            .Where(jt => jt.Tag != null)
//                            .Select(jt => new TagSummaryDTO
//                            {
//                                TagId = jt.Tag!.TagId,
//                                TagName = jt.Tag!.TagName
//                            }).ToList(),

//                        Address = j.Address,
//                        Benefits = j.Benefits,
//                        Description = j.Description,
//                        Requirement = j.Requirement,
//                        ViewCount = j.ViewCount ?? 0,
//                        ApplicationCount = j.Applications?.Count(a => a.DeletedAt == null) ?? 0
//                    })
//                    .ToList();

//                return Ok(new
//                {
//                    TotalCount = totalCount,
//                    Page = page,
//                    PageSize = pageSize,
//                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
//                    Data = jobs
//                });
//            }
//            else
//            {
//                // No client-side parsing required; keep everything server-side for performance.
//                var totalCount = await baseQuery.CountAsync();
//                var jobs = await baseQuery
//                    .OrderByDescending(j => j.PostedDate)
//                    .Skip((page - 1) * pageSize)
//                    .Take(pageSize)
//                    .Select(j => new JobDetailDTO
//                    {
//                        JobId = j.JobId,
//                        Title = j.Title,
//                        SalaryMin = j.SalaryMin,
//                        SalaryMax = j.SalaryMax,
//                        Level = j.Level,
//                        ExpYear = j.ExpYear,
//                        PostedDate = j.PostedDate,
//                        Deadline = j.Deadline,

//                        Company = j.Company == null ? null : new CompanySummaryDTO
//                        {
//                            CompanyId = j.Company.CompanyId,
//                            CompanyName = j.Company.CompanyName,
//                            LogoImg = j.Company.LogoImg
//                        },

//                        Location = j.Location == null ? null : new LocationSummaryDTO
//                        {
//                            LocationId = j.Location.LocationId,
//                            LocationName = j.Location.LocationName
//                        },

//                        Tags = j.JobTags
//                            .Where(jt => jt.Tag != null)
//                            .Select(jt => new TagSummaryDTO
//                            {
//                                TagId = jt.Tag!.TagId,
//                                TagName = jt.Tag!.TagName
//                            }).ToList(),

//                        Address = j.Address,
//                        Benefits = j.Benefits,
//                        Description = j.Description,
//                        Requirement = j.Requirement,
//                        ViewCount = j.ViewCount ?? 0,
//                        ApplicationCount = j.Applications.Count(a => a.DeletedAt == null)
//                    })
//                    .ToListAsync();

//                return Ok(new
//                {
//                    TotalCount = totalCount,
//                    Page = page,
//                    PageSize = pageSize,
//                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
//                    Data = jobs
//                });
//            }
//        }

//        // GET: api/search/suggestions
//        [AllowAnonymous]
//        [HttpGet("suggestions")]
//        public async Task<IActionResult> GetSearchSuggestions([FromQuery] string keyword)
//        {
//            if (string.IsNullOrWhiteSpace(keyword) || keyword.Length < 2)
//                return Ok(new { suggestions = new List<string>() });

//            var kw = keyword.ToLower();

//            // Lấy gợi ý từ Job Titles
//            var jobTitles = await _context.Jobs
//                .Where(j => j.DeletedAt == null && j.Title.ToLower().Contains(kw))
//                .Select(j => j.Title)
//                .Distinct()
//                .Take(5)
//                .ToListAsync();

////             // Lấy gợi ý từ Company Names
////             var companyNames = await _context.Companies
////                 .Where(c => c.DeletedAt == null && c.CompanyName.ToLower().Contains(keyword))
////                 .Select(c => c.CompanyName)
////                 .Distinct()
////                 .Take(5)
////                 .ToListAsync();

////             // Lấy gợi ý từ Skills (Tags)
////             var skills = await _context.Tags
////                 .Where(t => t.TagName.ToLower().Contains(keyword))
////                 .Select(t => t.TagName)
////                 .Distinct()
////                 .Take(5)
////                 .ToListAsync();

////             var suggestions = jobTitles
////                 .Concat(companyNames)
////                 .Concat(skills)
////                 .Distinct()
////                 .Take(10)
////                 .ToList();

////             return Ok(new { suggestions });
////         }
////     }
//// }