using JobSeekingAPI.DTOs;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    public class MatchingService : IMatchingService
    {
        private readonly IJobRepository _jobRepo;
        private readonly ICandidateRepository _candidateRepo;
        private readonly HttpClient _httpClient;

        public MatchingService(IJobRepository jobRepo, ICandidateRepository candidateRepo, HttpClient httpClient)
        {
            _jobRepo = jobRepo;
            _candidateRepo = candidateRepo;
            _httpClient = httpClient;
        }

        public async Task<JobMatchResultDTO> GetJobMatchScoreAsync(int jobId, int candidateId)
        {
            // 1. Lấy danh sách TagId của Job
            var job = await _jobRepo.GetJobEntityByIdAsync(jobId);
            if (job == null)
                throw new ArgumentException("Job not found");

            var jobSkills = job.JobTags.Select(jt => jt.TagId).ToList();

            // 2. Lấy danh sách TagId của Candidate
            var candidateTags = await _candidateRepo.GetTagsByCandidateIdAsync(candidateId);
            var candidateSkills = candidateTags.Select(ct => ct.TagId).ToList();

            // 3. Đóng gói Payload
            var payload = new
            {
                candidate_skills = candidateSkills,
                job_skills = jobSkills
            };

            // 4. Gọi sang Python
            var pythonApiUrl = "http://localhost:8000/api/matching/score";
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
    }
}