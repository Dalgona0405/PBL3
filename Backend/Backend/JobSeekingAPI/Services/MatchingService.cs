using JobSeekingAPI.DTOs;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    public class MatchingService : IMatchingService
    {
        private readonly IJobRepository _jobRepo;
        private readonly ICandidateRepository _candidateRepo;
        private readonly HttpClient _httpClient;
        private readonly string _pythonBaseUrl;

        public MatchingService(IJobRepository jobRepo, ICandidateRepository candidateRepo, HttpClient httpClient, IConfiguration config)
        {
            _jobRepo = jobRepo;
            _candidateRepo = candidateRepo;
            _httpClient = httpClient;
            _pythonBaseUrl = config["PythonAI:BaseUrl"] ?? "http://localhost:8000";
        }

        public async Task<JobMatchResultDTO> GetJobMatchScoreAsync(int jobId, int candidateId)
        {
            var job = await _jobRepo.GetJobDetailByIdAsync(jobId);
            if (job == null) throw new ArgumentException("Job not found");

            var candidate = await _candidateRepo.GetCandidateDetailByIdAsync(candidateId);
            if (candidate == null) throw new ArgumentException("Candidate not found");

            // 1. Lấy Tags
            var jobSkills = job.Tags
                .Where(t => t.Type == "Skill" || t.Type == "Language" || t.Type == "Role" || t.Type == "Domain")
                .Select(t => t.TagId).ToList();

            var candidateTags = await _candidateRepo.GetTagsByCandidateIdAsync(candidateId);
            var candidateSkills = candidateTags
                .Where(ct => ct.Tag != null && (ct.Tag.Type == "Skill" || ct.Tag.Type == "Language" || ct.Tag.Type == "Role" || ct.Tag.Type == "Domain"))
                .Select(ct => ct.TagId).ToList();

            // 2. Gọi Python AI
            double aiSkillScore = 0;
            List<string> missingSkills = new List<string>();
            string aiAdvice = "";

            var payload = new { candidate_skills = candidateSkills, job_skills = jobSkills };
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

            // ====================================================================
            // 3. TỔNG HỢP ĐIỂM (60% Kỹ năng - 20% Kinh nghiệm - 20% Địa điểm)
            // ====================================================================

            double finalSkillScore = aiSkillScore * 0.6;

            // Tính điểm kinh nghiệm dựa vào danh sách công ty cũ của ứng viên
            double expScore = CalculateExperienceScore(job.ExpYear, candidate.Experiences) * 0.2;

            string jobLocation = job.Location?.LocationName ?? "";
            double locationScore = CalculateLocationScore(jobLocation, candidate.Address) * 0.2;

            double totalMatchScore = Math.Round(finalSkillScore + expScore + locationScore, 1);

            // 4. Lời khuyên
            string finalAdvice = aiAdvice;
            if (expScore < 10) finalAdvice += " Tuy nhiên, bạn cần tích lũy thêm kinh nghiệm thực tế.";
            if (locationScore < 10) finalAdvice += " Lưu ý: Địa điểm làm việc có thể khá xa so với nơi ở của bạn.";

            return new JobMatchResultDTO
            {
                MatchScore = totalMatchScore,
                MissingSkills = missingSkills,
                Advice = finalAdvice
            };
        }

        public async Task<List<JobSuggestionDTO>> GetTopJobSuggestionsForCandidateAsync(int candidateId, int topN = 6)
        {
            var recentJobs = await _jobRepo.GetRecentJobsAsync(100);
            var suggestedJobs = new List<JobSuggestionDTO>();
            foreach (var job in recentJobs)
            {
                try
                {
                    var matchResult = await GetJobMatchScoreAsync(job.JobId, candidateId);
                    suggestedJobs.Add(new JobSuggestionDTO
                    {
                        Job = new JobSummaryDTO
                        {
                            JobId = job.JobId,
                            Title = job.Title,
                            SalaryMin = job.SalaryMin,
                            SalaryMax = job.SalaryMax,
                            ExpYear = job.ExpYear,
                            Level = job.Level,
                            CompanyName = job.Company?.CompanyName ?? "Unknown",
                            LogoImg = job.Company?.LogoImg,
                            LocationName = job.Location?.LocationName ?? "Unknown",
                            PostedDate = job.PostedDate,
                            Deadline = job.Deadline,
                            Status = job.Status
                        },
                        MatchScore = matchResult.MatchScore,
                        MissingSkills = matchResult.MissingSkills,
                        Advice = matchResult.Advice
                    });
                }
                catch
                {
                    continue;
                }
            }
            return suggestedJobs.OrderByDescending(r => r.MatchScore).Take(topN).ToList();
        }
        private double CalculateExperienceScore(string? jobExpRequired, ICollection<JobSeekingAPI.Models.Experience> candidateExps)
        {
            if (string.IsNullOrWhiteSpace(jobExpRequired) || jobExpRequired.Contains("Không yêu cầu"))
                return 100.0;

            // Cộng dồn số năm làm việc từ các công ty cũ
            double totalYears = 0;
            if (candidateExps != null)
            {
                foreach (var exp in candidateExps)
                {
                    // Vì StartDate trong DB có thể null, nên mình phải check an toàn
                    if (exp.StartDate.HasValue) 
                    {
                        var end = exp.EndDate ?? DateTime.UtcNow; 
                        totalYears += (end - exp.StartDate.Value).TotalDays / 365.0;
                    }
                }
            }

            // Lấy con số yêu cầu từ Job (VD: "3 năm" -> 3)
            double requiredYears = 0;
            var match = System.Text.RegularExpressions.Regex.Match(jobExpRequired, @"\d+");
            if (match.Success) requiredYears = double.Parse(match.Value);

            if (totalYears >= requiredYears) return 100.0;
            if (requiredYears == 0) return 100.0; 

            return (totalYears / requiredYears) * 100.0;
        }

        private double CalculateLocationScore(string jobLocation, string? candidateAddress)
        {
            if (string.IsNullOrWhiteSpace(jobLocation) || jobLocation.ToLower().Contains("remote")) return 100.0;
            if (string.IsNullOrWhiteSpace(candidateAddress)) return 50.0;
            if (candidateAddress.ToLower().Contains(jobLocation.ToLower())) return 100.0;
            return 0.0;
        }
    }
}