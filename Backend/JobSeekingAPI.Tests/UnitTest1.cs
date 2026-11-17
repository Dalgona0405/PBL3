using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Hubs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;
using JobSeekingAPI.Services;
using JobSeekingAPI.Validators;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace JobSeekingAPI.Tests
{
    /// <summary>
    /// Bộ kiểm thử đơn vị (Unit Tests) bảo vệ các luồng nghiệp vụ cốt lõi:
    /// 1. Quy tắc chuyển trạng thái Kanban ATS (State Machine Gatekeeping)
    /// 2. Phân quyền bảo mật chống IDOR (Freelance Recruiter, Company Recruiter & Private CV Access)
    /// 3. Cơ chế tự phục hồi (Graceful Degradation Fallback) khi Python AI Server ngắt kết nối
    /// 4. Kiểm tra tính hợp lệ của dữ liệu đầu vào (FluentValidation Rules)
    /// </summary>
    public class BusinessLogicAndSecurityTests
    {
        // =====================================================================
        // NHÓM 1: KIỂM THỬ QUY TRÌNH KANBAN ATS & CHỐNG IDOR TRUY CẬP CV
        // =====================================================================

        [Fact(DisplayName = "ATS_01: Chặn nhảy cóc trạng thái từ Applied (1) thẳng sang Hired (5)")]
        public async Task UpdateApplicationStatus_FromAppliedDirectlyToHired_ThrowsArgumentException()
        {
            // 1. ARRANGE (Chuẩn bị bối cảnh)
            var mockAppRepo = new Mock<IApplicationRepository>();
            var mockJobRepo = new Mock<IJobRepository>();
            var mockCandidateRepo = new Mock<ICandidateRepository>();
            var mockCompanyRepo = new Mock<ICompanyRepository>();
            var mockNotifRepo = new Mock<INotificationRepository>();
            var mockMatching = new Mock<IMatchingService>();
            var mockEmail = new Mock<IEmailService>();
            var mockHub = new Mock<IHubContext<ChatHub>>();
            var mockLogger = new Mock<ILogger<ApplicationService>>();

            int appId = 10;
            int jobId = 5;
            int recruiterUserId = 99;

            // Giả lập đơn ứng tuyển hiện đang ở bước 1 (Applied)
            var currentApp = new Application { AppId = appId, JobId = jobId, UserId = 20, Status = (int)ApplicationStatus.Applied };
            mockAppRepo.Setup(r => r.GetApplicationDetailByIdAsync(appId)).ReturnsAsync(currentApp);
            mockAppRepo.Setup(r => r.GetApplicationEntityByIdAsync(appId)).ReturnsAsync(currentApp);

            // Giả lập HR này chính là người đăng Job (Có quyền hợp lệ trên Job)
            mockJobRepo.Setup(r => r.GetByIdAsync(jobId))
                       .ReturnsAsync(new Job { JobId = jobId, PostedByUserId = recruiterUserId });

            var service = new ApplicationService(
                mockAppRepo.Object, mockJobRepo.Object, mockCandidateRepo.Object,
                mockCompanyRepo.Object, mockNotifRepo.Object, mockMatching.Object,
                mockEmail.Object, mockHub.Object, mockLogger.Object);

            var invalidUpdateDto = new UpdateApplicationStatusDTO
            {
                Status = (int)ApplicationStatus.Hired // Cố tình nhảy cóc sang bước 5 (Hired)
            };

            // 2. ACT & 3. ASSERT (Hành động & Kiểm chứng phải ném ra ArgumentException)
            var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
                service.UpdateApplicationStatusAsync(appId, invalidUpdateDto, recruiterUserId, UserRoles.Recruiter));

            Assert.Contains("Không thể chuyển trực tiếp", exception.Message);
        }

        [Fact(DisplayName = "ATS_02: Chặn ứng viên nộp hồ sơ vào tin tuyển dụng đã quá hạn Deadline")]
        public async Task ApplyForJob_WhenJobIsExpired_ThrowsArgumentException()
        {
            // 1. ARRANGE
            var mockAppRepo = new Mock<IApplicationRepository>();
            var mockJobRepo = new Mock<IJobRepository>();
            var mockCandidateRepo = new Mock<ICandidateRepository>();
            var mockCompanyRepo = new Mock<ICompanyRepository>();
            var mockNotifRepo = new Mock<INotificationRepository>();
            var mockMatching = new Mock<IMatchingService>();
            var mockEmail = new Mock<IEmailService>();
            var mockHub = new Mock<IHubContext<ChatHub>>();
            var mockLogger = new Mock<ILogger<ApplicationService>>();

            mockCandidateRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(new Candidate { UserId = 1, CVUrl = "supabase://resumes/cv.pdf" });

            // Giả lập công việc đã hết hạn từ 2 ngày trước
            mockJobRepo.Setup(r => r.GetByIdAsync(100)).ReturnsAsync(new Job
            {
                JobId = 100,
                Title = ".NET Backend Developer",
                Deadline = DateTime.UtcNow.AddDays(-2)
            });

            var service = new ApplicationService(
                mockAppRepo.Object, mockJobRepo.Object, mockCandidateRepo.Object,
                mockCompanyRepo.Object, mockNotifRepo.Object, mockMatching.Object,
                mockEmail.Object, mockHub.Object, mockLogger.Object);

            // 2. ACT & 3. ASSERT
            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                service.ApplyForJobAsync(new CreateApplicationDTO { UserId = 1, JobId = 100 }));

            Assert.Contains("hết hạn", ex.Message);
        }

        [Fact(DisplayName = "SEC_01: Chặn lỗ hổng IDOR khi HR công ty khác cố tình lấy Pre-signed URL xem trộm CV")]
        public async Task VerifyCvAccess_WhenRecruiterDoesNotOwnJobApplication_ThrowsForbiddenAccessException()
        {
            // 1. ARRANGE
            var mockAppRepo = new Mock<IApplicationRepository>();
            string targetCvPath = "supabase://resumes/candidate_5/secret_cv.pdf";
            int attackerRecruiterId = 88;

            // Repository xác nhận HR 88 không có bất kỳ ứng viên nào nộp CV này vào công ty mình
            mockAppRepo.Setup(r => r.CanUserAccessCvAsync(targetCvPath, attackerRecruiterId, UserRoles.Recruiter, default))
                       .ReturnsAsync(false);

            var service = new ApplicationService(
                mockAppRepo.Object,
                Mock.Of<IJobRepository>(),
                Mock.Of<ICandidateRepository>(),
                Mock.Of<ICompanyRepository>(),
                Mock.Of<INotificationRepository>(),
                Mock.Of<IMatchingService>(),
                Mock.Of<IEmailService>(),
                Mock.Of<IHubContext<ChatHub>>(),
                Mock.Of<ILogger<ApplicationService>>());

            // 2. ACT & 3. ASSERT (Phải ném ra đúng ForbiddenAccessException -> HTTP 403)
            await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
                service.VerifyCvAccessAsync(targetCvPath, attackerRecruiterId, UserRoles.Recruiter));
        }

        // =====================================================================
        // NHÓM 2: KIỂM THỬ QUYỀN SỞ HỮU TIN ĐĂNG CỦA FREELANCE RECRUITER
        // =====================================================================

        [Fact(DisplayName = "JOB_01: Freelance Recruiter (CompanyId = null) xóa bài đăng của người khác sẽ bị chặn 403")]
        public async Task DeleteJob_WhenFreelanceRecruiterDeletesAnotherUsersJob_ThrowsForbiddenAccessException()
        {
            // 1. ARRANGE
            var mockJobRepo = new Mock<IJobRepository>();
            var mockCompanyRepo = new Mock<ICompanyRepository>();
            var mockCandidateRepo = new Mock<ICandidateRepository>();

            int jobId = 50;
            int realOwnerUserId = 10;
            int hackerRecruiterId = 20;

            // Tin tuyển dụng này của Freelance Recruiter số 10 (CompanyId = null)
            mockJobRepo.Setup(r => r.GetJobEntityByIdAsync(jobId))
                       .ReturnsAsync(new Job { JobId = jobId, CompanyId = null, PostedByUserId = realOwnerUserId });

            // Hacker số 20 cũng là Freelance Recruiter (CompanyId = null)
            mockCompanyRepo.Setup(r => r.GetCompanyIdByRecruiterIdAsync(hackerRecruiterId))
                           .ReturnsAsync((int?)null);

            var jobService = new JobService(mockJobRepo.Object, mockCompanyRepo.Object, mockCandidateRepo.Object);

            // 2. ACT & 3. ASSERT
            await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
                jobService.DeleteJobAsync(jobId, hackerRecruiterId, isRecruiter: true));
        }

        // =====================================================================
        // NHÓM 3: KIỂM THỬ CƠ CHẾ TỰ PHỤC HỒI (FALLBACK) KHI PYTHON AI SẬP
        // =====================================================================

        [Fact(DisplayName = "AI_01: Khi Python AI Server sập, MatchingService tự động tính điểm Fallback chính xác")]
        public async Task GetJobMatchScore_WhenPythonAiIsDown_UsesCSharpFallbackAndCalculatesWeightedBreakdown()
        {
            // 1. ARRANGE
            var mockJobRepo = new Mock<IJobRepository>();
            var mockCandidateRepo = new Mock<ICandidateRepository>();

            // Công việc ở Đà Nẵng, yêu cầu 2 năm KN và 2 kỹ năng: C# (TagId = 1) và Docker (TagId = 2)
            mockJobRepo.Setup(r => r.GetJobDetailByIdAsync(1)).ReturnsAsync(new JobDetailDTO
            {
                JobId = 1,
                Title = ".NET Engineer",
                ExpYear = "2 năm",
                Location = new LocationSummaryDTO { LocationId = 1, LocationName = "Đà Nẵng" },
                Tags = new List<TagSummaryDTO>
                {
                    new TagSummaryDTO { TagId = 1, TagName = "C#", Type = "Skill" },
                    new TagSummaryDTO { TagId = 2, TagName = "Docker", Type = "Skill" }
                }
            });

            // Ứng viên sống tại Đà Nẵng, có 3 năm kinh nghiệm, biết C# (TagId = 1) nhưng thiếu Docker (TagId = 2)
            mockCandidateRepo.Setup(r => r.GetCandidateDetailByIdAsync(10)).ReturnsAsync(new Candidate
            {
                UserId = 10,
                Address = "Quận Hải Châu, Đà Nẵng",
                Experiences = new List<Experience>
                {
                    new Experience { StartDate = DateTime.UtcNow.AddYears(-3), EndDate = DateTime.UtcNow }
                }
            });

            mockCandidateRepo.Setup(r => r.GetTagsByCandidateIdAsync(10)).ReturnsAsync(new List<CandidateTag>
            {
                new CandidateTag { UserId = 10, TagId = 1, Tag = new Tag { TagId = 1, TagName = "C#", Type = "Skill" } }
            });

            // Cấu hình HttpClient trỏ vào một cổng không tồn tại để giả lập Python AI đang bị sập
            var httpClient = new HttpClient();
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?> { ["PythonAI:BaseUrl"] = "http://localhost:59999" })
                .Build();

            var matchingService = new MatchingService(
                mockJobRepo.Object,
                mockCandidateRepo.Object,
                httpClient,
                config,
                Mock.Of<ILogger<MatchingService>>());

            // 2. ACT
            var result = await matchingService.GetJobMatchScoreAsync(jobId: 1, candidateId: 10);

            // 3. ASSERT
            // Kỹ năng đạt 1/2 = 50% -> Trọng số 40% = 20 điểm
            // Kinh nghiệm 3 năm >= 2 năm = 100% -> Trọng số 30% = 30 điểm
            // Địa điểm khớp Đà Nẵng = 100% -> Trọng số 20% = 20 điểm
            // Lĩnh vực (Không yêu cầu Domain cụ thể) = 100% -> Trọng số 10% = 10 điểm
            // => Tổng điểm kỳ vọng = 20 + 30 + 20 + 10 = 80.0 điểm!
            Assert.Equal(80.0, result.MatchScore);
            Assert.Equal(20.0, result.Breakdown.SkillScore);
            Assert.Equal(30.0, result.Breakdown.ExperienceScore);
            Assert.Equal(20.0, result.Breakdown.LocationScore);
            Assert.Contains("Docker", result.MissingSkills);
        }

        // =====================================================================
        // NHÓM 4: KIỂM THỬ BỘ VALIDATION ĐẦU VÀO (FLUENT VALIDATION)
        // =====================================================================

        [Fact(DisplayName = "VAL_01: Chặn đăng tin tuyển dụng nếu Lương tối đa nhỏ hơn Lương tối thiểu")]
        public void CreateJobDTOValidator_WhenSalaryMaxLessThanSalaryMin_FailsValidation()
        {
            // 1. ARRANGE
            var validator = new CreateJobDTOValidator();
            var dto = new CreateJobDTO
            {
                Title = "Senior Backend .NET",
                LocationId = 1,
                SalaryMin = 30,
                SalaryMax = 15 // Lỗi logic: Max (15 triệu) < Min (30 triệu)
            };

            // 2. ACT
            var result = validator.Validate(dto);

            // 3. ASSERT
            Assert.False(result.IsValid);
            Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("Mức lương tối đa không được nhỏ hơn"));
        }

        [Fact(DisplayName = "VAL_02: Chặn đặt lịch phỏng vấn nếu Giờ kết thúc sớm hơn Giờ bắt đầu")]
        public void UpdateApplicationStatusDTOValidator_WhenInterviewEndBeforeStart_FailsValidation()
        {
            // 1. ARRANGE
            var validator = new UpdateApplicationStatusDTOValidator();
            var now = DateTime.UtcNow.AddDays(1);
            var dto = new UpdateApplicationStatusDTO
            {
                Status = (int)ApplicationStatus.InterviewScheduled,
                InterviewTime = now,
                InterviewEndTime = now.AddHours(-1) // Lỗi logic: Kết thúc trước khi bắt đầu 1 tiếng
            };

            // 2. ACT
            var result = validator.Validate(dto);

            // 3. ASSERT
            Assert.False(result.IsValid);
            Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("Thời gian kết thúc phỏng vấn phải sau thời gian bắt đầu"));
        }
    }
}