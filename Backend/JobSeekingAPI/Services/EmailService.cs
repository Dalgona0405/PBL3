using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Text;

namespace JobSeekingAPI.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendInterviewInvitationAsync(
            string toEmail,
            string candidateName,
            string jobTitle,
            string companyName,
            DateTime startTimeUtc,
            DateTime endTimeUtc,
            string interviewType,
            string locationOrLink,
            string? notes,
            string calendarEventUid)
        {
            var subject = $"[Thư mời Phỏng vấn] Vị trí {jobTitle} - {companyName}";
            var vnTimeZoneOffset = TimeSpan.FromHours(7);
            var startTimeVn = startTimeUtc.ToUniversalTime().Add(vnTimeZoneOffset);
            var endTimeVn = endTimeUtc.ToUniversalTime().Add(vnTimeZoneOffset);

            var htmlBody = $@"
                <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;'>
                    <h2 style='color: #2563eb; margin-top: 0;'>Thư mời tham dự Phỏng vấn</h2>
                    <p>Xin chào <strong>{WebUtility.HtmlEncode(candidateName)}</strong>,</p>
                    <p>Phòng Nhân sự của <strong>{WebUtility.HtmlEncode(companyName)}</strong> rất ấn tượng với hồ sơ ứng tuyển của bạn cho vị trí <strong>{WebUtility.HtmlEncode(jobTitle)}</strong>.</p>
                    <p>Chúng tôi trân trọng mời bạn tham dự buổi phỏng vấn với thông tin chi tiết như sau:</p>
                    <div style='background-color: #f8fafc; padding: 16px; border-left: 4px solid #2563eb; border-radius: 6px; margin: 16px 0;'>
                        <p style='margin: 4px 0;'>📅 <strong>Thời gian bắt đầu:</strong> {startTimeVn:dd/MM/yyyy HH:mm}</p>
                        <p style='margin: 4px 0;'>⏰ <strong>Thời gian kết thúc:</strong> {endTimeVn:dd/MM/yyyy HH:mm}</p>
                        <p style='margin: 4px 0;'>🌐 <strong>Hình thức:</strong> {WebUtility.HtmlEncode(interviewType)}</p>
                        <p style='margin: 4px 0;'>📍 <strong>Địa điểm / Link họp:</strong> <a href='{WebUtility.HtmlEncode(locationOrLink)}'>{WebUtility.HtmlEncode(locationOrLink)}</a></p>
                        {(string.IsNullOrWhiteSpace(notes) ? "" : $"<p style='margin: 4px 0;'>📝 <strong>Ghi chú từ HR:</strong> {WebUtility.HtmlEncode(notes)}</p>")}
                    </div>
                    <p>💡 <em>Chúng tôi đã đính kèm tệp lịch <strong>invite.ics</strong> trong email này. Bạn chỉ cần nhấn vào tệp đính kèm để đồng bộ lịch hẹn tự động vào Google Calendar hoặc Outlook.</em></p>
                    <p>Trân trọng,<br/><strong>Đội ngũ Tuyển dụng {WebUtility.HtmlEncode(companyName)}</strong></p>
                </div>";

            // Sinh nội dung file lịch chuẩn RFC 5545 (.ics)
            var icsContent = GenerateICalendarContent(
                calendarEventUid,
                $"Phỏng vấn: {jobTitle} tại {companyName}",
                notes ?? $"Buổi phỏng vấn vị trí {jobTitle} - Hình thức: {interviewType}",
                locationOrLink,
                startTimeUtc,
                endTimeUtc);

            await SendEmailInternalAsync(toEmail, subject, htmlBody, icsContent);
        }

        public async Task SendApplicationStatusEmailAsync(
            string toEmail,
            string candidateName,
            string jobTitle,
            string companyName,
            string stageName,
            string? customMessage)
        {
            bool isOffered = stageName.Equals("Offered", StringComparison.OrdinalIgnoreCase) ||
                             stageName.Equals("Hired", StringComparison.OrdinalIgnoreCase);

            var subject = isOffered
                ? $"🎉 [Chúc mừng / Offer] Kết quả ứng tuyển vị trí {jobTitle} - {companyName}"
                : $"[Thông báo] Cập nhật tiến độ ứng tuyển vị trí {jobTitle} - {companyName}";

            var mainParagraph = isOffered
                ? $"Chúc mừng bạn! Sau quá trình đánh giá và phỏng vấn, <strong>{WebUtility.HtmlEncode(companyName)}</strong> trân trọng gửi tới bạn lời mời nhận việc (Offer) cho vị trí <strong>{WebUtility.HtmlEncode(jobTitle)}</strong>."
                : $"Cảm ơn bạn đã dành thời gian quan tâm và ứng tuyển vị trí <strong>{WebUtility.HtmlEncode(jobTitle)}</strong> tại <strong>{WebUtility.HtmlEncode(companyName)}</strong>. Rất tiếc ở thời điểm hiện tại, hồ sơ của bạn chưa hoàn toàn phù hợp với tiêu chí của đợt tuyển dụng này. Chúng tôi xin phép lưu hồ sơ của bạn trong Talent Pool cho các cơ hội tiếp theo.";

            var htmlBody = $@"
                <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;'>
                    <h2 style='color: {(isOffered ? "#16a34a" : "#475569")}; margin-top: 0;'>Cập nhật trạng thái Hồ sơ Ứng tuyển</h2>
                    <p>Xin chào <strong>{WebUtility.HtmlEncode(candidateName)}</strong>,</p>
                    <p>{mainParagraph}</p>
                    {(string.IsNullOrWhiteSpace(customMessage) ? "" : $"<div style='background-color: #f8fafc; padding: 14px; border-radius: 6px; margin: 16px 0;'><strong>Lời nhắn từ HR:</strong><br/>{WebUtility.HtmlEncode(customMessage)}</div>")}
                    <p>Trân trọng,<br/><strong>Đội ngũ Tuyển dụng {WebUtility.HtmlEncode(companyName)}</strong></p>
                </div>";

            await SendEmailInternalAsync(toEmail, subject, htmlBody, null);
        }

        /// <summary>
        /// Tạo nội dung chuẩn iCalendar (.ics - RFC 5545) để Google Calendar / Outlook nhận diện sự kiện 1-chạm
        /// </summary>
        private static string GenerateICalendarContent(
            string uid,
            string summary,
            string description,
            string location,
            DateTime startUtc,
            DateTime endUtc)
        {
            var sb = new StringBuilder();
            sb.AppendLine("BEGIN:VCALENDAR");
            sb.AppendLine("VERSION:2.0");
            sb.AppendLine("PRODID:-//SmartJobSeekingATS//SJSP-2026//VN");
            sb.AppendLine("CALSCALE:GREGORIAN");
            sb.AppendLine("METHOD:REQUEST");
            sb.AppendLine("BEGIN:VEVENT");
            sb.AppendLine($"UID:{uid}");
            sb.AppendLine($"DTSTAMP:{DateTime.UtcNow:yyyyMMddTHHmmssZ}");
            sb.AppendLine($"DTSTART:{startUtc.ToUniversalTime():yyyyMMddTHHmmssZ}");
            sb.AppendLine($"DTEND:{endUtc.ToUniversalTime():yyyyMMddTHHmmssZ}");
            sb.AppendLine($"SUMMARY:{EscapeIcsText(summary)}");
            sb.AppendLine($"DESCRIPTION:{EscapeIcsText(description)}");
            sb.AppendLine($"LOCATION:{EscapeIcsText(location)}");
            sb.AppendLine("STATUS:CONFIRMED");
            sb.AppendLine("SEQUENCE:0");
            sb.AppendLine("BEGIN:VALARM");
            sb.AppendLine("TRIGGER:-PT30M"); // Nhắc lịch trước 30 phút
            sb.AppendLine("ACTION:DISPLAY");
            sb.AppendLine("DESCRIPTION:Interview Reminder");
            sb.AppendLine("END:VALARM");
            sb.AppendLine("END:VEVENT");
            sb.AppendLine("END:VCALENDAR");
            return sb.ToString();
        }

        private static string EscapeIcsText(string input)
        {
            return input.Replace("\\", "\\\\").Replace(";", "\\;").Replace(",", "\\,").Replace("\r\n", "\\n").Replace("\n", "\\n");
        }

        private async Task SendEmailInternalAsync(string toEmail, string subject, string htmlBody, string? icsAttachmentContent)
        {
            var smtpHost = _config["Smtp:Host"];
            var smtpPort = int.TryParse(_config["Smtp:Port"], out int p) ? p : 587;
            var smtpUser = _config["Smtp:Username"];
            var smtpPass = _config["Smtp:Password"];
            var fromEmail = _config["Smtp:FromEmail"] ?? smtpUser ?? "noreply@jobseeking.vn";

            // Nếu chưa cấu hình tài khoản SMTP thật trong appsettings -> Ghi log mô phỏng để không làm crash luồng kéo thả Kanban!
            if (string.IsNullOrWhiteSpace(smtpHost) || string.IsNullOrWhiteSpace(smtpUser) || string.IsNullOrWhiteSpace(smtpPass))
            {
                _logger.LogInformation(
                    "📧 [MOCK EMAIL SENT] To: {To} | Subject: {Subject} | Has .ics Calendar: {HasIcs}",
                    toEmail, subject, !string.IsNullOrEmpty(icsAttachmentContent));
                return;
            }

            try
            {
                using var client = new SmtpClient(smtpHost, smtpPort)
                {
                    Credentials = new NetworkCredential(smtpUser, smtpPass),
                    EnableSsl = true
                };

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail, "Smart Job Seeking & ATS Platform"),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(toEmail);

                if (!string.IsNullOrWhiteSpace(icsAttachmentContent))
                {
                    var icsBytes = Encoding.UTF8.GetBytes(icsAttachmentContent);
                    var stream = new MemoryStream(icsBytes);
                    var contentType = new ContentType("text/calendar; method=REQUEST; charset=UTF-8");
                    contentType.Parameters.Add("name", "invite.ics");

                    var attachment = new Attachment(stream, contentType);
                    if (attachment.ContentDisposition != null)
                    {
                        attachment.ContentDisposition.FileName = "invite.ics";
                    }
                    mailMessage.Attachments.Add(attachment);
                }

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("📧 Email sent successfully to {To}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {To}. Pipeline transition still succeeded.", toEmail);
            }
        }
    }
}