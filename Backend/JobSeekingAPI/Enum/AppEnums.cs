namespace JobSeekingAPI.Enums
{
    // Trạng thái đơn ứng tuyển
    public enum ApplicationStatus
    {
        Pending = 1,      // Chờ duyệt
        Reviewed = 2,     // Đã xem
        Interviewing = 3, // Đang phỏng vấn
        Accepted = 4,     // Trúng tuyển
        Rejected = 5      // Từ chối
    }

    // Trạng thái công việc
    public enum JobStatus
    {
        Closed = 0,       // Đóng / Hết hạn
        Active = 1        // Đang tuyển
    }

    // Trạng thái xin gia nhập công ty của Recruiter
    public enum CompanyRequestStatus
    {
        Pending = 0,      // Chờ Admin duyệt
        Approved = 1,     // Đã duyệt
        Rejected = 2      // Từ chối
    }

    // Phân quyền
    public static class UserRoles
    {
        public const string Admin = "Admin";
        public const string Candidate = "Candidate";
        public const string Recruiter = "Recruiter";
        public const string Company = "Company";
    }

    // Loại Tag
    public static class TagTypes
    {
        public const string Skill = "Skill";
        public const string Language = "Language";
    }
}