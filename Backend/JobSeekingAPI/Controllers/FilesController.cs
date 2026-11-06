using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    [ApiController]
    [Route("api/files")]
    public class FilesController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".pdf" };
        private readonly long _maxFileSize = 5 * 1024 * 1024; // 5MB

        public FilesController(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        [Authorize]
        [HttpPost("upload")]
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            // 1. Kiểm tra file rỗng
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Have no file to upload." });

            // 2. Kiểm tra dung lượng (Cái cân)
            if (file.Length > _maxFileSize)
                return BadRequest(new { message = "File size exceeds the limit of 5MB." });

            // 3. Kiểm tra định dạng (Máy quét X-ray)
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(extension) || !_allowedExtensions.Contains(extension))
                return BadRequest(new { message = "Only .jpg, .jpeg, .png, or .pdf files are allowed." });

            // 4. Chuẩn bị thư mục lưu trữ
            var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            // 5. Đổi tên file an toàn (Dùng Guid kết hợp Timestamp để đảm bảo 100% không trùng lặp)
            var uniqueFileName = $"{DateTime.UtcNow.Ticks}_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // 6. Lưu file vào ổ cứng
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 7. Trả về URL cho Frontend
            var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{uniqueFileName}";
            return Ok(new { Url = fileUrl });
        }
    }
}