namespace JobSeekingAPI.Services
{
    public interface IEmailService
    {
        /// <summary>
        /// Gửi email mời phỏng vấn kèm tệp lịch chuẩn iCalendar (invite.ics)
        /// </summary>
        Task SendInterviewInvitationAsync(
            string toEmail,
            string candidateName,
            string jobTitle,
            string companyName,
            DateTime startTimeUtc,
            DateTime endTimeUtc,
            string interviewType,
            string locationOrLink,
            string? notes,
            string calendarEventUid);

        /// <summary>
        /// Gửi email thông báo kết quả (Offered / Rejected)
        /// </summary>
        Task SendApplicationStatusEmailAsync(
            string toEmail,
            string candidateName,
            string jobTitle,
            string companyName,
            string stageName,
            string? customMessage);
    }
}