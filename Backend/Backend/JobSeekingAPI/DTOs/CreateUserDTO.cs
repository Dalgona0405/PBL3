namespace JobSeekingAPI.DTOs
{
    public class CreateUserDTO
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string Role { get; set; } = "Candidate";
        public string? Avatar { get; set; }          // ✅ THÊM: Avatar
    }
}