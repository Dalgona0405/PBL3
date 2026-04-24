using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Data;
using JobSeekingAPI.Models;
using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Repositories
{
    public class CompanyRepository : BaseRepository<Company>, ICompanyRepository
    {
        public CompanyRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<CompanySummaryDTO>> GetAllCompaniesSummaryAsync()
        {
            return await _context.Companies
                .AsNoTracking()
                .Include(c => c.Jobs.Where(j => j.DeletedAt == null))
                    .ThenInclude(j => j.Location)
                .Where(c => c.DeletedAt == null)
                .Select(c => new CompanySummaryDTO
                {
                    CompanyId = c.CompanyId,
                    CompanyName = c.CompanyName,
                    LogoImg = c.LogoImg,
                    Website = c.Website,
                    Size = c.Size,
                    JobCount = c.Jobs.Count,
                    RecentJobs = c.Jobs.OrderByDescending(j => j.PostedDate).Take(5)
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
        }

        public async Task<CompanyDetailDTO?> GetCompanyDetailByIdAsync(int id)
        {
            return await _context.Companies
                .AsNoTracking()
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
                    ActiveJobs = c.Jobs
                        .OrderByDescending(j => j.PostedDate)
                        .Select(j => new JobDetailDTO
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
        }

        public async Task<PagedResultDTO<CompanySummaryDTO>> SearchCompaniesAsync(string? keyword, int page, int pageSize)
        {
            var query = _context.Companies
                .AsNoTracking()
                .Where(c => c.DeletedAt == null);

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

            return new PagedResultDTO<CompanySummaryDTO>
            {
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Items = companies
            };
        }

        public async Task<Company?> GetCompanyEntityByIdAsync(int id)
        {
            return await _context.Companies
                .FirstOrDefaultAsync(c => c.CompanyId == id && c.DeletedAt == null);
        }

        public async Task<string> SoftDeleteCompanyAsync(int id)
        {
            var company = await _context.Companies
                .Include(c => c.Jobs)
                .Include(c => c.Recruiters).ThenInclude(r => r.User)
                .FirstOrDefaultAsync(c => c.CompanyId == id && c.DeletedAt == null);

            if (company == null)
                return "Company not found";

            if (company.Jobs.Any(j => j.DeletedAt == null))
                return "Has active jobs";

            company.DeletedAt = DateTime.UtcNow;

            foreach (var recruiter in company.Recruiters)
            {
                if (recruiter.User != null)
                    recruiter.User.DeletedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
            return "Delete sucess";
        }
        public async Task<int?> GetCompanyIdByRecruiterIdAsync(int recruiterId)
        {
            var recruiter = await _context.Recruiters
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.UserId == recruiterId && r.User != null && r.User.DeletedAt == null);
            return recruiter?.CompanyId;
        }
    }
}