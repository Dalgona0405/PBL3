using System.Text.RegularExpressions;

namespace JobSeekingAPI.Helpers
{
    /// <summary>
    /// Kiểm tra chữ ký byte nhị phân đầu tệp (Magic Bytes) để ngăn chặn giả mạo định dạng tệp (.exe đổi đuôi thành .pdf/.png)
    /// </summary>
    public static class FileSignatureValidator
    {
        public static async Task<bool> IsValidSignatureAsync(IFormFile file, string extension, CancellationToken cancellationToken = default)
        {
            var headerBytes = new byte[4];
            await using var stream = file.OpenReadStream();
            var bytesRead = await stream.ReadAsync(headerBytes.AsMemory(0, 4), cancellationToken);
            if (bytesRead < 4) return false;

            return extension.ToLowerInvariant() switch
            {
                ".pdf" => headerBytes[0] == 0x25 && headerBytes[1] == 0x50 && headerBytes[2] == 0x44 && headerBytes[3] == 0x46, // %PDF
                ".png" => headerBytes[0] == 0x89 && headerBytes[1] == 0x50 && headerBytes[2] == 0x4E && headerBytes[3] == 0x47,
                ".jpg" or ".jpeg" => headerBytes[0] == 0xFF && headerBytes[1] == 0xD8,
                ".webp" => headerBytes[0] == 0x52 && headerBytes[1] == 0x49 && headerBytes[2] == 0x46 && headerBytes[3] == 0x46,
                _ => false
            };
        }

        /// <summary>
        /// Đảm bảo đường dẫn CV (CVUrl) do ứng viên cung cấp thuộc chính chủ hoặc là đường dẫn fallback hợp lệ.
        /// Ngăn chặn tấn công gán chéo CVUrl của ứng viên khác để vượt qua bước kiểm tra quyền xem CV.
        /// </summary>
        public static void EnsureCvBelongsToCandidate(string? cvUrl, int userId)
        {
            if (string.IsNullOrWhiteSpace(cvUrl))
                throw new ArgumentException("Đường dẫn CV không được để trống.");

            var trimmed = cvUrl.Trim();
            if (trimmed.Contains("..", StringComparison.Ordinal) ||
                trimmed.Contains('\\') ||
                trimmed.Contains("%2e", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Đường dẫn CV không hợp lệ.");
            }

            if (trimmed.StartsWith("supabase://", StringComparison.OrdinalIgnoreCase))
            {
                bool isOwnerSupabasePath = Regex.IsMatch(
                    trimmed,
                    $@"^supabase://[a-zA-Z0-9_\-]+/candidate_{userId}/[a-zA-Z0-9_\-]+\.pdf$",
                    RegexOptions.IgnoreCase);

                if (!isOwnerSupabasePath)
                    throw new ForbiddenAccessException("Bạn không có quyền sử dụng hồ sơ CV của ứng viên khác.");

                return;
            }

            bool isValidLocalFallbackPath = Regex.IsMatch(
                trimmed,
                @"^(https?://[^/]+)?/uploads/cvs/[a-zA-Z0-9_\-]+\.pdf$",
                RegexOptions.IgnoreCase);

            if (!isValidLocalFallbackPath)
                throw new ArgumentException("Đường dẫn CV không hợp lệ (chỉ chấp nhận tệp CV PDF đã tải lên hệ thống).");
        }
    }
}