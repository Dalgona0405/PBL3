using JobSeekingAPI.Enums;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace JobSeekingAPI.Controllers
{
    /// <summary>
    /// Xử lý tải lên tệp ảnh/CV PDF và cấp Pre-signed URL bảo mật để xem hồ sơ
    /// </summary>
    [ApiController]
    [Route("api/files")]
    [Authorize]
    public class FilesController : ControllerBase
    {
        private readonly IStorageService _storageService;
        private readonly IApplicationService _applicationService;
        private static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
        private const long MaxFileSize = 5 * 1024 * 1024; // 5MB 

        public FilesController(IStorageService storageService, IApplicationService applicationService)
        {
            _storageService = storageService;
            _applicationService = applicationService;
        }

        /// <summary>
        /// Upload file đa năng (Tự động phân luồng Ảnh -> Cloudinary CDN, PDF CV -> Supabase Private Bucket)
        /// </summary>
        [HttpPost("upload")]
        public async Task<IActionResult> UploadFile(IFormFile file, CancellationToken cancellationToken)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Vui lòng chọn tệp tin để tải lên.");

            if (file.Length > MaxFileSize)
                throw new ArgumentException("Dung lượng tệp vượt quá giới hạn 5MB cho phép.");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            // Kiểm tra chữ ký byte thực tế của file (Magic Bytes) để chống giả mạo đuôi file (.exe đổi thành .pdf)
            if (!await IsValidFileSignatureAsync(file, extension))
                throw new ArgumentException("Định dạng tệp tin không hợp lệ hoặc bị hỏng (Chỉ hỗ trợ JPG, PNG, WEBP, PDF chuẩn).");

            string storedUrl;
            if (extension == ".pdf")
            {
                int userId = User.GetUserIdFromToken();
                storedUrl = await _storageService.UploadResumePdfAsync(file, userId, cancellationToken);
            }
            else if (AllowedImageExtensions.Contains(extension))
            {
                storedUrl = await _storageService.UploadImageAsync(file, cancellationToken);
            }
            else
            {
                throw new ArgumentException("Chỉ chấp nhận định dạng ảnh (.jpg, .png, .webp) hoặc hồ sơ (.pdf).");
            }

            return Ok(new { url = storedUrl });
        }

        /// <summary>
        /// Sinh Pre-signed URL có thời hạn 15 phút để xem trước CV PDF (SRS FR-4.2 & FR-9.1)
        /// </summary>
        [HttpGet("cv-signed-url")]
        public async Task<IActionResult> GetCvPreSignedUrl([FromQuery] string cvPath, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(cvPath))
                throw new ArgumentException("Thiếu đường dẫn hồ sơ CV.");

            int currentUserId = User.GetUserIdFromToken();
            string userRole = User.IsInRole(UserRoles.Admin) ? UserRoles.Admin
                : User.IsInRole(UserRoles.Company) ? UserRoles.Company
                : User.IsInRole(UserRoles.Recruiter) ? UserRoles.Recruiter
                : User.IsInRole(UserRoles.Candidate) ? UserRoles.Candidate
                : string.Empty;

            await _applicationService.VerifyCvAccessAsync(cvPath, currentUserId, userRole, cancellationToken);

            var signedUrl = await _storageService.GetResumePreSignedUrlAsync(cvPath, expiresInSeconds: 900, cancellationToken);
            return Ok(new
            {
                signedUrl,
                expiresInSeconds = 900
            });
        }

        /// <summary>
        /// Đọc 4 byte đầu tiên (Magic Bytes) để xác thực định dạng thực sự của file
        /// </summary>
        private static async Task<bool> IsValidFileSignatureAsync(IFormFile file, string extension)
        {
            var headerBytes = new byte[4];
            await using var stream = file.OpenReadStream();
            var bytesRead = await stream.ReadAsync(headerBytes.AsMemory(0, 4));
            if (bytesRead < 4) return false;

            return extension switch
            {
                // PDF bắt đầu bằng "%PDF" (0x25, 0x50, 0x44, 0x46)
                ".pdf" => headerBytes[0] == 0x25 && headerBytes[1] == 0x50 && headerBytes[2] == 0x44 && headerBytes[3] == 0x46,
                // PNG bắt đầu bằng (0x89, 0x50, 0x4E, 0x47)
                ".png" => headerBytes[0] == 0x89 && headerBytes[1] == 0x50 && headerBytes[2] == 0x4E && headerBytes[3] == 0x47,
                // JPEG bắt đầu bằng (0xFF, 0xD8)
                ".jpg" or ".jpeg" => headerBytes[0] == 0xFF && headerBytes[1] == 0xD8,
                // WEBP bắt đầu bằng "RIFF" (0x52, 0x49, 0x46, 0x46)
                ".webp" => headerBytes[0] == 0x52 && headerBytes[1] == 0x49 && headerBytes[2] == 0x46 && headerBytes[3] == 0x46,
                _ => false
            };
        }
    }
}