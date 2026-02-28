namespace JobSeekingAPI.DTOs
{
    // 📋 DTO NHẸ - DÙNG CHO DANH SÁCH
    public class UserListDTO
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Avatar { get; set; }          // ✅ Avatar ở User, không phải Candidate
        public string? CompanyName { get; set; }     // ✅ Chỉ Recruiter mới có
        public bool? IsVerified { get; set; }        // ✅ Chỉ Recruiter mới có
        public DateTime? LastLogin { get; set; }     // ✅ THÊM: Theo ER của User
    }
}