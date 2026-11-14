using System.Text.Json;
using System.Text.RegularExpressions;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Helpers
{
    /// <summary>
    /// Tập hợp các hàm mở rộng chuyển đổi tập trung từ Entity sang DTO
    /// </summary>
    public static class MappingExtensions
    {
        /// <summary>
        /// Chuyển đổi thực thể Job sang JobDetailDTO đầy đủ thông tin công ty, địa điểm và kỹ năng
        /// </summary>
        public static JobDetailDTO ToDetailDto(this Job j)
        {
            return new JobDetailDTO
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
                LocationName = j.Location?.LocationName,
                Company = j.Company?.ToSummaryDto(),
                Location = j.Location?.ToSummaryDto(),
                Tags = j.JobTags?
                    .Where(jt => jt.Tag != null)
                    .Select(jt => jt.Tag!.ToSummaryDto())
                    .ToList() ?? new List<TagSummaryDTO>(),
                ApplicationCount = j.Applications?.Count ?? 0
            };
        }

        /// <summary>
        /// Chuyển đổi thực thể Candidate sang CandidateDetailDTO kèm kỹ năng và kinh nghiệm
        /// </summary>
        public static CandidateDetailDTO ToDetailDto(this Candidate c)
        {
            return new CandidateDetailDTO
            {
                UserId = c.UserId,
                FullName = c.User?.FullName ?? string.Empty,
                Email = c.User?.Email,
                Avatar = c.User?.Avatar,
                Gender = c.Gender,
                Birthday = c.Birthday,
                Phone = c.Phone,
                Address = c.Address,
                CVUrl = c.CVUrl,
                Skills = c.CandidateTags?
                    .Where(ct => ct.Tag != null)
                    .Select(ct => ct.Tag!.TagName)
                    .ToList() ?? new List<string>(),
                Experiences = c.Experiences?
                    .Select(e => e.ToDetailDto())
                    .ToList() ?? new List<ExperienceDetailDTO>()
            };
        }

        /// <summary>
        /// Chuyển đổi thực thể Experience sang ExperienceDetailDTO
        /// </summary>
        public static ExperienceDetailDTO ToDetailDto(this Experience e)
        {
            return new ExperienceDetailDTO
            {
                ExpId = e.ExpId,
                UserId = e.UserId,
                JobTitle = e.JobTitle,
                CompanyName = e.CompanyName ?? string.Empty,
                StartDate = e.StartDate ?? DateTime.MinValue,
                EndDate = e.EndDate,
                Description = e.Description
            };
        }

        /// <summary>
        /// Chuyển đổi thực thể Recruiter sang RecruiterDetailDTO kèm danh sách việc làm của doanh nghiệp
        /// </summary>
        public static RecruiterDetailDTO ToDetailDto(this Recruiter r)
        {
            return new RecruiterDetailDTO
            {
                UserId = r.UserId,
                FullName = r.User?.FullName ?? "Unknown",
                Email = r.User?.Email ?? "Unknown",
                Avatar = r.User?.Avatar,
                Position = r.Position,
                LastLogin = r.User?.LastLogin,
                Company = r.Company?.ToSummaryDto(),
                Jobs = r.Company?.Jobs?.Select(j => new JobSummaryDTO
                {
                    JobId = j.JobId,
                    CompanyId = j.CompanyId,
                    PostedByUserId = j.PostedByUserId,
                    IsFreelanceRecruiter = j.CompanyId == null,
                    OriginalId = j.OriginalId,
                    CompanyName = r.Company?.CompanyName ?? "Nhà tuyển dụng độc lập (Chưa xác minh doanh nghiệp)",
                    IsCompanyVerified = r.Company?.IsVerified ?? false,
                    Title = j.Title,
                    SalaryMin = j.SalaryMin,
                    SalaryMax = j.SalaryMax,
                    LocationName = j.Location?.LocationName ?? string.Empty,
                    Deadline = j.Deadline,
                    Status = j.Status
                }).ToList() ?? new List<JobSummaryDTO>()
            };
        }

        /// <summary>
        /// Chuyển đổi thực thể User sang UserDetailDTO
        /// </summary>
        public static UserDetailDTO ToDetailDto(this User user)
        {
            return new UserDetailDTO
            {
                UserId = user.UserId,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                Avatar = user.Avatar,
                LastLogin = user.LastLogin,
                DeletedAt = user.DeletedAt
            };
        }

        /// <summary>
        /// Chuyển đổi thực thể Company sang CompanySummaryDTO
        /// </summary>
        public static CompanySummaryDTO ToSummaryDto(this Company c)
        {
            return new CompanySummaryDTO
            {
                CompanyId = c.CompanyId,
                CompanyName = c.CompanyName,
                LogoImg = c.LogoImg,
                Website = c.Website,
                Size = c.Size,
                TaxCode = c.TaxCode,
                IsVerified = c.IsVerified,
                VerifiedAt = c.VerifiedAt
            };
        }

        /// <summary>
        /// Chuyển đổi thực thể Location sang LocationSummaryDTO
        /// </summary>
        public static LocationSummaryDTO ToSummaryDto(this Location l, int jobCount = 0)
        {
            return new LocationSummaryDTO
            {
                LocationId = l.LocationId,
                LocationName = l.LocationName,
                JobCount = jobCount
            };
        }

        /// <summary>
        /// Chuyển đổi thực thể Tag sang TagSummaryDTO
        /// </summary>
        public static TagSummaryDTO ToSummaryDto(this Tag t)
        {
            return new TagSummaryDTO
            {
                TagId = t.TagId,
                TagName = t.TagName,
                Type = t.Type
            };
        }

        /// <summary>
        /// Chuyển đổi thực thể Recruiter sang RecruiterSummaryDTO
        /// </summary>
        public static RecruiterSummaryDTO ToSummaryDto(this Recruiter r)
        {
            return new RecruiterSummaryDTO
            {
                UserId = r.UserId,
                FullName = r.User?.FullName ?? "Unknown",
                Email = r.User?.Email ?? "Unknown",
                Position = r.Position,
                Avatar = r.User?.Avatar
            };
        }

        /// <summary>
        /// Chuyển đổi yêu cầu gia nhập doanh nghiệp sang CompanyRequestSummaryDTO
        /// </summary>
        public static CompanyRequestSummaryDTO ToSummaryDto(this CompanyJoinRequest r)
        {
            return new CompanyRequestSummaryDTO
            {
                RequestId = r.RequestId,
                UserId = r.UserId,
                RecruiterName = r.Recruiter?.User?.FullName ?? "Unknown",
                RecruiterEmail = r.Recruiter?.User?.Email ?? "Unknown",
                CompanyId = r.CompanyId,
                CompanyName = r.Company?.CompanyName ?? "Unknown",
                Status = r.Status,
                CreatedAt = r.CreatedAt
            };
        }

        /// <summary>
        /// Chuyển đổi thực thể Notification sang NotificationDTO
        /// </summary>
        public static NotificationDTO ToDto(this Notification n)
        {
            return new NotificationDTO
            {
                NotificationId = n.NotificationId,
                Title = n.Title,
                Content = n.Content,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            };
        }

        /// <summary>
        /// Ánh xạ mã trạng thái hồ sơ sang tên giai đoạn trong quy trình ATS Pipeline
        /// </summary>
        public static string ToPipelineStageName(int status)
        {
            return status switch
            {
                (int)ApplicationStatus.Applied => "Applied",
                (int)ApplicationStatus.Screening => "Screening",
                (int)ApplicationStatus.InterviewScheduled => "InterviewScheduled",
                (int)ApplicationStatus.Offered => "Offered",
                (int)ApplicationStatus.Hired => "Hired",
                (int)ApplicationStatus.Rejected => "Rejected",
                _ => "Applied"
            };
        }

        /// <summary>
        /// Chuyển đổi thực thể Application sang ApplicationDetailDTO
        /// </summary>
        public static ApplicationDetailDTO ToDetailDto(this Application a)
        {
            var latestInterview = a.Interviews?
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefault();

            var candidateSkills = a.Candidate?.CandidateTags?
                .Where(ct => ct.Tag != null && !string.IsNullOrWhiteSpace(ct.Tag.TagName))
                .Select(ct => ct.Tag!.TagName)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList() ?? new List<string>();

            double totalExpYears = CalculateTotalExperienceYears(a.Candidate?.Experiences);
            string expYearsText = totalExpYears > 0 ? $"{Math.Round(totalExpYears, 1):0.#} năm" : "Chưa có KN";

            double? aiScore = a.AiMatchScore;
            string? aiBreakdown = a.AiScoreBreakdown;
            if (!aiScore.HasValue && a.Job != null && a.Candidate != null)
            {
                (aiScore, aiBreakdown) = ComputeFallbackApplicationMatch(a, totalExpYears);
            }

            return new ApplicationDetailDTO
            {
                ApplicationId = a.AppId,
                UserId = a.UserId,
                JobId = a.JobId,
                AppliedDate = a.AppliedDate,
                Status = a.Status,
                PipelineStage = ToPipelineStageName(a.Status),
                Message = a.Message,
                InterviewTime = latestInterview?.ScheduledAt ?? a.InterviewTime,
                InterviewEndTime = latestInterview?.EndAt,
                InterviewType = latestInterview?.InterviewType,
                MeetingLink = latestInterview?.MeetingLink,
                InterviewLocation = latestInterview?.Location ?? a.InterviewLocation,
                CVUrl = a.CVUrl,
                AiMatchScore = aiScore,
                AiScoreBreakdown = aiBreakdown,
                UpdatedAt = a.UpdatedAt,

                Candidate = a.Candidate == null ? null : new CandidateSummaryDTO
                {
                    UserId = a.Candidate.UserId,
                    FullName = a.Candidate.User?.FullName ?? "Unknown",
                    Avatar = a.Candidate.User?.Avatar,
                    Email = a.Candidate.User?.Email,
                    CVUrl = a.Candidate.CVUrl,
                    Skills = candidateSkills,
                    ExperienceYears = expYearsText
                },

                Job = a.Job == null ? null : new JobSummaryDTO
                {
                    JobId = a.Job.JobId,
                    CompanyId = a.Job.CompanyId,
                    PostedByUserId = a.Job.PostedByUserId,
                    IsFreelanceRecruiter = a.Job.CompanyId == null,
                    Title = a.Job.Title,
                    SalaryMin = a.Job.SalaryMin,
                    SalaryMax = a.Job.SalaryMax,
                    ExpYear = a.Job.ExpYear,
                    Level = a.Job.Level,
                    CompanyName = a.Job.Company?.CompanyName ?? "Nhà tuyển dụng độc lập (Chưa xác minh doanh nghiệp)",
                    IsCompanyVerified = a.Job.Company?.IsVerified ?? false,
                    LocationName = a.Job.Location?.LocationName ?? "Unknown",
                    Deadline = a.Job.Deadline
                }
            };
        }

        private static double CalculateTotalExperienceYears(ICollection<Experience>? experiences)
        {
            if (experiences == null || experiences.Count == 0) return 0;

            double total = 0;
            foreach (var exp in experiences)
            {
                if (exp.StartDate.HasValue)
                {
                    var end = exp.EndDate ?? DateTime.UtcNow;
                    total += Math.Max(0, (end - exp.StartDate.Value).TotalDays / 365.0);
                }
            }
            return total;
        }

        private static (double score, string breakdownJson) ComputeFallbackApplicationMatch(Application a, double totalExpYears)
        {
            var candidateTagIds = a.Candidate!.CandidateTags.Select(ct => ct.TagId).ToHashSet();
            var jobSkillTags = a.Job!.JobTags
                .Where(jt => jt.Tag != null && jt.Tag.Type is "Skill" or "Language" or "Role")
                .ToList();
            var jobDomainTags = a.Job!.JobTags
                .Where(jt => jt.Tag != null && string.Equals(jt.Tag.Type, "Domain", StringComparison.OrdinalIgnoreCase))
                .ToList();

            double rawSkillScore = 100.0;
            var missingSkills = new List<string>();
            if (jobSkillTags.Count > 0)
            {
                int matched = 0;
                foreach (var jt in jobSkillTags)
                {
                    if (candidateTagIds.Contains(jt.TagId))
                        matched++;
                    else if (jt.Tag != null)
                        missingSkills.Add(jt.Tag.TagName);
                }
                rawSkillScore = Math.Round((double)matched / jobSkillTags.Count * 100.0, 1);
            }

            double rawDomainScore = 100.0;
            if (jobDomainTags.Count > 0)
            {
                int matchedDomains = jobDomainTags.Count(jt => candidateTagIds.Contains(jt.TagId));
                rawDomainScore = Math.Round((double)matchedDomains / jobDomainTags.Count * 100.0, 1);
            }

            double rawExpScore = 100.0;
            var expReq = a.Job.ExpYear;
            if (!string.IsNullOrWhiteSpace(expReq) && !expReq.Contains("Không yêu cầu", StringComparison.OrdinalIgnoreCase))
            {
                var numMatch = Regex.Match(expReq, @"\d+");
                if (numMatch.Success && double.TryParse(numMatch.Value, out double reqYears) && reqYears > 0)
                {
                    rawExpScore = totalExpYears >= reqYears ? 100.0 : Math.Round((totalExpYears / reqYears) * 100.0, 1);
                }
            }

            var jobLoc = a.Job.Location?.LocationName ?? "";
            var candAddr = a.Candidate.Address;
            double rawLocScore = string.IsNullOrWhiteSpace(jobLoc) || jobLoc.Contains("remote", StringComparison.OrdinalIgnoreCase)
                ? 100.0
                : string.IsNullOrWhiteSpace(candAddr)
                    ? 50.0
                    : candAddr.Contains(jobLoc, StringComparison.OrdinalIgnoreCase) ? 100.0 : 20.0;

            double weightedSkill = Math.Round(rawSkillScore * 0.4, 1);
            double weightedDomain = Math.Round(rawDomainScore * 0.1, 1);
            double weightedExp = Math.Round(rawExpScore * 0.3, 1);
            double weightedLoc = Math.Round(rawLocScore * 0.2, 1);
            double totalScore = Math.Round(weightedSkill + weightedDomain + weightedExp + weightedLoc, 1);

            string advice = missingSkills.Count == 0
                ? "Ứng viên đáp ứng tốt các kỹ năng cốt lõi của vị trí."
                : $"Ứng viên cần bổ sung thêm kỹ năng: {string.Join(", ", missingSkills.Take(3))}.";

            var payload = JsonSerializer.Serialize(new
            {
                Breakdown = new AiScoreBreakdownDTO
                {
                    SkillScore = weightedSkill,
                    ExperienceScore = weightedExp,
                    LocationScore = weightedLoc,
                    DomainScore = weightedDomain
                },
                MissingSkills = missingSkills,
                Advice = advice
            });

            return (totalScore, payload);
        }
    }
}
