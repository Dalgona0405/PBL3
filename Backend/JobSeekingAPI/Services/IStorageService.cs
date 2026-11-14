namespace JobSeekingAPI.Services
{
    public interface IStorageService
    {
        /// <summary>
        /// Upload hình ảnh (Avatar, Logo công ty) lên Cloudinary CDN.
        /// Trả về Public HTTPS URL.
        /// </summary>
        Task<string> UploadImageAsync(IFormFile file, CancellationToken cancellationToken = default);

        /// <summary>
        /// Upload file CV (.pdf) vào Private Bucket của Supabase Storage.
        /// Trả về đường dẫn định danh file (Object Path/URL).
        /// </summary>
        Task<string> UploadResumePdfAsync(IFormFile file, int userId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Sinh Pre-signed URL tạm thời (mặc định hết hạn sau 15 phút = 900 giây) 
        /// để HR hoặc chính Ứng viên xem trước file PDF trên trình duyệt.
        /// </summary>
        Task<string> GetResumePreSignedUrlAsync(string storedCvPathOrUrl, int expiresInSeconds = 900, CancellationToken cancellationToken = default);
    }
}