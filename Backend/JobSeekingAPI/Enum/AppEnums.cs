namespace JobSeekingAPI.Enums
{
    public enum ApplicationStatus
    {
        Applied = 1,            // Hồ sơ mới nộp
        Screening = 2,          // HR đang thẩm định CV
        InterviewScheduled = 3, // Đã lên lịch phỏng vấn
        Offered = 4,            // Đã gửi thư mời nhận việc
        Hired = 5,              // Tuyển dụng thành công
        Rejected = 6,            // Từ chối hồ sơ

        Pending = Applied,
        Reviewed = Screening,
        Interviewing = InterviewScheduled,
        Accepted = Hired
    }

    public enum JobStatus
    {
        Closed = 0,             // Đã đóng tin
        Active = 1              // Tin đang tuyển
    }

    public enum CompanyRequestStatus
    {
        Pending = 0,            // Đợi giải quyết
        Approved = 1,           // Chấp nhận
        Rejected = 2            // Từ chối
    }

    public enum InterviewType
    {
        Online = 1,   // Google Meet / Zoom / MS Teams
        Offline = 2   // Phỏng vấn trực tiếp tại văn phòng
    }

    public static class UserRoles
    {
        public const string Admin = "Admin";    // Quản trị viên
        public const string Candidate = "Candidate";    // Người xin việc
        public const string Recruiter = "Recruiter";    // Nhà tuyển dụng
        public const string Company = "Company"; // Company Master
    }

    public static class TagTypes
    {
        public const string Skill = "Skill";
        public const string Language = "Language";
        public const string Role = "Role";
        public const string Domain = "Domain";
    }
}