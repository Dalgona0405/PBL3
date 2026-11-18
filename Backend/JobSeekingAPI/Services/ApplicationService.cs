using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Hubs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;
using Microsoft.AspNetCore.SignalR;
using System.Text.Json;

namespace JobSeekingAPI.Services
{
    public class ApplicationService : IApplicationService
    {
        private readonly IApplicationRepository _appRepo;
        private readonly IJobRepository _jobRepo;
        private readonly ICandidateRepository _candidateRepo;
        private readonly ICompanyRepository _companyRepo;
        private readonly INotificationRepository _notificationRepo;
        private readonly IMatchingService _matchingService;
        private readonly IEmailService _emailService;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ILogger<ApplicationService> _logger;

        public ApplicationService(
            IApplicationRepository appRepo,
            IJobRepository jobRepo,
            ICandidateRepository candidateRepo,
            ICompanyRepository companyRepo,
            INotificationRepository notificationRepo,
            IMatchingService matchingService,
            IEmailService emailService,
            IHubContext<ChatHub> hubContext,
            ILogger<ApplicationService> logger)
        {
            _appRepo = appRepo;
            _jobRepo = jobRepo;
            _candidateRepo = candidateRepo;
            _companyRepo = companyRepo;
            _notificationRepo = notificationRepo;
            _matchingService = matchingService;
            _emailService = emailService;
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task<ApplicationDetailDTO> GetApplicationByIdAsync(int id)
        {
            var application = await _appRepo.GetApplicationDetailByIdAsync(id)
                ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ ứng tuyển.");

            return application.ToDetailDto();
        }

        public async Task<IEnumerable<ApplicationDetailDTO>> GetApplicationsByJobAsync(int jobId, int userId, string role)
        {
            await CheckRecruiterOwnershipAsync(jobId, userId, role);

            var applications = await _appRepo.GetByJobIdAsync(jobId);
            return applications.Select(a => a.ToDetailDto());
        }

        public async Task<IEnumerable<ApplicationDetailDTO>> GetMyApplicationsAsync(int userId)
        {
            var applications = await _appRepo.GetByUserIdAsync(userId);
            return applications.Select(a => a.ToDetailDto());
        }

        public async Task<IEnumerable<ApplicationDetailDTO>> GetApplicationsByUserAsync(int userId)
        {
            var applications = await _appRepo.GetByUserIdAsync(userId);
            return applications.Select(a => a.ToDetailDto());
        }

        /// <summary>
        /// Ứng viên nộp hồ sơ -> Tự động chấm điểm AI GNN + Lưu Breakdown vào DB để phục vụ lọc ATS!
        /// </summary>
        public async Task<ApplicationDetailDTO> ApplyForJobAsync(CreateApplicationDTO dto)
        {
            var candidate = await _candidateRepo.GetByIdAsync(dto.UserId)
                ?? throw new ArgumentException("Không tìm thấy thông tin ứng viên.");

            var job = await _jobRepo.GetByIdAsync(dto.JobId);
            if (job == null || job.DeletedAt.HasValue)
                throw new KeyNotFoundException("Không tìm thấy tin tuyển dụng.");

            if (!string.IsNullOrWhiteSpace(job.OriginalId))
                throw new ArgumentException("Đây là tin tuyển dụng tổng hợp thị trường, không hỗ trợ nộp hồ sơ trực tiếp trên hệ thống.");

            if (job.Status != (int)JobStatus.Active)
                throw new ArgumentException("Tin tuyển dụng này đang đóng nhận hồ sơ.");

            if (job.Deadline.HasValue && job.Deadline.Value < DateTime.UtcNow)
                throw new ArgumentException("Tin tuyển dụng này đã hết hạn nộp hồ sơ.");

            var hasApplied = await _appRepo.IsAppliedAsync(dto.UserId, dto.JobId);
            if (hasApplied)
                throw new ArgumentException("Bạn đã ứng tuyển vào công việc này rồi.");

            if (!string.IsNullOrWhiteSpace(dto.CVUrl))
            {
                FileSignatureValidator.EnsureCvBelongsToCandidate(dto.CVUrl, dto.UserId);
            }

            string finalCvUrl = !string.IsNullOrWhiteSpace(dto.CVUrl)
                ? dto.CVUrl.Trim()
                : (candidate.CVUrl ?? "");
            if (string.IsNullOrWhiteSpace(finalCvUrl))
                throw new ArgumentException("Vui lòng cung cấp CV để ứng tuyển.");

            // Tự động tính điểm AI Matching ngay thời điểm nộp đơn
            double? aiScore = null;
            string? aiBreakdownJson = null;
            try
            {
                var matchResult = await _matchingService.GetJobMatchScoreAsync(dto.JobId, dto.UserId);
                aiScore = matchResult.MatchScore;
                aiBreakdownJson = JsonSerializer.Serialize(new
                {
                    matchResult.Breakdown,
                    matchResult.MissingSkills,
                    matchResult.Advice
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not pre-compute AI Match Score for User {UserId} on Job {JobId}", dto.UserId, dto.JobId);
            }

            var application = new Application
            {
                UserId = dto.UserId,
                JobId = dto.JobId,
                CVUrl = finalCvUrl,
                Status = (int)ApplicationStatus.Applied,
                AiMatchScore = aiScore,
                AiScoreBreakdown = aiBreakdownJson
            };

            var createdApp = await _appRepo.CreateApplicationDetailAsync(application);
            await InitializeChatAndNotifyRecruiterAsync(dto.UserId, job);

            var fullApp = await _appRepo.GetApplicationDetailByIdAsync(createdApp.AppId);
            return fullApp!.ToDetailDto();
        }

        public async Task UpdateApplicationAsync(int id, UpdateApplicationDTO dto, int userId)
        {
            var existApplication = await _appRepo.GetApplicationEntityByIdAsync(id)
                ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ ứng tuyển.");

            if (existApplication.UserId != userId)
                throw new ForbiddenAccessException("Bạn không có quyền thao tác trên hồ sơ ứng tuyển này.");

            if (!string.IsNullOrWhiteSpace(dto.CVUrl))
            {
                FileSignatureValidator.EnsureCvBelongsToCandidate(dto.CVUrl, userId);
                existApplication.CVUrl = dto.CVUrl.Trim();
            }

            existApplication.UpdatedAt = DateTime.UtcNow;
            await _appRepo.UpdateAsync(existApplication);
        }

        /// <summary>
        /// Kéo-thả thẻ ứng viên trên Kanban ATS -> Kiểm tra State Transition -> Lưu lịch Interviews -> Gửi Email + .ics
        /// </summary>
        public async Task UpdateApplicationStatusAsync(int id, UpdateApplicationStatusDTO dto, int userId, string role)
        {
            var fullApplication = await _appRepo.GetApplicationDetailByIdAsync(id)
                ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ ứng tuyển.");

            var existApplication = await _appRepo.GetApplicationEntityByIdAsync(id)
                ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ ứng tuyển.");

            await CheckRecruiterOwnershipAsync(existApplication.JobId, userId, role);

            // Nếu trạng thái mới trùng hệt trạng thái hiện tại -> Chỉ cập nhật ghi chú (nếu có), không gửi lại Email/Notification!
            if (existApplication.Status == dto.Status)
            {
                if (!string.IsNullOrWhiteSpace(dto.Message))
                {
                    existApplication.Message = dto.Message;
                    existApplication.UpdatedAt = DateTime.UtcNow;
                    await _appRepo.UpdateAsync(existApplication);
                }
                return;
            }

            // Kiểm tra hợp lệ theo bảng chuyển trạng thái (State Machine Transition Table)
            ValidateStateTransition(existApplication.Status, dto.Status);

            string? calendarUid = null;
            DateTime startUtc = DateTime.UtcNow;
            DateTime endUtc = DateTime.UtcNow;
            string locationOrLink = dto.MeetingLink ?? dto.InterviewLocation ?? "Google Meet";
            Notification? createdNotification = null;

            existApplication.Status = dto.Status;
            existApplication.Message = dto.Message ?? existApplication.Message;
            existApplication.UpdatedAt = DateTime.UtcNow;

            Interview? interviewRecord = null;
            if (dto.Status == (int)ApplicationStatus.InterviewScheduled)
            {
                // Bắt buộc phải có thời gian phỏng vấn khi chuyển sang cột InterviewScheduled
                if (!dto.InterviewTime.HasValue)
                    throw new ArgumentException("Vui lòng chọn thời gian bắt đầu phỏng vấn.");

                if (dto.InterviewTime.Value < DateTime.UtcNow.AddMinutes(-5))
                    throw new ArgumentException("Thời gian phỏng vấn phải ở trong tương lai.");

                startUtc = dto.InterviewTime.Value;
                endUtc = dto.InterviewEndTime ?? startUtc.AddHours(1);
                calendarUid = $"interview-{existApplication.AppId}-{Guid.NewGuid():N}@jobseeking.vn";

                existApplication.InterviewTime = startUtc;
                existApplication.InterviewLocation = locationOrLink;

                // Lưu bản ghi lịch hẹn vào bảng Interviews mới (SRS FR-5.1)
                interviewRecord = new Interview
                {
                    ApplicationId = existApplication.AppId,
                    ScheduledAt = startUtc,
                    EndAt = endUtc,
                    InterviewType = dto.InterviewType ?? "Online",
                    MeetingLink = dto.MeetingLink,
                    Location = dto.InterviewLocation,
                    Notes = dto.Message,
                    CalendarEventUid = calendarUid,
                    CreatedAt = DateTime.UtcNow
                };
            }

            string stageName = MappingExtensions.ToPipelineStageName(dto.Status);
            createdNotification = await _appRepo.UpdateStatusWithInterviewAsync(
                existApplication,
                interviewRecord,
                fullApplication.Job?.Title ?? "Công việc",
                stageName);

            if (createdNotification != null)
            {
                try
                {
                    await _hubContext.Clients.User(existApplication.UserId.ToString())
                        .SendAsync("ReceiveNotification", createdNotification.ToDto());
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not push SignalR notification to User {UserId}", existApplication.UserId);
                }
            }

            // Kích hoạt gửi Email tự động sau khi Database Transaction đã Commit thành công (SRS FR-5.2)
            var candidateEmail = fullApplication.Candidate?.User?.Email;
            var candidateName = fullApplication.Candidate?.User?.FullName ?? "Ứng viên";
            var jobTitle = fullApplication.Job?.Title ?? "Vị trí tuyển dụng";
            var companyName = fullApplication.Job?.Company?.CompanyName ?? "Doanh nghiệp";

            if (!string.IsNullOrWhiteSpace(candidateEmail))
            {
                if (dto.Status == (int)ApplicationStatus.InterviewScheduled && calendarUid != null)
                {
                    _ = _emailService.SendInterviewInvitationAsync(
                        candidateEmail,
                        candidateName,
                        jobTitle,
                        companyName,
                        startUtc,
                        endUtc,
                        dto.InterviewType ?? "Online",
                        locationOrLink,
                        dto.Message,
                        calendarUid);
                }
                else if (dto.Status is (int)ApplicationStatus.Offered or (int)ApplicationStatus.Hired or (int)ApplicationStatus.Rejected)
                {
                    _ = _emailService.SendApplicationStatusEmailAsync(
                        candidateEmail,
                        candidateName,
                        jobTitle,
                        companyName,
                        MappingExtensions.ToPipelineStageName(dto.Status),
                        dto.Message);
                }
            }
        }

        public async Task WithdrawApplicationAsync(int id, int userId)
        {
            var application = await _appRepo.GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ ứng tuyển.");

            if (application.UserId != userId)
                throw new ForbiddenAccessException("Bạn không có quyền thao tác trên hồ sơ ứng tuyển này.");

            await _appRepo.SoftDeleteApplicationAsync(id);
        }

        public async Task<object> GetApplicationStatisticsAsync(int jobId, int userId, string role)
        {
            await CheckRecruiterOwnershipAsync(jobId, userId, role);

            var statistics = await _appRepo.GetApplicationStatusStatisticsAsync(jobId);
            var total = statistics?.Sum(kv => kv.Value) ?? 0;

            return new
            {
                TotalApplications = total,
                Applied = statistics?.GetValueOrDefault((int)ApplicationStatus.Applied, 0) ?? 0,
                Screening = statistics?.GetValueOrDefault((int)ApplicationStatus.Screening, 0) ?? 0,
                InterviewScheduled = statistics?.GetValueOrDefault((int)ApplicationStatus.InterviewScheduled, 0) ?? 0,
                Offered = statistics?.GetValueOrDefault((int)ApplicationStatus.Offered, 0) ?? 0,
                Hired = statistics?.GetValueOrDefault((int)ApplicationStatus.Hired, 0) ?? 0,
                Rejected = statistics?.GetValueOrDefault((int)ApplicationStatus.Rejected, 0) ?? 0,
                // Giữ các trường cũ để Frontend hiện tại không bị gãy biểu đồ
                Pending = statistics?.GetValueOrDefault((int)ApplicationStatus.Applied, 0) ?? 0,
                Reviewed = statistics?.GetValueOrDefault((int)ApplicationStatus.Screening, 0) ?? 0,
                Interviewing = statistics?.GetValueOrDefault((int)ApplicationStatus.InterviewScheduled, 0) ?? 0,
                Accepted = statistics?.GetValueOrDefault((int)ApplicationStatus.Hired, 0) ?? 0
            };
        }

        public async Task VerifyCvAccessAsync(string cvPath, int currentUserId, string userRole, CancellationToken cancellationToken = default)
        {
            bool allowed = await _appRepo.CanUserAccessCvAsync(cvPath, currentUserId, userRole, cancellationToken);
            if (!allowed)
            {
                string message = userRole == UserRoles.Candidate
                    ? "Bạn không có quyền truy cập hồ sơ CV riêng tư của ứng viên khác."
                    : (userRole == UserRoles.Recruiter || userRole == UserRoles.Company)
                        ? "Bạn chỉ có quyền xem CV của ứng viên đã nộp đơn vào tin tuyển dụng của bạn hoặc công ty bạn."
                        : "Bạn không có quyền truy cập tài nguyên này.";
                throw new ForbiddenAccessException(message);
            }
        }

        // --- CÁC HÀM PRIVATE HỖ TRỢ ---

        private async Task InitializeChatAndNotifyRecruiterAsync(int candidateUserId, Job job)
        {
            try
            {
                var (recruiterUserId, notification, welcomeMessage, candidateName, candidateAvatar) =
                    await _appRepo.CreateInitialChatAndNotificationAsync(candidateUserId, job);

                if (recruiterUserId <= 0 || notification == null)
                    return;

                await _hubContext.Clients.User(recruiterUserId.ToString())
                    .SendAsync("ReceiveNotification", notification.ToDto());

                if (welcomeMessage != null)
                {
                    await _hubContext.Clients.User(recruiterUserId.ToString())
                        .SendAsync("ReceiveMessage", new MessageResponseDTO
                        {
                            MessageId = welcomeMessage.MessageId,
                            SenderId = candidateUserId,
                            SenderName = candidateName,
                            SenderAvatar = candidateAvatar,
                            ReceiverId = recruiterUserId,
                            JobId = job.JobId,
                            JobTitle = job.Title,
                            Content = welcomeMessage.Content,
                            IsRead = false,
                            SentAt = welcomeMessage.SentAt
                        });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not auto-initialize chat channel for User {UserId} on Job {JobId}", candidateUserId, job.JobId);
            }
        }

        // Bảng định nghĩa các luồng chuyển trạng thái hợp lệ trên Kanban ATS (Finite State Machine)
        private static readonly Dictionary<int, HashSet<int>> AllowedStageTransitions = new()
        {
            // Từ Applied (1) -> Được sang Screening (2), InterviewScheduled (3), hoặc Rejected (6)
            [(int)ApplicationStatus.Applied] = new() { (int)ApplicationStatus.Screening, (int)ApplicationStatus.InterviewScheduled, (int)ApplicationStatus.Rejected },

            // Từ Screening (2) -> Được sang InterviewScheduled (3), Offered (4), hoặc Rejected (6)
            [(int)ApplicationStatus.Screening] = new() { (int)ApplicationStatus.InterviewScheduled, (int)ApplicationStatus.Offered, (int)ApplicationStatus.Rejected },

            // Từ InterviewScheduled (3) -> Được sang Screening (2), Offered (4), Hired (5), hoặc Rejected (6)
            [(int)ApplicationStatus.InterviewScheduled] = new() { (int)ApplicationStatus.Screening, (int)ApplicationStatus.Offered, (int)ApplicationStatus.Hired, (int)ApplicationStatus.Rejected },

            // Từ Offered (4) -> Được sang Hired (5) hoặc Rejected (6)
            [(int)ApplicationStatus.Offered] = new() { (int)ApplicationStatus.Hired, (int)ApplicationStatus.Rejected },

            // Hired (5) và Rejected (6) là trạng thái kết thúc (Terminal States), chỉ cho phép Rejected mở lại sang Screening nếu xem xét lại
            [(int)ApplicationStatus.Hired] = new(),
            [(int)ApplicationStatus.Rejected] = new() { (int)ApplicationStatus.Screening }
        };

        private static void ValidateStateTransition(int currentStatus, int newStatus)
        {
            if (newStatus < 1 || newStatus > 6)
                throw new ArgumentException("Trạng thái Pipeline không hợp lệ (Chỉ chấp nhận từ 1 đến 6).");

            if (!AllowedStageTransitions.TryGetValue(currentStatus, out var allowedNextStages) ||
                !allowedNextStages.Contains(newStatus))
            {
                string fromStage = MappingExtensions.ToPipelineStageName(currentStatus);
                string toStage = MappingExtensions.ToPipelineStageName(newStatus);
                throw new ArgumentException($"Chuyển trạng thái không hợp lệ: Không thể chuyển trực tiếp từ bước '{fromStage}' sang '{toStage}'.");
            }
        }

        private async Task CheckRecruiterOwnershipAsync(int jobId, int userId, string role)
        {
            var jobExists = await _jobRepo.GetByIdAsync(jobId)
                ?? throw new KeyNotFoundException("Không tìm thấy tin tuyển dụng.");

            if (role == UserRoles.Recruiter || role == UserRoles.Company)
            {
                if (jobExists.CompanyId.HasValue)
                {
                    var recruiterCompanyId = await _companyRepo.GetCompanyIdByRecruiterIdAsync(userId);
                    if (recruiterCompanyId == null || recruiterCompanyId.Value != jobExists.CompanyId.Value)
                    {
                        throw new ForbiddenAccessException("Bạn không có quyền truy cập hồ sơ ứng tuyển của doanh nghiệp khác.");
                    }
                    return;
                }


                if (!jobExists.PostedByUserId.HasValue || jobExists.PostedByUserId.Value != userId)
                {
                    throw new ForbiddenAccessException("Bạn không có quyền thao tác trên hồ sơ ứng tuyển này.");
                }
            }
        }
    }
}