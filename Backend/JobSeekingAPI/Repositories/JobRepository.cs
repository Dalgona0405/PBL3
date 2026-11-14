using System.Text.Json;
using JobSeekingAPI.Data;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace JobSeekingAPI.Repositories
{
    public class JobRepository : BaseRepository<Job>, IJobRepository
    {
        private static readonly string SettingsFilePath = Path.Combine(AppContext.BaseDirectory, "scraped_jobs_setting.json");
        private static readonly object SettingsLock = new();
        private static bool _showScrapedJobs = LoadShowScrapedJobsSetting();

        public JobRepository(ApplicationDbContext context) : base(context)
        {
        }

        public static bool ShowScrapedJobs
        {
            get
            {
                lock (SettingsLock)
                {
                    return _showScrapedJobs;
                }
            }
            set
            {
                lock (SettingsLock)
                {
                    _showScrapedJobs = value;
                    SaveShowScrapedJobsSetting(value);
                }
            }
        }

        private static bool LoadShowScrapedJobsSetting()
        {
            try
            {
                if (File.Exists(SettingsFilePath))
                {
                    var json = File.ReadAllText(SettingsFilePath);
                    using var doc = JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("showScrapedJobs", out var prop) &&
                        (prop.ValueKind == JsonValueKind.True || prop.ValueKind == JsonValueKind.False))
                    {
                        return prop.GetBoolean();
                    }
                }
            }
            catch
            {
                // Fallback to default true if config file cannot be read
            }
            return true;
        }

        private static void SaveShowScrapedJobsSetting(bool show)
        {
            try
            {
                var payload = JsonSerializer.Serialize(new { showScrapedJobs = show });
                File.WriteAllText(SettingsFilePath, payload);
            }
            catch
            {
                // Keep in-memory state if disk write is restricted
            }
        }

        // CRUD ĐẶC THÙ
        public async Task<IEnumerable<Job>> GetAllJobsWithDetailsAsync()
        {
            var query = _context.Jobs
                .AsNoTracking()
                .AsQueryable();

            if (!ShowScrapedJobs)
            {
                query = query.Where(j => j.OriginalId == null);
            }

            return await query
                .Include(j => j.Company)
                .Include(j => j.Location)
                .Include(j => j.JobTags).ThenInclude(jt => jt.Tag)
                .OrderByDescending(j => j.PostedDate) // Sắp xếp tin mới nhất lên đầu
                .ToListAsync();
        }

        public async Task<JobDetailDTO?> GetJobDetailByIdAsync(int id)
        {
            return await _context.Jobs
                .AsNoTracking()
                .Where(j => j.JobId == id)
                .Select(j => new JobDetailDTO
                {
                    JobId = j.JobId,
                    CompanyId = j.CompanyId,
                    PostedByUserId = j.PostedByUserId,
                    IsFreelanceRecruiter = j.CompanyId == null,
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
                    Status = j.Status,
                    ViewCount = j.ViewCount ?? 0,

                    Company = j.Company != null ? new CompanySummaryDTO
                    {
                        CompanyId = j.Company.CompanyId,
                        CompanyName = j.Company.CompanyName,
                        LogoImg = j.Company.LogoImg,
                        Website = j.Company.Website,
                        IsVerified = j.Company.IsVerified,
                        TaxCode = j.Company.TaxCode
                    } : null,

                    Location = j.Location != null ? new LocationSummaryDTO
                    {
                        LocationId = j.Location.LocationId,
                        LocationName = j.Location.LocationName
                    } : null,

                    Tags = j.JobTags.Where(jt => jt.Tag != null).Select(jt => new TagSummaryDTO
                    {
                        TagId = jt.Tag!.TagId,
                        TagName = jt.Tag.TagName,
                        Type = jt.Tag.Type
                    }).ToList(),
                    ApplicationCount = j.Applications.Count
                })
                .FirstOrDefaultAsync();
        }

        public async Task<Job?> GetJobEntityByIdAsync(int id) // Kèm JobTags để phục vụ cập nhật
        {
            return await _context.Jobs
                .Include(j => j.JobTags)
                .FirstOrDefaultAsync(j => j.JobId == id);
        }

        public async Task<Job> CreateJobWithDefaultsAsync(Job job)
        {
            job.PostedDate = DateTime.UtcNow;
            job.Status = 1; // 1: Đang hoạt động
            job.ViewCount = 0;
            return await base.CreateAsync(job);
        }
        public async Task UpdateJobWithTagsAsync(Job job, List<int>? newTagIds)
        {
            _context.Entry(job).State = EntityState.Modified;

            if (newTagIds != null)
            {
                var oldTags = await _context.JobTags.Where(jt => jt.JobId == job.JobId).ToListAsync();
                _context.JobTags.RemoveRange(oldTags);

                var newTags = newTagIds.Select(tagId => new JobTag
                {
                    JobId = job.JobId,
                    TagId = tagId
                });

                await _context.JobTags.AddRangeAsync(newTags);
            }
            await _context.SaveChangesAsync();
        }

        public async Task SoftDeleteJobAsync(int id)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job != null)
            {
                job.DeletedAt = DateTime.UtcNow;
                job.Status = 0; // 0: Ngừng hoạt động
                await _context.SaveChangesAsync();
            }
        }

        // ===== TÌM KIẾM NÂNG CAO =====
        public async Task<PagedResultDTO<Job>> SearchJobsAsync(JobSearchDTO searchParams)
        {
            var query = _context.Jobs
                .AsNoTracking()
                .Include(j => j.Company)
                .Include(j => j.Location)
                .Include(j => j.JobTags).ThenInclude(jt => jt.Tag)
                .Where(j => j.Status == 1);

            if (!ShowScrapedJobs)
            {
                query = query.Where(j => j.OriginalId == null);
            }

            // Lọc theo từ khóa
            if (!string.IsNullOrWhiteSpace(searchParams.Keyword))
            {
                var keyword = searchParams.Keyword.ToLower();
                query = query.Where(j =>
                    (j.Title != null && j.Title.ToLower().Contains(keyword)) ||
                    (j.Description != null && j.Description.ToLower().Contains(keyword)) ||
                    (j.Requirement != null && j.Requirement.ToLower().Contains(keyword)) ||
                    (j.Company != null && j.Company.CompanyName != null &&
                     j.Company.CompanyName.ToLower().Contains(keyword)));
            }

            // Lọc theo địa điểm
            if (searchParams.LocationId.HasValue)
            {
                query = query.Where(j => j.LocationId == searchParams.LocationId.Value);
            }

            // Lọc theo kỹ năng/thẻ
            if (searchParams.TagId.HasValue)
            {
                query = query.Where(j => j.JobTags.Any(jt => jt.TagId == searchParams.TagId));
            }

            // Lọc theo mức lương
            if (searchParams.MinSalary.HasValue)
            {
                query = query.Where(j =>
                    (j.SalaryMax.HasValue && j.SalaryMax >= searchParams.MinSalary) ||
                    (j.SalaryMin.HasValue && j.SalaryMin >= searchParams.MinSalary));
            }

            if (searchParams.MaxSalary.HasValue)
            {
                query = query.Where(j =>
                    (j.SalaryMin.HasValue && j.SalaryMin <= searchParams.MaxSalary) ||
                    (j.SalaryMax.HasValue && j.SalaryMax <= searchParams.MaxSalary));
            }

            // Lọc theo kinh nghiệm
            if (!string.IsNullOrWhiteSpace(searchParams.ExpYear))
            {
                query = query.Where(j => j.ExpYear != null && j.ExpYear == searchParams.ExpYear);
            }

            // Lọc theo cấp bậc
            if (!string.IsNullOrWhiteSpace(searchParams.Level))
            {
                query = query.Where(j => j.Level != null && j.Level == searchParams.Level);
            }

            // Đếm tổng số bản ghi phù hợp
            var totalCount = await query.CountAsync();
            var pageNumber = searchParams.Page > 0 ? searchParams.Page : 1;
            var pageSize = searchParams.PageSize > 0 ? searchParams.PageSize : 10;

            // Phân trang kết quả
            var items = await query
                .OrderByDescending(j => j.PostedDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Đóng gói kết quả phân trang
            return new PagedResultDTO<Job>
            {
                TotalCount = totalCount,
                Page = pageNumber,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Items = items
            };
        }

        // ===== LỌC THEO QUAN HỆ =====
        public async Task<IEnumerable<Job>> GetJobsByCompanyAsync(int companyId)
        {
            var query = _context.Jobs
                .AsNoTracking()
                .Where(j => j.CompanyId == companyId);

            if (!ShowScrapedJobs)
            {
                query = query.Where(j => j.OriginalId == null);
            }

            return await query
                .Include(j => j.Company)
                .Include(j => j.Location)
                .Include(j => j.JobTags).ThenInclude(jt => jt.Tag)
                .OrderByDescending(j => j.PostedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Job>> GetJobsByRecruiterAsync(int recruiterUserId)
        {
            var recruiterCompanyId = await _context.Recruiters
                .AsNoTracking()
                .Where(r => r.UserId == recruiterUserId)
                .Select(r => r.CompanyId)
                .FirstOrDefaultAsync();

            var query = _context.Jobs
                .AsNoTracking()
                .Where(j => j.PostedByUserId == recruiterUserId ||
                            (recruiterCompanyId != null && j.CompanyId == recruiterCompanyId));

            return await query
                .Include(j => j.Company)
                .Include(j => j.Location)
                .Include(j => j.JobTags).ThenInclude(jt => jt.Tag)
                .OrderByDescending(j => j.PostedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Job>> GetJobsByLocationAsync(int locationId)
        {
            var query = _context.Jobs
                .AsNoTracking()
                .Where(j => j.LocationId == locationId);

            if (!ShowScrapedJobs)
            {
                query = query.Where(j => j.OriginalId == null);
            }

            return await query
                .Include(j => j.Company)
                .OrderByDescending(j => j.PostedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Job>> GetJobsByTagAsync(int tagId)
        {
            var query = _context.Jobs
                .AsNoTracking()
                .Where(j => j.JobTags.Any(jt => jt.TagId == tagId));

            if (!ShowScrapedJobs)
            {
                query = query.Where(j => j.OriginalId == null);
            }

            return await query
                .Include(j => j.Company)
                .Include(j => j.Location)
                .OrderByDescending(j => j.PostedDate)
                .ToListAsync();
        }

        // ===== THỐNG KÊ =====
        public async Task<int> GetTotalJobsCountAsync()
        {
            return await _context.Jobs
                .Where(j => j.Status == 1)
                .CountAsync();
        }

        public async Task<Dictionary<string, int>> GetJobsByLevelAsync()
        {
            return await _context.Jobs
                .AsNoTracking()
                .Where(j => j.Level != null)
                .GroupBy(j => j.Level)
                .Select(g => new { Level = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Level!, x => x.Count);
        }

        public async Task<IEnumerable<Job>> GetRecentJobsAsync(int count)
        {
            var query = _context.Jobs
                .AsNoTracking()
                .Where(j => j.Status == 1);

            if (!ShowScrapedJobs)
            {
                query = query.Where(j => j.OriginalId == null);
            }

            return await query
                .Include(j => j.Company)
                .Include(j => j.Location)
                .Include(j => j.JobTags).ThenInclude(jt => jt.Tag)
                .OrderByDescending(j => j.PostedDate)
                .Take(count)
                .ToListAsync();
        }

        public async Task IncrementViewCountAsync(int jobId)
        {
            var job = await _context.Jobs.FindAsync(jobId);
            if (job != null)
            {
                job.ViewCount = (job.ViewCount ?? 0) + 1;
                await _context.SaveChangesAsync();
            }
        }
    }
}