using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using Microsoft.EntityFrameworkCore;

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
                .Select(c => new CompanySummaryDTO
                {
                    CompanyId = c.CompanyId,
                    CompanyName = c.CompanyName,
                    LogoImg = c.LogoImg,
                    Website = c.Website,
                    IsVerified = c.IsVerified,
                    TaxCode = c.TaxCode,
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
                .Where(c => c.CompanyId == id)
                .Select(c => new CompanyDetailDTO
                {
                    CompanyId = c.CompanyId,
                    CompanyName = c.CompanyName,
                    LogoImg = c.LogoImg,
                    Website = c.Website,
                    IsVerified = c.IsVerified,
                    TaxCode = c.TaxCode,
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
                            ApplicationCount = j.Applications.Count
                        }).ToList(),

                    Recruiters = c.Recruiters
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
                    IsVerified = c.IsVerified,
                    TaxCode = c.TaxCode,
                    JobCount = c.Jobs.Count
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
                .FirstOrDefaultAsync(c => c.CompanyId == id);
        }

        public async Task SoftDeleteCompanyAsync(int id)
        {
            var company = await _context.Companies
                .Include(c => c.Jobs)
                .Include(c => c.Recruiters).ThenInclude(r => r.User)
                .FirstOrDefaultAsync(c => c.CompanyId == id);

            if (company == null)
                throw new KeyNotFoundException("Không tìm thấy doanh nghiệp.");

            if (company.Jobs.Any())
                throw new ArgumentException("Không thể xóa doanh nghiệp đang có tin tuyển dụng hoạt động.");

            company.DeletedAt = DateTime.UtcNow;

            foreach (var recruiter in company.Recruiters)
            {
                if (recruiter.User != null)
                    recruiter.User.DeletedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
        }
        public async Task<int?> GetCompanyIdByRecruiterIdAsync(int recruiterId)
        {
            var recruiter = await _context.Recruiters
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.UserId == recruiterId);
            return recruiter?.CompanyId;
        }
    }
}