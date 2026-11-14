using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface IApplicationRepository : IBaseRepository<Application>
    {
        // CRUD ĐẶC THÙ
        //Task<IEnumerable<Application>> GetAllApplicationsWithDetailsAsync();
        Task<Application?> GetApplicationDetailByIdAsync(int id);
        Task<Application?> GetApplicationEntityByIdAsync(int id);
        Task<Application> CreateApplicationDetailAsync(Application application);
        Task SoftDeleteApplicationAsync(int id);

        // LỌC THEO QUAN HỆ
        Task<IEnumerable<Application>> GetByJobIdAsync(int jobId);
        Task<IEnumerable<Application>> GetByUserIdAsync(int userId);

        // KIỂM TRA & THỐNG KÊ
        Task<bool> IsAppliedAsync(int userId, int jobId);
        Task<int> GetApplicationCountByJobIdAsync(int jobId);
        Task<Dictionary<int, int>> GetApplicationStatusStatisticsAsync(int jobId);

        // NGHIỆP VỤ PHỐI HỢP TRANSACTION & PHÂN QUYỀN CV
        Task<Notification> UpdateStatusWithInterviewAsync(Application application, Interview? interviewRecord, string jobTitle, string stageName);
        Task<(int recruiterUserId, Notification? notification, Message? welcomeMessage, string candidateName, string? candidateAvatar)> CreateInitialChatAndNotificationAsync(int candidateUserId, Job job);
        Task<bool> CanUserAccessCvAsync(string cvPath, int currentUserId, string userRole, CancellationToken cancellationToken = default);
    }
}