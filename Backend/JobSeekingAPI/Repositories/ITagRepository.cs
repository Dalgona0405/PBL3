using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface ITagRepository : IBaseRepository<Tag>
    {
        // CRUD ĐẶC THÙ
        Task<TagDetailDTO?> GetTagDetailByIdAsync(int id);
        Task<Tag?> GetTagEntityByIdAsync(int id);
        Task SoftDeleteTagAsync(int id);
        // ===== THỐNG KÊ & DỰ BÁO XU HƯỚNG =====
        // Trả về DTO luôn từ Repo để tối ưu tốc độ đếm (Count) trong SQL
        Task<IEnumerable<TagSummaryDTO>> GetAllTagsSummaryAsync();

        // Lấy Top Kỹ năng IT đang hot
        Task<IEnumerable<TagSummaryDTO>> GetPopularTagsAsync(int count);

        // Gợi ý Tag
        Task<IEnumerable<TagSummaryDTO>> SuggestTagsAsync(string keyword, int limit);
        Task<bool> IsTagNameExistsAsync(string tagName, int? excludeTagId = null);
        Task<bool> IsTagInUseAsync(int tagId);
        Task<IEnumerable<TagSummaryDTO>> SearchTagsAsync(string keyword);
        Task<IEnumerable<TagSummaryDTO>> GetTagsByTypeAsync(string type);
    }
}