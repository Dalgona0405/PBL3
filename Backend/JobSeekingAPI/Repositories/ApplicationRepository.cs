using JobSeekingAPI.Data;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace JobSeekingAPI.Repositories
{
    public class ApplicationRepository : BaseRepository<Application>, IApplicationRepository
    {
        public ApplicationRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<Application?> GetApplicationDetailByIdAsync(int id)
        {
            return await _context.Applications
                .AsNoTracking()
                .Include(a => a.Candidate!)
                    .ThenInclude(c => c.User)
                .Include(a => a.Candidate!)
                    .ThenInclude(c => c.CandidateTags)
                        .ThenInclude(ct => ct.Tag)
                .Include(a => a.Candidate!)
                    .ThenInclude(c => c.Experiences)
                .Include(a => a.Job!)
                    .ThenInclude(j => j.Company)
                .Include(a => a.Job!)
                    .ThenInclude(j => j.Location)
                .Include(a => a.Job!)
                    .ThenInclude(j => j.JobTags)
                        .ThenInclude(jt => jt.Tag)
                .Include(a => a.Interviews)
                .FirstOrDefaultAsync(a => a.AppId == id);
        }

        public async Task<Application?> GetApplicationEntityByIdAsync(int id)
        {
            return await _context.Applications
                .FirstOrDefaultAsync(a => a.AppId == id);
        }

        // Status: 1 = Pending, 2 = Reviewed, 3 = Interviewing, 4 = Accepted, 5 = Rejected
        public async Task<Application> CreateApplicationDetailAsync(Application application)
        {
            application.AppliedDate = DateTime.UtcNow;
            application.Status = 1;

            return await base.CreateAsync(application);
        }

        public async Task SoftDeleteApplicationAsync(int id)
        {
            var application = await GetByIdAsync(id);
            if (application != null)
            {
                application.DeletedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        // LỌC THEO QUAN HỆ
        public async Task<IEnumerable<Application>> GetByJobIdAsync(int jobId)
        {
            return await _context.Applications
                .AsNoTracking()
                .Include(a => a.Candidate!)
                    .ThenInclude(c => c.User)
                .Include(a => a.Candidate!)
                    .ThenInclude(c => c.CandidateTags)
                        .ThenInclude(ct => ct.Tag)
                .Include(a => a.Candidate!)
                    .ThenInclude(c => c.Experiences)
                .Include(a => a.Job!)
                    .ThenInclude(j => j.Company)
                .Include(a => a.Job!)
                    .ThenInclude(j => j.Location)
                .Include(a => a.Job!)
                    .ThenInclude(j => j.JobTags)
                        .ThenInclude(jt => jt.Tag)
                .Include(a => a.Interviews)
                .Where(a => a.JobId == jobId)
                .OrderByDescending(a => a.AppliedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Application>> GetByUserIdAsync(int userId)
        {
            return await _context.Applications
                .AsNoTracking()
                .Include(a => a.Candidate!)
                    .ThenInclude(c => c.User)
                .Include(a => a.Candidate!)
                    .ThenInclude(c => c.CandidateTags)
                        .ThenInclude(ct => ct.Tag)
                .Include(a => a.Candidate!)
                    .ThenInclude(c => c.Experiences)
                .Include(a => a.Job!)
                    .ThenInclude(j => j.Company)
                .Include(a => a.Job!)
                    .ThenInclude(j => j.Location)
                .Include(a => a.Job!)
                    .ThenInclude(j => j.JobTags)
                        .ThenInclude(jt => jt.Tag)
                .Include(a => a.Interviews)
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.AppliedDate)
                .ToListAsync();
        }

        // KIỂM TRA & THỐNG KÊ
        public async Task<bool> IsAppliedAsync(int userId, int jobId)
        {
            return await _context.Applications
                .AsNoTracking()
                .AnyAsync(a => a.UserId == userId && a.JobId == jobId);
        }

        public async Task<int> GetApplicationCountByJobIdAsync(int jobId)
        {
            return await _context.Applications
                .AsNoTracking()
                .CountAsync(a => a.JobId == jobId);
        }

        public async Task<Dictionary<int, int>> GetApplicationStatusStatisticsAsync(int jobId)
        {
            // Trả về kiểu: { 0: 10, 1: 5, 2: 3 } -> (10 Pending, 5 Accepted, 3 Rejected)
            return await _context.Applications
                .AsNoTracking()
                .Where(a => a.JobId == jobId)
                .GroupBy(a => a.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Status, x => x.Count);
        }

        public async Task<Notification> UpdateStatusWithInterviewAsync(Application application, Interview? interviewRecord, string jobTitle, string stageName)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (interviewRecord != null)
                {
                    await _context.Interviews.AddAsync(interviewRecord);
                }

                _context.Applications.Update(application);

                var createdNotification = new Notification
                {
                    UserId = application.UserId,
                    Title = $"Cập nhật hồ sơ ứng tuyển: {jobTitle}",
                    Content = $"Trạng thái hồ sơ của bạn đã chuyển sang bước '{stageName}'. Vui lòng kiểm tra chi tiết.",
                    CreatedAt = DateTime.UtcNow
                };
                await _context.Notifications.AddAsync(createdNotification);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return createdNotification;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<(int recruiterUserId, Notification? notification, Message? welcomeMessage, string candidateName, string? candidateAvatar)> CreateInitialChatAndNotificationAsync(int candidateUserId, Job job)
        {
            int recruiterUserId = 0;
            if (job.PostedByUserId.HasValue && job.PostedByUserId.Value != candidateUserId)
            {
                recruiterUserId = job.PostedByUserId.Value;
            }
            else if (job.CompanyId.HasValue)
            {
                recruiterUserId = await _context.Recruiters
                    .AsNoTracking()
                    .Where(r => r.CompanyId == job.CompanyId && r.UserId != candidateUserId)
                    .OrderBy(r => r.UserId)
                    .Select(r => r.UserId)
                    .FirstOrDefaultAsync();
            }

            if (recruiterUserId <= 0)
                return (0, null, null, "Ứng viên", null);

            var candidateUser = await _context.Users
                .AsNoTracking()
                .Where(u => u.UserId == candidateUserId)
                .Select(u => new { u.FullName, u.Avatar })
                .FirstOrDefaultAsync();

            string candidateName = candidateUser?.FullName ?? "Ứng viên";

            var notification = new Notification
            {
                UserId = recruiterUserId,
                Title = $"Ứng viên mới nộp CV: {job.Title}",
                Content = $"{candidateName} vừa ứng tuyển vào vị trí \"{job.Title}\".",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            await _context.Notifications.AddAsync(notification);

            bool hasExistingChat = await _context.Messages
                .AsNoTracking()
                .AnyAsync(m => m.JobId == job.JobId &&
                    ((m.SenderId == candidateUserId && m.ReceiverId == recruiterUserId) ||
                     (m.SenderId == recruiterUserId && m.ReceiverId == candidateUserId)));

            Message? welcomeMessage = null;
            if (!hasExistingChat)
            {
                welcomeMessage = new Message
                {
                    SenderId = candidateUserId,
                    ReceiverId = recruiterUserId,
                    JobId = job.JobId,
                    Content = $"Xin chào, tôi vừa ứng tuyển vào vị trí \"{job.Title}\". Rất mong nhận được phản hồi từ Quý công ty.",
                    IsRead = false,
                    SentAt = DateTime.UtcNow
                };
                await _context.Messages.AddAsync(welcomeMessage);
            }

            await _context.SaveChangesAsync();
            return (recruiterUserId, notification, welcomeMessage, candidateName, candidateUser?.Avatar);
        }

        public async Task<bool> CanUserAccessCvAsync(string cvPath, int currentUserId, string userRole, CancellationToken cancellationToken = default)
        {
            // Chặn tuyệt đối tấn công Path Traversal (../, \, %2e%2e)
            if (string.IsNullOrWhiteSpace(cvPath) ||
                cvPath.Contains("..", StringComparison.Ordinal) ||
                cvPath.Contains('\\') ||
                cvPath.Contains("%2e", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            if (userRole == UserRoles.Admin)
                return true;

            if (userRole == UserRoles.Candidate)
            {
                // Chỉ khớp nếu đường dẫn bắt đầu chính xác bằng supabase://<bucket>/candidate_<id>/<filename>.pdf (không có thư mục con hay ../)
                bool isStrictOwnerPath = System.Text.RegularExpressions.Regex.IsMatch(
                    cvPath,
                    $@"^supabase://[a-zA-Z0-9_\-]+/candidate_{currentUserId}/[a-zA-Z0-9_\-]+\.pdf$",
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase);

                return isStrictOwnerPath
                    || await _context.Candidates.AsNoTracking().AnyAsync(c => c.UserId == currentUserId && c.CVUrl == cvPath, cancellationToken)
                    || await _context.Applications.AsNoTracking().AnyAsync(a => a.UserId == currentUserId && a.CVUrl == cvPath, cancellationToken);
            }

            if (userRole == UserRoles.Recruiter || userRole == UserRoles.Company)
            {
                int? effectiveCompanyId = await _context.Recruiters
                    .AsNoTracking()
                    .Where(r => r.UserId == currentUserId)
                    .Select(r => r.CompanyId)
                    .FirstOrDefaultAsync(cancellationToken);

                if (effectiveCompanyId == null && userRole == UserRoles.Company)
                {
                    effectiveCompanyId = await _context.Companies
                        .AsNoTracking()
                        .Where(c => c.MasterUserId == currentUserId)
                        .Select(c => (int?)c.CompanyId)
                        .FirstOrDefaultAsync(cancellationToken);
                }

                return await _context.Applications
                    .AsNoTracking()
                    .AnyAsync(a =>
                        (a.CVUrl == cvPath || (a.Candidate != null && a.Candidate.CVUrl == cvPath)) &&
                        ((effectiveCompanyId != null && a.Job != null && a.Job.CompanyId == effectiveCompanyId) ||
                         (a.Job != null && a.Job.PostedByUserId == currentUserId)),
                        cancellationToken);
            }

            return false;
        }
    }
}