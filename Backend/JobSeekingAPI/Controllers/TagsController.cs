using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    /// <summary>
    /// Quản lý danh mục nhãn kỹ năng, ngôn ngữ, vai trò (Tags) phục vụ gắn thẻ và tìm kiếm
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class TagsController : ControllerBase
    {
        private readonly ITagService _tagService;

        public TagsController(ITagService tagService)
        {
            _tagService = tagService;
        }

        /// <summary>
        /// Lấy toàn bộ danh sách nhãn kỹ năng kèm số lượt sử dụng
        /// </summary>
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAllTags()
        {
            var tags = await _tagService.GetAllTagsAsync();
            return Ok(tags);
        }

        /// <summary>
        /// Lấy thông tin chi tiết một nhãn kỹ năng cùng danh sách việc làm và ứng viên liên quan
        /// </summary>
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTagById(int id)
        {
            var tagDetail = await _tagService.GetTagByIdAsync(id);
            return Ok(tagDetail);
        }

        /// <summary>
        /// Lấy danh sách các nhãn kỹ năng phổ biến nhất
        /// </summary>
        [AllowAnonymous]
        [HttpGet("popular")]
        public async Task<IActionResult> GetPopularTags([FromQuery] int count = 10)
        {
            var popularTags = await _tagService.GetPopularTagsAsync(count);
            return Ok(popularTags);
        }

        /// <summary>
        /// Gợi ý nhanh nhãn kỹ năng theo tiền tố từ khóa (tối thiểu 2 ký tự)
        /// </summary>
        [AllowAnonymous]
        [HttpGet("suggest")]
        public async Task<IActionResult> SuggestTags([FromQuery] string keyword, [FromQuery] int limit = 5)
        {
            var tags = await _tagService.SuggestTagsAsync(keyword, limit);
            return Ok(tags);
        }

        /// <summary>
        /// Tạo mới một nhãn kỹ năng (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpPost]
        public async Task<IActionResult> CreateTag([FromBody] CreateTagDTO dto)
        {
            var created = await _tagService.CreateTagAsync(dto);
            return CreatedAtAction(nameof(GetTagById), new { id = created.TagId }, created);
        }

        /// <summary>
        /// Cập nhật tên hoặc phân loại của nhãn kỹ năng (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateTag(int id, [FromBody] UpdateTagDTO dto)
        {
            await _tagService.UpdateTagAsync(id, dto);
            return Ok(new { message = "Cập nhật nhãn kỹ năng thành công." });
        }

        /// <summary>
        /// Xóa nhãn kỹ năng nếu chưa được gắn vào công việc hoặc ứng viên nào (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = UserRoles.Admin)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTag(int id)
        {
            await _tagService.DeleteTagAsync(id);
            return Ok(new { message = "Xóa nhãn kỹ năng thành công." });
        }

        /// <summary>
        /// Tìm kiếm nhãn kỹ năng theo từ khóa
        /// </summary>
        [AllowAnonymous]
        [HttpGet("search")]
        public async Task<IActionResult> SearchTags([FromQuery] string keyword)
        {
            var tags = await _tagService.SearchTagsAsync(keyword);
            return Ok(tags);
        }

        /// <summary>
        /// Lọc danh sách nhãn kỹ năng theo phân loại (Skill, Language, Role, Domain)
        /// </summary>
        [AllowAnonymous]
        [HttpGet("type/{type}")]
        public async Task<IActionResult> GetTagsByType(string type)
        {
            var tags = await _tagService.GetTagsByTypeAsync(type);
            return Ok(tags);
        }
    }
}
