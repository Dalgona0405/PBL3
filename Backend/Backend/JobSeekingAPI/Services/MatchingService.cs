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
            // 1. Lấy danh sách TagId của Job
            var job = await _jobRepo.GetJobDetailByIdAsync(jobId);
            if (job == null)
                throw new ArgumentException("Job not found");

            var jobSkills = job.JobTags
                .Where(jt => jt.Tag != null && (jt.Tag.Type == "Skill" || jt.Tag.Type == "Language"))
                .Select(jt => jt.TagId)
                .ToList();

            // 2. Lấy danh sách TagId của Candidate
            var candidateTags = await _candidateRepo.GetTagsByCandidateIdAsync(candidateId);
            var candidateSkills = candidateTags
                .Where(ct => ct.Tag != null && (ct.Tag.Type == "Skill" || ct.Tag.Type == "Language"))
                .Select(ct => ct.TagId)
                .ToList();

            // 3. Đóng gói Payload
            var payload = new
            {
                candidate_skills = candidateSkills,
                job_skills = jobSkills
            };

            // 4. Gọi sang Python
            var pythonApiUrl = $"{_pythonBaseUrl}/api/matching/score";
            var response = await _httpClient.PostAsJsonAsync(pythonApiUrl, payload);

            if (response.IsSuccessStatusCode)
            {
                var matchResult = await response.Content.ReadFromJsonAsync<JobMatchResultDTO>();
                return matchResult ?? new JobMatchResultDTO();
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"AI Service is busy or encountered an error: {error}");
            }
        }
        public async Task<List<JobSuggestionDTO>> GetTopJobSuggestionsForCandidateAsync(int candidateId, int topN = 6)
        {
            var recentJobs = await _jobRepo.GetRecentJobsAsync(20);
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
                            Status = job.Status.ToString()
                        },
                        MatchScore = matchResult.MatchScore,
                        MissingSkills = matchResult.MissingSkills,
                        Advice = matchResult.Advice
                    });
                }
                catch
                {
                    return null;
                }
            }

            return suggestedJobs.OrderByDescending(r => r.MatchScore).Take(topN).ToList();
        }
    }
}