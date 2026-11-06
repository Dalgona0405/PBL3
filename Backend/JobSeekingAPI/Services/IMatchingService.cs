using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Services
{
    public interface IMatchingService
    {
        Task<JobMatchResultDTO> GetJobMatchScoreAsync(int jobId, int candidateId);
        Task<List<JobSuggestionDTO>> GetTopJobSuggestionsForCandidateAsync(int candidateId, int topN = 6);
    }
}