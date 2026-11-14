using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;
using System.Text.RegularExpressions;

namespace JobSeekingAPI.Services
{
    /// <summary>
    /// Tính toán mức độ phù hợp giữa ứng viên và việc làm qua Python AI (kèm cơ chế tính dự phòng bằng C#)
    /// </summary>
    public class MatchingService : IMatchingService
    {
        private readonly IJobRepository _jobRepo;
        private readonly ICandidateRepository _candidateRepo;
        private readonly HttpClient _httpClient;
        private readonly ILogger<MatchingService> _logger;
        private readonly string _pythonBaseUrl;

        public MatchingService(
            IJobRepository jobRepo,
            ICandidateRepository candidateRepo,
            HttpClient httpClient,
            IConfiguration config,
            ILogger<MatchingService> logger)
        {
            _jobRepo = jobRepo;
            _candidateRepo = candidateRepo;
            _httpClient = httpClient;
            _logger = logger;
            _pythonBaseUrl = config["PythonAI:BaseUrl"] ?? "http://localhost:8000";

            // Đặt Timeout 3 giây để nếu Python AI bị treo, C# không bị đơ theo (Fail-fast)
            _httpClient.Timeout = TimeSpan.FromSeconds(3);
        }

        /// <summary>
        /// Tính điểm độ phù hợp (AI Match Score) cùng phân tích chi tiết cho một cặp Job - Candidate
        /// </summary>
        public async Task<JobMatchResultDTO> GetJobMatchScoreAsync(int jobId, int candidateId)
        {
            var job = await _jobRepo.GetJobDetailByIdAsync(jobId)
                ?? throw new KeyNotFoundException("Không tìm thấy tin tuyển dụng.");

            var candidate = await _candidateRepo.GetCandidateDetailByIdAsync(candidateId)
                ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ ứng viên.");

            var jobSkillTags = job.Tags
                .Where(t => t.Type is "Skill" or "Language" or "Role")
                .ToList();
            var jobSkillIds = jobSkillTags.Select(t => t.TagId).ToList();

            var candidateTags = await _candidateRepo.GetTagsByCandidateIdAsync(candidateId);
            var candidateSkillIds = candidateTags
                .Where(ct => ct.Tag != null && ct.Tag.Type is "Skill" or "Language" or "Role")
                .Select(ct => ct.TagId)
                .ToHashSet();
            var candidateDomainIds = candidateTags
                .Where(ct => ct.Tag != null && string.Equals(ct.Tag.Type, "Domain", StringComparison.OrdinalIgnoreCase))
                .Select(ct => ct.TagId)
                .ToHashSet();

            double rawDomainScore = CalculateDomainScore(job.Tags, candidateDomainIds);

            double aiSkillScore = 0;
            List<string> missingSkills = new();
            string aiAdvice = "";

            try
            {
                var payload = new { candidate_skills = candidateSkillIds.ToList(), job_skills = jobSkillIds };
                var response = await _httpClient.PostAsJsonAsync($"{_pythonBaseUrl}/api/matching/score", payload);

                if (response.IsSuccessStatusCode)
                {
                    var pythonResult = await response.Content.ReadFromJsonAsync<JobMatchResultDTO>();
                    if (pythonResult != null)
                    {
                        aiSkillScore = pythonResult.MatchScore;
                        missingSkills = pythonResult.MissingSkills;
                        aiAdvice = pythonResult.Advice ?? "";
                    }
                }
                else
                {
                    (aiSkillScore, missingSkills, aiAdvice) = CalculateFallbackSkillScore(jobSkillTags, candidateSkillIds);
                }
            }
            catch (Exception ex)
            {
                // Graceful Degradation: Nếu AI Server sập, tự động tính điểm dự phòng bằng C#
                _logger.LogWarning(ex, "Python AI unreachable for Job {JobId}. Using C# Fallback scoring.", jobId);
                (aiSkillScore, missingSkills, aiAdvice) = CalculateFallbackSkillScore(jobSkillTags, candidateSkillIds);
            }

            return BuildExplainableMatchResult(
                aiSkillScore,
                rawDomainScore,
                missingSkills,
                aiAdvice,
                job.ExpYear,
                candidate.Experiences,
                job.Location?.LocationName ?? "",
                candidate.Address);
        }

        /// <summary>
        /// Gợi ý Top N tin tuyển dụng phù hợp nhất cho ứng viên
        /// </summary>
        public async Task<List<JobSuggestionDTO>> GetTopJobSuggestionsForCandidateAsync(int candidateId, int topN = 6)
        {
            // 1. Lấy thông tin ứng viên & kỹ năng đúng 1 lần duy nhất
            var candidate = await _candidateRepo.GetCandidateDetailByIdAsync(candidateId)
                ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ ứng viên.");

            var candidateTags = await _candidateRepo.GetTagsByCandidateIdAsync(candidateId);
            var candidateSkillIds = candidateTags
                .Where(ct => ct.Tag != null && ct.Tag.Type is "Skill" or "Language" or "Role")
                .Select(ct => ct.TagId)
                .ToHashSet();
            var candidateDomainIds = candidateTags
                .Where(ct => ct.Tag != null && string.Equals(ct.Tag.Type, "Domain", StringComparison.OrdinalIgnoreCase))
                .Select(ct => ct.TagId)
                .ToHashSet();

            // 2. Lấy 100 công việc mới nhất (kèm sẵn Company, Location, JobTags trong 1 câu SQL)
            var recentJobs = (await _jobRepo.GetRecentJobsAsync(100)).ToList();
            if (!recentJobs.Any()) return new List<JobSuggestionDTO>();

            // 3. Đóng gói Batch Payload gửi sang Python AI trong 1 request duy nhất
            Dictionary<string, JobMatchResultDTO>? batchAiResults = null;
            try
            {
                var batchPayload = new
                {
                    candidate_skills = candidateSkillIds.ToList(),
                    jobs = recentJobs.Select(j => new
                    {
                        job_id = j.JobId,
                        job_skills = j.JobTags
                            .Where(jt => jt.Tag != null && jt.Tag.Type is "Skill" or "Language" or "Role")
                            .Select(jt => jt.TagId)
                            .ToList()
                    }).ToList()
                };

                var response = await _httpClient.PostAsJsonAsync($"{_pythonBaseUrl}/api/matching/batch-score", batchPayload);
                if (response.IsSuccessStatusCode)
                {
                    batchAiResults = await response.Content.ReadFromJsonAsync<Dictionary<string, JobMatchResultDTO>>();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Batch AI scoring failed. Falling back to in-memory C# calculation.");
            }

            // 4. Tổng hợp điểm trên RAM cực nhanh (0ms)
            var suggestedJobs = new List<JobSuggestionDTO>(recentJobs.Count);

            foreach (var job in recentJobs)
            {
                double skillScore;
                List<string> missingSkills;
                string advice;

                var jobAllTags = job.JobTags
                    .Where(jt => jt.Tag != null)
                    .Select(jt => new TagSummaryDTO { TagId = jt.TagId, TagName = jt.Tag!.TagName, Type = jt.Tag.Type })
                    .ToList();

                if (batchAiResults != null && batchAiResults.TryGetValue(job.JobId.ToString(), out var aiRes))
                {
                    skillScore = aiRes.MatchScore;
                    missingSkills = aiRes.MissingSkills;
                    advice = aiRes.Advice ?? "";
                }
                else
                {
                    var jobSkillOnlyTags = jobAllTags
                        .Where(t => t.Type is "Skill" or "Language" or "Role")
                        .ToList();
                    (skillScore, missingSkills, advice) = CalculateFallbackSkillScore(jobSkillOnlyTags, candidateSkillIds);
                }

                double rawDomainScore = CalculateDomainScore(jobAllTags, candidateDomainIds);

                var finalMatch = BuildExplainableMatchResult(
                    skillScore,
                    rawDomainScore,
                    missingSkills,
                    advice,
                    job.ExpYear,
                    candidate.Experiences,
                    job.Location?.LocationName ?? "",
                    candidate.Address);

                suggestedJobs.Add(new JobSuggestionDTO
                {
                    Job = new JobSummaryDTO
                    {
                        JobId = job.JobId,
                        CompanyId = job.CompanyId,
                        PostedByUserId = job.PostedByUserId,
                        IsFreelanceRecruiter = job.CompanyId == null,
                        OriginalId = job.OriginalId,
                        IsCompanyVerified = job.Company?.IsVerified ?? false,
                        Title = job.Title,
                        SalaryMin = job.SalaryMin,
                        SalaryMax = job.SalaryMax,
                        ExpYear = job.ExpYear,
                        Level = job.Level,
                        CompanyName = job.Company?.CompanyName ?? "Nhà tuyển dụng độc lập (Chưa xác minh doanh nghiệp)",
                        LogoImg = job.Company?.LogoImg,
                        LocationName = job.Location?.LocationName ?? "Unknown",
                        PostedDate = job.PostedDate,
                        Deadline = job.Deadline,
                        Status = job.Status
                    },
                    MatchScore = finalMatch.MatchScore,
                    Breakdown = finalMatch.Breakdown,
                    MissingSkills = finalMatch.MissingSkills,
                    Advice = finalMatch.Advice
                });
            }

            return suggestedJobs
                .OrderByDescending(r => r.MatchScore)
                .Take(topN)
                .ToList();
        }

        // --- CÁC HÀM TÍNH ĐIỂM GIẢI THÍCH (EXPLAINABLE AI) ---

        private JobMatchResultDTO BuildExplainableMatchResult(
            double rawSkillScore,
            double rawDomainScore,
            List<string> missingSkills,
            string baseAdvice,
            string? jobExpRequired,
            ICollection<Experience> candidateExps,
            string jobLocation,
            string? candidateAddress)
        {
            double rawExpScore = CalculateExperienceScore(jobExpRequired, candidateExps);
            double rawLocScore = CalculateLocationScore(jobLocation, candidateAddress);

            // Tỷ trọng: Kỹ năng (40%) + Lĩnh vực GNN (10%) + Kinh nghiệm (30%) + Địa điểm (20%)
            double weightedSkill = Math.Round(rawSkillScore * 0.4, 1);
            double weightedDomain = Math.Round(rawDomainScore * 0.1, 1);
            double weightedExp = Math.Round(rawExpScore * 0.3, 1);
            double weightedLoc = Math.Round(rawLocScore * 0.2, 1);

            double totalMatchScore = Math.Round(weightedSkill + weightedDomain + weightedExp + weightedLoc, 1);

            string finalAdvice = baseAdvice;
            if (rawExpScore < 50) finalAdvice += " Tuy nhiên, bạn cần tích lũy thêm kinh nghiệm thực tế.";
            if (rawLocScore < 50) finalAdvice += " Lưu ý: Địa điểm làm việc khác với khu vực hiện tại của bạn.";

            return new JobMatchResultDTO
            {
                MatchScore = totalMatchScore,
                Breakdown = new AiScoreBreakdownDTO
                {
                    SkillScore = weightedSkill,
                    ExperienceScore = weightedExp,
                    LocationScore = weightedLoc,
                    DomainScore = weightedDomain
                },
                MissingSkills = missingSkills,
                Advice = finalAdvice.Trim()
            };
        }

        private static double CalculateDomainScore(IEnumerable<TagSummaryDTO> jobAllTags, HashSet<int> candidateDomainIds)
        {
            var jobDomainTags = jobAllTags
                .Where(t => string.Equals(t.Type, "Domain", StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (jobDomainTags.Count == 0)
                return 100.0;

            int matchedCount = jobDomainTags.Count(t => candidateDomainIds.Contains(t.TagId));
            return Math.Round((double)matchedCount / jobDomainTags.Count * 100.0, 1);
        }

        private static (double score, List<string> missing, string advice) CalculateFallbackSkillScore(
            List<TagSummaryDTO> jobTags,
            HashSet<int> candidateSkillIds)
        {
            if (jobTags.Count == 0)
                return (100.0, new List<string>(), "Công việc không yêu cầu kỹ năng bắt buộc.");

            int matched = 0;
            var missing = new List<string>();

            foreach (var tag in jobTags)
            {
                if (candidateSkillIds.Contains(tag.TagId))
                    matched++;
                else
                    missing.Add(tag.TagName);
            }

            double score = Math.Round((double)matched / jobTags.Count * 100.0, 1);
            string advice = missing.Count == 0
                ? "Bạn đáp ứng đầy đủ các kỹ năng yêu cầu."
                : $"Bạn nên trau dồi thêm: {string.Join(", ", missing.Take(3))}.";

            return (score, missing, advice);
        }

        private static double CalculateExperienceScore(string? jobExpRequired, ICollection<Experience>? candidateExps)
        {
            if (string.IsNullOrWhiteSpace(jobExpRequired) || jobExpRequired.Contains("Không yêu cầu", StringComparison.OrdinalIgnoreCase))
                return 100.0;

            double totalYears = 0;
            if (candidateExps != null)
            {
                foreach (var exp in candidateExps)
                {
                    if (exp.StartDate.HasValue)
                    {
                        var end = exp.EndDate ?? DateTime.UtcNow;
                        totalYears += Math.Max(0, (end - exp.StartDate.Value).TotalDays / 365.0);
                    }
                }
            }

            var match = Regex.Match(jobExpRequired, @"\d+");
            if (!match.Success || !double.TryParse(match.Value, out double requiredYears) || requiredYears <= 0)
                return 100.0;

            return totalYears >= requiredYears ? 100.0 : Math.Round((totalYears / requiredYears) * 100.0, 1);
        }

        private static double CalculateLocationScore(string jobLocation, string? candidateAddress)
        {
            if (string.IsNullOrWhiteSpace(jobLocation) || jobLocation.Contains("remote", StringComparison.OrdinalIgnoreCase))
                return 100.0;
            if (string.IsNullOrWhiteSpace(candidateAddress))
                return 50.0;
            return candidateAddress.Contains(jobLocation, StringComparison.OrdinalIgnoreCase) ? 100.0 : 20.0;
        }

        /// <summary>
        /// Gửi lệnh kích hoạt huấn luyện lại mô hình AI sang Python Server
        /// </summary>
        public async Task TriggerRetrainAsync()
        {
            var response = await _httpClient.PostAsync($"{_pythonBaseUrl}/api/train", null);
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException("AI Server từ chối yêu cầu. Vui lòng kiểm tra lại.");
            }
        }
    }
}