using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Services
{
    public interface ICandidateService
    {
        Task<CandidateDetailDTO> GetCandidateByIdAsync(int id);
        Task UpdateCandidateProfileAsync(int userId, UpdateCandidateDTO dto);
        Task<PagedResultDTO<CandidateSummaryDTO>> SearchCandidatesAsync(string? keyword, int? tagId, int page, int pageSize);
        Task<IEnumerable<ExperienceDetailDTO>> GetExperiencesAsync(int candidateId);
        Task<ExperienceDetailDTO> AddExperienceAsync(int userId, CreateExperienceDTO dto);
        Task<ExperienceDetailDTO> UpdateExperienceAsync(int userId, int expId, UpdateExperienceDTO dto);
        Task DeleteExperienceAsync(int userId, int expId);
        Task<IEnumerable<object>> GetCandidateSkillsAsync(int candidateId);
        Task UpdateCandidateSkillsAsync(int userId, List<CandidateTagDTO> dtos);
        Task<string> UpdateDefaultCVAsync(int userId, string cvUrl);
        Task<(ParsedResumeResultDTO? Data, string StoredCvUrl, bool AiSuccess)> ParseResumePdfAsync(
            int userId,
            IFormFile file,
            CancellationToken cancellationToken = default);
    }
}
