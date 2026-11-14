using JobSeekingAPI.DTOs;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    public class TagService : ITagService
    {
        private readonly ITagRepository _tagRepo;

        public TagService(ITagRepository tagRepo)
        {
            _tagRepo = tagRepo;
        }

        public async Task<IEnumerable<TagSummaryDTO>> GetAllTagsAsync()
        {
            return await _tagRepo.GetAllTagsSummaryAsync();
        }

        public async Task<TagDetailDTO> GetTagByIdAsync(int id)
        {
            var tagDetail = await _tagRepo.GetTagDetailByIdAsync(id);
            if (tagDetail == null)
                throw new KeyNotFoundException("Không tìm thấy nhãn kỹ năng (Tag).");
            return tagDetail;
        }

        public async Task<IEnumerable<TagSummaryDTO>> GetPopularTagsAsync(int count)
        {
            return await _tagRepo.GetPopularTagsAsync(count);
        }

        public async Task<IEnumerable<TagSummaryDTO>> SuggestTagsAsync(string keyword, int limit)
        {
            if (string.IsNullOrWhiteSpace(keyword) || keyword.Length < 2)
                return new List<TagSummaryDTO>();

            return await _tagRepo.SuggestTagsAsync(keyword, limit);
        }

        public async Task<TagSummaryDTO> CreateTagAsync(CreateTagDTO dto)
        {
            var existingTag = await _tagRepo.IsTagNameExistsAsync(dto.TagName);
            if (existingTag)
                throw new ArgumentException("Nhãn kỹ năng (Tag) này đã tồn tại.");

            var tag = new Tag
            {
                TagName = dto.TagName,
                Type = dto.Type
            };

            await _tagRepo.CreateAsync(tag);
            return tag.ToSummaryDto();
        }

        public async Task UpdateTagAsync(int id, UpdateTagDTO dto)
        {
            var existingTag = await _tagRepo.GetTagEntityByIdAsync(id);
            if (existingTag == null)
                throw new KeyNotFoundException("Không tìm thấy nhãn kỹ năng (Tag).");

            if (!string.IsNullOrWhiteSpace(dto.TagName) && dto.TagName != existingTag.TagName)
            {
                var isDuplicate = await _tagRepo.IsTagNameExistsAsync(dto.TagName, id);
                if (isDuplicate)
                    throw new ArgumentException("Tên nhãn kỹ năng (Tag) này đã tồn tại.");
                existingTag.TagName = dto.TagName;
            }

            if (!string.IsNullOrWhiteSpace(dto.Type))
            {
                existingTag.Type = dto.Type;
            }

            await _tagRepo.UpdateAsync(existingTag);
        }

        public async Task DeleteTagAsync(int id)
        {
            var tag = await _tagRepo.GetTagEntityByIdAsync(id);
            if (tag == null)
                throw new KeyNotFoundException("Không tìm thấy nhãn kỹ năng (Tag).");

            var isInUse = await _tagRepo.IsTagInUseAsync(id);
            if (isInUse)
                throw new ArgumentException("Không thể xóa nhãn kỹ năng (Tag) đang được sử dụng.");

            await _tagRepo.SoftDeleteTagAsync(id);
        }

        public async Task<IEnumerable<TagSummaryDTO>> SearchTagsAsync(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                throw new ArgumentException("Vui lòng nhập từ khóa tìm kiếm.");

            return await _tagRepo.SearchTagsAsync(keyword);
        }

        public async Task<IEnumerable<TagSummaryDTO>> GetTagsByTypeAsync(string type)
        {
            return await _tagRepo.GetTagsByTypeAsync(type);
        }
    }
}
