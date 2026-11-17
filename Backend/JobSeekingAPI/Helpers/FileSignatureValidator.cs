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
    }
}