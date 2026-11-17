using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace JobSeekingAPI.Services
{
    /// <summary>
    /// Quản lý lưu trữ tệp tin đám mây (Cloudinary cho ảnh, Supabase Private Bucket cho CV PDF) kèm chế độ lưu cục bộ dự phòng
    /// </summary>
    public class CloudStorageService : IStorageService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<CloudStorageService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CloudStorageService(
            HttpClient httpClient,
            IConfiguration config,
            IWebHostEnvironment env,
            ILogger<CloudStorageService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _httpClient = httpClient;
            _config = config;
            _env = env;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        /// <summary>
        /// Tải tệp ảnh đại diện hoặc logo công ty lên Cloudinary (hoặc lưu local nếu thiếu cấu hình)
        /// </summary>
        public async Task<string> UploadImageAsync(IFormFile file, CancellationToken cancellationToken = default)
        {
            var cloudName = _config["Cloudinary:CloudName"];
            var apiKey = _config["Cloudinary:ApiKey"];
            var apiSecret = _config["Cloudinary:ApiSecret"];

            // Nếu chưa cấu hình Cloudinary Key -> Fallback về lưu local để không làm gián đoạn quá trình Dev
            if (string.IsNullOrWhiteSpace(cloudName) || string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(apiSecret))
            {
                _logger.LogWarning("Cloudinary credentials missing. Falling back to local storage for image.");
                return await SaveToLocalFallbackAsync(file, "images", cancellationToken);
            }

            // Tạo chữ ký xác thực (Signature) chuẩn của Cloudinary REST API
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var folder = "sjsp_avatars_logos";
            var paramToSign = $"folder={folder}&timestamp={timestamp}{apiSecret}";
            var signature = ComputeSha1Hex(paramToSign);

            using var content = new MultipartFormDataContent();
            await using var fileStream = file.OpenReadStream();
            var streamContent = new StreamContent(fileStream);
            streamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);

            content.Add(streamContent, "file", file.FileName);
            content.Add(new StringContent(apiKey), "api_key");
            content.Add(new StringContent(timestamp), "timestamp");
            content.Add(new StringContent(folder), "folder");
            content.Add(new StringContent(signature), "signature");

            var response = await _httpClient.PostAsync(
                $"https://api.cloudinary.com/v1_1/{cloudName}/image/upload",
                content,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Cloudinary upload failed: {Error}", err);
                throw new InvalidOperationException("Không thể tải ảnh lên đám mây lúc này.");
            }

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            return doc.RootElement.GetProperty("secure_url").GetString()!;
        }

        /// <summary>
        /// Tải tệp CV PDF lên Supabase Private Bucket theo từng ứng viên
        /// </summary>
        public async Task<string> UploadResumePdfAsync(IFormFile file, int userId, CancellationToken cancellationToken = default)
        {
            var supabaseUrl = _config["Supabase:Url"]?.TrimEnd('/');
            var serviceRoleKey = _config["Supabase:ServiceRoleKey"];
            var bucketName = _config["Supabase:CvBucket"] ?? "resumes";

            // Nếu chưa cấu hình Supabase -> Fallback về lưu local
            if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(serviceRoleKey))
            {
                _logger.LogWarning("Supabase credentials missing. Falling back to local storage for CV PDF.");
                return await SaveToLocalFallbackAsync(file, "cvs", cancellationToken);
            }

            // Đặt tên Object phân cấp theo UserId để quản lý ngăn nắp trên Private Bucket
            var objectKey = $"candidate_{userId}/{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}.pdf";
            var uploadEndpoint = $"{supabaseUrl}/storage/v1/object/{bucketName}/{objectKey}";

            await using var fileStream = file.OpenReadStream();
            using var request = new HttpRequestMessage(HttpMethod.Post, uploadEndpoint)
            {
                Content = new StreamContent(fileStream)
            };
            request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
            request.Headers.Add("apikey", serviceRoleKey);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Supabase CV upload failed: {Error}", err);
                throw new InvalidOperationException("Không thể lưu trữ hồ sơ CV lên Supabase Storage.");
            }

            // Lưu tiền tố "supabase://" kèm objectKey vào DB để phân biệt với URL thường
            return $"supabase://{bucketName}/{objectKey}";
        }

        /// <summary>
        /// Sinh đường dẫn Pre-signed URL có thời hạn truy cập cho tệp CV PDF trên Supabase
        /// </summary>
        public async Task<string> GetResumePreSignedUrlAsync(string storedCvPathOrUrl, int expiresInSeconds = 900, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(storedCvPathOrUrl) ||
                storedCvPathOrUrl.Contains("..", StringComparison.Ordinal) ||
                storedCvPathOrUrl.Contains('\\'))
            {
                throw new ArgumentException("Đường dẫn CV không hợp lệ.");
            }

            // Nếu là URL thông thường (dữ liệu cũ hoặc Local Fallback) -> Trả về nguyên bản
            if (!storedCvPathOrUrl.StartsWith("supabase://", StringComparison.OrdinalIgnoreCase))
            {
                return storedCvPathOrUrl;
            }

            var supabaseUrl = _config["Supabase:Url"]?.TrimEnd('/');
            var serviceRoleKey = _config["Supabase:ServiceRoleKey"];

            if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(serviceRoleKey))
                throw new InvalidOperationException("Thiếu cấu hình Supabase để sinh Pre-signed URL.");

            // Tách bucketName và objectKey từ chuỗi "supabase://resumes/candidate_1/abc.pdf"
            var pathWithoutPrefix = storedCvPathOrUrl.Substring("supabase://".Length);
            var firstSlashIdx = pathWithoutPrefix.IndexOf('/');
            var bucketName = pathWithoutPrefix.Substring(0, firstSlashIdx);
            var objectKey = pathWithoutPrefix.Substring(firstSlashIdx + 1);

            var signEndpoint = $"{supabaseUrl}/storage/v1/object/sign/{bucketName}/{objectKey}";
            using var request = new HttpRequestMessage(HttpMethod.Post, signEndpoint)
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new { expiresIn = expiresInSeconds }),
                    Encoding.UTF8,
                    "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
            request.Headers.Add("apikey", serviceRoleKey);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to generate Supabase Pre-signed URL: {Error}", err);
                throw new InvalidOperationException("Không thể khởi tạo đường dẫn bảo mật cho CV.");
            }

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            var signedPath = doc.RootElement.GetProperty("signedURL").GetString();
            return $"{supabaseUrl}/storage/v1{signedPath}";
        }

        // --- HÀM HỖ TRỢ NỘI BỘ ---

        private async Task<string> SaveToLocalFallbackAsync(IFormFile file, string subFolder, CancellationToken cancellationToken)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", subFolder);
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{DateTime.UtcNow.Ticks}_{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            await using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream, cancellationToken);

            var req = _httpContextAccessor.HttpContext?.Request;
            var baseUrl = req != null ? $"{req.Scheme}://{req.Host}" : "http://localhost:5000";
            return $"{baseUrl}/uploads/{subFolder}/{uniqueFileName}";
        }

        private static string ComputeSha1Hex(string input)
        {
            var hashBytes = SHA1.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }
    }
}