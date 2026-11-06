using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    public class ApplicationService : IApplicationService
    {
        private readonly IApplicationRepository _appRepo;
        private readonly IJobRepository _jobRepo;
        private readonly ICandidateRepository _candidateRepo;
        private readonly ICompanyRepository _companyRepo;
        private readonly INotificationRepository _notificationRepo;

        public ApplicationService(IApplicationRepository appRepo, IJobRepository jobRepo, ICandidateRepository candidateRepo, ICompanyRepository companyRepo, INotificationRepository notificationRepo)
        {
            _appRepo = appRepo;
            _jobRepo = jobRepo;
            _candidateRepo = candidateRepo;
            _companyRepo = companyRepo;
            _notificationRepo = notificationRepo;
        }

        public async Task<ApplicationDetailDTO> GetApplicationByIdAsync(int id)
        {
            var application = await _appRepo.GetApplicationDetailByIdAsync(id);
            if (application == null)
                throw new KeyNotFoundException("Application not found");

            return MapToDTO(application);
        }

        public async Task<IEnumerable<ApplicationDetailDTO>> GetApplicationsByJobAsync(int jobId, int userId, string role)
        {
            await CheckRecruiterOwnershipAsync(jobId, userId, role);

            var applications = await _appRepo.GetByJobIdAsync(jobId);
            return applications.Select(a => MapToDTO(a));
        }

        public async Task<IEnumerable<ApplicationDetailDTO>> GetMyApplicationsAsync(int userId)
        {
            var applications = await _appRepo.GetByUserIdAsync(userId);
            return applications.Select(a => MapToDTO(a));
        }

        public async Task<IEnumerable<ApplicationDetailDTO>> GetApplicationsByUserAsync(int userId)
        {
            var applications = await _appRepo.GetByUserIdAsync(userId);
            return applications.Select(a => MapToDTO(a));
        }

        public async Task<ApplicationDetailDTO> ApplyForJobAsync(CreateApplicationDTO dto)
        {
            var candidate = await _candidateRepo.GetByIdAsync(dto.UserId);
            if (candidate == null)
                throw new ArgumentException("Candidate not found!");

            var job = await _jobRepo.GetByIdAsync(dto.JobId);
            if (job == null)
                throw new KeyNotFoundException("Job not found!");

            if (job.Deadline.HasValue && job.Deadline.Value < DateTime.UtcNow)
                throw new ArgumentException("This job is already expired!");

            var hasApplied = await _appRepo.IsAppliedAsync(dto.UserId, dto.JobId);
            if (hasApplied)
                throw new ArgumentException("You have already applied for this job!");

            string finalCvUrl = dto.CVUrl ?? candidate.CVUrl ?? "";
            if (string.IsNullOrWhiteSpace(finalCvUrl))
                throw new ArgumentException("Please provide a CV to apply");

            var application = new Application
            {
                UserId = dto.UserId,
                JobId = dto.JobId,
                CVUrl = finalCvUrl,
            };

            var createdApp = await _appRepo.CreateApplicationDetailAsync(application);

            // Lấy lại detail để map ra DTO đầy đủ thông tin
            var fullApp = await _appRepo.GetApplicationDetailByIdAsync(createdApp.AppId);
            return MapToDTO(fullApp!);
        }

        public async Task UpdateApplicationAsync(int id, UpdateApplicationDTO dto, int userId)
        {
            var existApplication = await _appRepo.GetApplicationEntityByIdAsync(id);
            if (existApplication == null)
                throw new KeyNotFoundException("Application not found");

            if (existApplication.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission to update this application.");

            existApplication.CVUrl = dto.CVUrl ?? existApplication.CVUrl;
            existApplication.UpdatedAt = DateTime.UtcNow;
            await _appRepo.UpdateAsync(existApplication);
        }

        public async Task UpdateApplicationStatusAsync(int id, UpdateApplicationStatusDTO dto, int userId, string role)
        {
            var existApplication = await _appRepo.GetApplicationEntityByIdAsync(id);
            if (existApplication == null)
                throw new KeyNotFoundException("Application not found!");

            await CheckRecruiterOwnershipAsync(existApplication.JobId, userId, role);

            existApplication.Status = dto.Status;
            existApplication.Message = dto.Message ?? existApplication.Message;
            if (dto.Status == (int)ApplicationStatus.Interviewing)
            {
                if (dto.InterviewTime.HasValue && dto.InterviewTime.Value < DateTime.UtcNow)
                    throw new ArgumentException("Interview time must be in the future!");
                existApplication.InterviewTime = dto.InterviewTime;
                existApplication.InterviewLocation = dto.InterviewLocation;
            }
            else
            {
                existApplication.InterviewTime = null;
                existApplication.InterviewLocation = null;
            }
            existApplication.UpdatedAt = DateTime.UtcNow;
            await _appRepo.UpdateAsync(existApplication);
            string statusName = dto.Status switch
            {
                (int)ApplicationStatus.Pending => "Pending",
                (int)ApplicationStatus.Reviewed => "Reviewed",
                (int)ApplicationStatus.Interviewing => "Interviewing",
                (int)ApplicationStatus.Accepted => "Accepted",
                (int)ApplicationStatus.Rejected => "Rejected",
                _ => "Unknown"
            };

            var notification = new Notification
            {
                UserId = existApplication.UserId,
                Title = $"Update on your application for {existApplication.Job?.Title ?? "a job"}",
                Content = $"Your application status has been updated to '{statusName}'. Let's see details.",
            };
            await _notificationRepo.CreateAsync(notification);
        }

        public async Task WithdrawApplicationAsync(int id, int userId)
        {
            var application = await _appRepo.GetByIdAsync(id);
            if (application == null)
                throw new KeyNotFoundException("Application not found!");

            if (application.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission to withdraw this application.");

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
                Pending = statistics?.FirstOrDefault(kv => kv.Key == (int)ApplicationStatus.Pending).Value ?? 0,
                Reviewed = statistics?.FirstOrDefault(kv => kv.Key == (int)ApplicationStatus.Reviewed).Value ?? 0,
                Interviewing = statistics?.FirstOrDefault(kv => kv.Key == (int)ApplicationStatus.Interviewing).Value ?? 0,
                Accepted = statistics?.FirstOrDefault(kv => kv.Key == (int)ApplicationStatus.Accepted).Value ?? 0,
                Rejected = statistics?.FirstOrDefault(kv => kv.Key == (int)ApplicationStatus.Rejected).Value ?? 0
            };
        }

        // --- CÁC HÀM PRIVATE HỖ TRỢ ---

        private async Task CheckRecruiterOwnershipAsync(int jobId, int userId, string role)
        {
            var jobExists = await _jobRepo.GetByIdAsync(jobId);
            if (jobExists == null)
                throw new KeyNotFoundException("Job not found!");

            if (role == UserRoles.Recruiter || role == UserRoles.Company) 
            {
                var recruiterCompanyId = await _companyRepo.GetCompanyIdByRecruiterIdAsync(userId);
                if (recruiterCompanyId == null || recruiterCompanyId != jobExists.CompanyId)
                {
                    throw new UnauthorizedAccessException("You do not have permission to access this job's applications.");
                }
            }
        }

        private ApplicationDetailDTO MapToDTO(Application a)
        {
            return new ApplicationDetailDTO
            {
                ApplicationId = a.AppId,
                UserId = a.UserId,
                JobId = a.JobId,
                AppliedDate = a.AppliedDate,
                Status = a.Status,
                Message = a.Message,
                InterviewTime = a.InterviewTime,
                InterviewLocation = a.InterviewLocation,
                CVUrl = a.CVUrl,
                UpdatedAt = a.UpdatedAt,

                Candidate = a.Candidate == null ? null : new CandidateSummaryDTO
                {
                    UserId = a.Candidate.UserId,
                    FullName = a.Candidate.User?.FullName ?? "Unknown",
                    Avatar = a.Candidate.User?.Avatar,
                    Email = a.Candidate.User?.Email,
                    CVUrl = a.Candidate.CVUrl
                },

                Job = a.Job == null ? null : new JobSummaryDTO
                {
                    JobId = a.Job.JobId,
                    Title = a.Job.Title,
                    SalaryMin = a.Job.SalaryMin,
                    SalaryMax = a.Job.SalaryMax,
                    CompanyName = a.Job.Company?.CompanyName ?? "Unknown",
                    LocationName = a.Job.Location?.LocationName ?? "Unknown",
                    Deadline = a.Job.Deadline
                }
            };
        }
    }
}