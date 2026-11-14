import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { API_URLS } from '../../../api/api';
import axiosClient from '../../../api/axiosClient';
import { APPLICATION_STATUS } from '../../../constants/applicationStatus';
import useDebounce from '../../../hooks/useDebounce';

const DEFAULT_FILTERS = { keyword: '', skill: '', minExp: '', minAiScore: '' };
const INITIAL_STATUS_FORM = {
    status: APPLICATION_STATUS.APPLIED, message: '', interviewDate: '',
    interviewStartTime: '09:00', interviewEndTime: '10:00', interviewType: 'Online',
    meetingLink: '', interviewLocation: '',
};

const toLocalInputParts = (isoOrDate) => {
    const d = isoOrDate ? new Date(isoOrDate) : new Date(Date.now() + 86400000);
    if (Number.isNaN(d.getTime())) return { date: '', time: '09:00' };
    const pad = (n) => String(n).padStart(2, '0');
    return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
};

const parseExpYears = (expText) => parseFloat(String(expText || '0').replace(',', '.')) || 0;

const matchesFilters = (app, kw, filters) => {
    if (kw) {
        const name = app.candidate?.fullName?.toLowerCase() || '';
        const email = app.candidate?.email?.toLowerCase() || '';
        if (!name.includes(kw) && !email.includes(kw)) return false;
    }
    if (filters.skill && !(app.candidate?.skills || []).some((s) => s.toLowerCase() === filters.skill.toLowerCase())) return false;
    if (filters.minExp && parseExpYears(app.candidate?.experienceYears) < Number(filters.minExp)) return false;
    if (filters.minAiScore) {
        const score = Number(app.aiMatchScore ?? 0);
        if (filters.minAiScore === 'under60' && score >= 60) return false;
        if (filters.minAiScore !== 'under60' && score < Number(filters.minAiScore)) return false;
    }
    return true;
};

export function useJobApplications(jobId, user, navigate) {
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState('kanban');
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [statusModal, setStatusModal] = useState({ isOpen: false, appId: null, candidateName: '' });
    const [statusForm, setStatusForm] = useState(INITIAL_STATUS_FORM);
    const [isUpdating, setIsUpdating] = useState(false);
    const debouncedKeyword = useDebounce(filters.keyword, 300);

    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['jobApplications', jobId],
        queryFn: async () => {
            const [appsData, statsData, jobData] = await Promise.all([
                axiosClient.get(`${API_URLS.APPLICATIONS}/jobs/${jobId}`),
                axiosClient.get(`${API_URLS.APPLICATIONS}/statistics/job/${jobId}`).catch(() => null),
                axiosClient.get(`${API_URLS.JOBS}/${jobId}`).catch(() => null),
            ]);
            return {
                applications: Array.isArray(appsData) ? appsData : [],
                stats: statsData,
                jobDetail: jobData,
            };
        },
        enabled: Boolean(user && jobId)
    });

    const applications = useMemo(() => data?.applications || [], [data]);
    const stats = data?.stats || null;
    const jobDetail = data?.jobDetail || null;
    const error = isError ? 'Lỗi kết nối máy chủ. Vui lòng thử lại sau! 🌿' : null;

    const handleOpenStatusModal = useCallback((app, newStatus) => {
        if (Number(app.status) === APPLICATION_STATUS.APPLIED && Number(newStatus) === APPLICATION_STATUS.HIRED) {
            toast.error('Không thể nhảy cóc từ Chờ duyệt sang Đã tuyển mà chưa qua Phỏng vấn hoặc Offer!');
            return;
        }
        const startParts = toLocalInputParts(app.interviewTime);
        const endParts = app.interviewEndTime ? toLocalInputParts(app.interviewEndTime) : { time: '10:00' };
        setStatusModal({ isOpen: true, appId: app.applicationId, candidateName: app.candidate?.fullName || 'Ứng viên' });
        setStatusForm({
            ...INITIAL_STATUS_FORM, status: newStatus, message: app.message || '',
            interviewDate: startParts.date,
            interviewStartTime: app.interviewTime ? startParts.time : '09:00',
            interviewEndTime: app.interviewEndTime ? endParts.time : '10:00',
            interviewType: app.interviewType || 'Online',
            meetingLink: app.meetingLink || '', interviewLocation: app.interviewLocation || '',
        });
    }, []);

    const handleConfirmUpdateStatus = async () => {
        const targetStatus = parseInt(statusForm.status, 10);
        const payload = { status: targetStatus, message: statusForm.message || null };

        if (targetStatus === APPLICATION_STATUS.INTERVIEW_SCHEDULED) {
            if (!statusForm.interviewDate || !statusForm.interviewStartTime) {
                toast.error('Vui lòng chọn ngày và giờ bắt đầu phỏng vấn!');
                return;
            }
            const startDt = new Date(`${statusForm.interviewDate}T${statusForm.interviewStartTime}`);
            const endDt = statusForm.interviewEndTime ? new Date(`${statusForm.interviewDate}T${statusForm.interviewEndTime}`) : new Date(startDt.getTime() + 3600000);
            if (endDt <= startDt) {
                toast.error('Giờ kết thúc phỏng vấn phải sau giờ bắt đầu!');
                return;
            }
            payload.interviewTime = startDt.toISOString();
            payload.interviewEndTime = endDt.toISOString();
            payload.interviewType = statusForm.interviewType || 'Online';
            payload.meetingLink = payload.interviewType === 'Online' ? (statusForm.meetingLink || null) : null;
            payload.interviewLocation = payload.interviewType === 'Offline' ? (statusForm.interviewLocation || null) : null;
        }

        setIsUpdating(true);
        const toastId = toast.loading('Đang cập nhật pipeline & gửi thông báo... 🌿');
        try {
            await axiosClient.patch(`${API_URLS.APPLICATIONS}/${statusModal.appId}/status`, payload);
            toast.success('🎉 Đã cập nhật trạng thái và gửi Email thông báo!', { id: toastId });
            setStatusModal({ isOpen: false, appId: null, candidateName: '' });
            queryClient.invalidateQueries({ queryKey: ['jobApplications', jobId] });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Cập nhật thất bại! Vui lòng kiểm tra lại.', { id: toastId });
        } finally {
            setIsUpdating(false);
        }
    };

    const availableSkills = useMemo(() => {
        const set = new Set();
        applications.forEach((a) => (a.candidate?.skills || []).forEach((s) => set.add(s)));
        (jobDetail?.tags || []).forEach((t) => t?.tagName && set.add(t.tagName));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [applications, jobDetail]);

    const filteredApplications = useMemo(
        () => applications.filter((app) => matchesFilters(app, debouncedKeyword.trim().toLowerCase(), filters)),
        [applications, debouncedKeyword, filters]
    );

    return {
        applications, filteredApplications, availableSkills, jobDetail, stats, isLoading, error,
        viewMode, setViewMode, filters,
        updateFilter: (key, val) => setFilters((prev) => ({ ...prev, [key]: val })),
        resetFilters: () => setFilters(DEFAULT_FILTERS),
        statusModal, closeStatusModal: () => setStatusModal({ isOpen: false, appId: null, candidateName: '' }),
        statusForm, handleStatusFormChange: (e) => setStatusForm((prev) => ({ ...prev, [e.target.name]: e.target.value })),
        isUpdating, handleOpenStatusModal, handleConfirmUpdateStatus,
    };
}
