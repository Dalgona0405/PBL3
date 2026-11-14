export const APPLICATION_STATUS = {
    APPLIED: 1,
    SCREENING: 2,
    INTERVIEW_SCHEDULED: 3,
    OFFERED: 4,
    HIRED: 5,
    REJECTED: 6,
};

export const APPLICATION_STATUS_OPTIONS = [
    {
        value: APPLICATION_STATUS.APPLIED,
        key: 'applied',
        label: 'Chờ duyệt',
        shortLabel: 'Mới nộp',
        style: 'bg-gray-100 text-gray-600 border-gray-200',
        borderClass: 'border-gray-400',
        textClass: 'text-gray-700',
        titleClass: 'text-gray-500',
    },
    {
        value: APPLICATION_STATUS.SCREENING,
        key: 'screening',
        label: 'Đang xem xét',
        shortLabel: 'Sàng lọc',
        style: 'bg-orange-50 text-orange-600 border-orange-200',
        borderClass: 'border-orange-400',
        textClass: 'text-orange-700',
        titleClass: 'text-orange-600',
    },
    {
        value: APPLICATION_STATUS.INTERVIEW_SCHEDULED,
        key: 'interviewScheduled',
        label: 'Phỏng vấn',
        shortLabel: 'Phỏng vấn',
        style: 'bg-blue-50 text-blue-600 border-blue-200',
        borderClass: 'border-blue-400',
        textClass: 'text-blue-700',
        titleClass: 'text-blue-600',
    },
    {
        value: APPLICATION_STATUS.OFFERED,
        key: 'offered',
        label: 'Đề nghị nhận việc',
        shortLabel: 'Offer',
        style: 'bg-purple-50 text-purple-600 border-purple-200',
        borderClass: 'border-purple-400',
        textClass: 'text-purple-700',
        titleClass: 'text-purple-600',
    },
    {
        value: APPLICATION_STATUS.HIRED,
        key: 'hired',
        label: 'Đã tuyển',
        shortLabel: 'Đã tuyển',
        style: 'bg-green-50 text-green-600 border-green-200',
        borderClass: 'border-green-400',
        textClass: 'text-green-700',
        titleClass: 'text-green-600',
    },
    {
        value: APPLICATION_STATUS.REJECTED,
        key: 'rejected',
        label: 'Từ chối',
        shortLabel: 'Từ chối',
        style: 'bg-red-50 text-red-600 border-red-200',
        borderClass: 'border-red-400',
        textClass: 'text-red-700',
        titleClass: 'text-red-600',
    },
];

export const getApplicationStatusInfo = (statusCode) => {
    const normalized = statusCode === 0 ? APPLICATION_STATUS.APPLIED : Number(statusCode);
    const matched = APPLICATION_STATUS_OPTIONS.find((item) => item.value === normalized);

    if (matched) {
        return { text: matched.label, ...matched };
    }

    return {
        value: normalized,
        label: 'Chưa rõ',
        text: 'Chưa rõ',
        style: 'bg-gray-50 text-gray-500 border-gray-200',
    };
};
