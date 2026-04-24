using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface ICandidateRepository : IBaseRepository<Candidate>
    {
        // CRUD ĐẶC THÙ
        //Task<IEnumerable<Candidate>> GetAllCandidatesWithDetailsAsync();
        Task<Candidate?> GetCandidateDetailByIdAsync(int id);
        Task<Candidate?> GetCandidateEntityByIdAsync(int id);

        // TÌM KIẾM
        Task<PagedResultDTO<CandidateSummaryDTO>> SearchCandidatesAsync(string? keyword, int? tagId, int page, int pageSize);

        // THỐNG KÊ
        Task<int> GetTotalCandidatesCountAsync();

        // Các hàm quản lý kỹ năng (Tag)
        Task UpdateCandidateTagsAsync(int candidateId, List<CandidateTagDTO> tags);
        Task<IEnumerable<CandidateTag>> GetTagsByCandidateIdAsync(int candidateId);

    }
}