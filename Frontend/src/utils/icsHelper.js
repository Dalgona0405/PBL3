const toIcsUtc = (dateInput) => {
    const d = new Date(dateInput);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
};

const esc = (str = '') =>
    String(str).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\n/g, '\\n');

export const downloadInterviewIcs = ({
    applicationId, jobTitle = 'Vị trí tuyển dụng', companyName = 'Doanh nghiệp',
    candidateName = '', startTime, endTime, interviewType = 'Online', locationOrLink = '', notes = '',
}) => {
    const startUtc = toIcsUtc(startTime);
    if (!startUtc) return false;
    const endDate = endTime ? new Date(endTime) : new Date(new Date(startTime).getTime() + 3600000);
    const endUtc = toIcsUtc(endDate) || startUtc;
    const desc = [candidateName && `Ứng viên: ${candidateName}`, `Hình thức: ${interviewType}`, notes && `Ghi chú: ${notes}`]
        .filter(Boolean).join(' | ');

    const lines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SmartJobSeekingATS//SJSP-2026//VN', 'CALSCALE:GREGORIAN', 'METHOD:REQUEST',
        'BEGIN:VEVENT', `UID:interview-${applicationId || Date.now()}@jobseeking.vn`,
        `DTSTAMP:${toIcsUtc(new Date())}`, `DTSTART:${startUtc}`, `DTEND:${endUtc}`,
        `SUMMARY:${esc(`Phỏng vấn: ${jobTitle} - ${companyName}`)}`, `DESCRIPTION:${esc(desc)}`,
        `LOCATION:${esc(locationOrLink || interviewType)}`, 'STATUS:CONFIRMED', 'SEQUENCE:0',
        'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Interview Reminder', 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR',
    ];

    const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: `invite-interview-${applicationId || 'schedule'}.ics` });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
};
