namespace JobSeekingAPI.DTOs
{
    public class UpdateUserDTO
    {
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? Avatar { get; set; }          // ✅ THÊM: Cho phép update Avatar
        public string? NewPassword { get; set; }
    }
}