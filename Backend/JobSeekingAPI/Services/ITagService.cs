using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Services
{
    public interface ITagService
    {
        Task<IEnumerable<TagSummaryDTO>> GetAllTagsAsync();
        Task<TagDetailDTO> GetTagByIdAsync(int id);
        Task<IEnumerable<TagSummaryDTO>> GetPopularTagsAsync(int count);
        Task<IEnumerable<TagSummaryDTO>> SuggestTagsAsync(string keyword, int limit);
        Task<TagSummaryDTO> CreateTagAsync(CreateTagDTO dto);
        Task UpdateTagAsync(int id, UpdateTagDTO dto);
        Task DeleteTagAsync(int id);
        Task<IEnumerable<TagSummaryDTO>> SearchTagsAsync(string keyword);
        Task<IEnumerable<TagSummaryDTO>> GetTagsByTypeAsync(string type);
    }
}
