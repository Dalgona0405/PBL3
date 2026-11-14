import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { API_URLS } from '../../../api/api';
import axiosClient from '../../../api/axiosClient';
import { useAuth } from '../../../contexts/AuthContext';
import { useChatStore } from '../../../stores/useChatStore';

export function useDetailJob(jobId) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const openChatWith = useChatStore((state) => state.openChatWith);

    const [showModal, setShowModal] = useState(false);
    const [cvOption, setCvOption] = useState('default');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpeningChat, setIsOpeningChat] = useState(false);
    const [candidateProfile, setCandidateProfile] = useState(null);

    const { data: jobDetail = null } = useQuery({
        queryKey: ['jobDetail', jobId],
        queryFn: () => axiosClient.get(`${API_URLS.JOBS}/${jobId}`),
        enabled: Boolean(jobId)
    });

    const { data: matchResult = null } = useQuery({
        queryKey: ['jobMatch', jobId, user?.id],
        queryFn: () => axiosClient.get(`${API_URLS.JOBS}/${jobId}/match/${user.id}`),
        enabled: Boolean(jobId && user?.role === 'Candidate')
    });

    const handleOpenModal = async () => {
        if (!user) {
            toast.error('Bạn cần đăng nhập để ứng tuyển!');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        if (user.role !== 'Candidate') {
            toast.error('Chỉ tài khoản Ứng viên mới có thể nộp hồ sơ ứng tuyển.');
            return;
        }

        const toastId = toast.loading('Đang kiểm tra hồ sơ của bạn...');
        try {
            const profileRes = await axiosClient.get(`${API_URLS.CANDIDATE}/me`);
            const actualProfile = profileRes.items || profileRes.data || profileRes;
            setCandidateProfile(actualProfile);
            toast.dismiss(toastId);

            const cv = actualProfile?.cvUrl || actualProfile?.cVUrl || actualProfile?.CVUrl;
            setCvOption(cv ? 'default' : 'new');
            setShowModal(true);
        } catch {
            toast.error('Lỗi khi kiểm tra hồ sơ. Vui lòng thử lại!', { id: toastId });
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Vui lòng chỉ tải lên file PDF!');
            e.target.value = null;
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File CV quá lớn, vui lòng chọn file dưới 5MB!');
            e.target.value = null;
            return;
        }
        setSelectedFile(file);
    };

    const handleConfirmApply = async () => {
        setIsSubmitting(true);
        let finalCvUrl = null;
        const toastId = toast.loading('Đang gửi hồ sơ của bạn...');

        try {
            if (cvOption === 'new') {
                if (!selectedFile) {
                    toast.error('Bạn chưa chọn file CV mới!', { id: toastId });
                    setIsSubmitting(false);
                    return;
                }
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadRes = await axiosClient.post(API_URLS.FILES_UPLOAD, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalCvUrl = uploadRes.url || uploadRes.fileUrl || uploadRes.data || uploadRes.file || uploadRes;
            } else {
                const defaultCv = candidateProfile?.cvUrl || candidateProfile?.cVUrl || candidateProfile?.CVUrl;
                if (!defaultCv) {
                    toast.error('Bạn chưa có CV mặc định. Vui lòng tải CV mới lên!', { id: toastId });
                    setIsSubmitting(false);
                    return;
                }
            }

            await axiosClient.post(API_URLS.APPLICATIONS, {
                userId: user.id,
                jobId: parseInt(jobId, 10),
                cvUrl: finalCvUrl
            });

            toast.success('Nộp CV thành công! Kênh trao đổi với HR đã sẵn sàng.', { id: toastId });
            setShowModal(false);
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Bạn đã ứng tuyển công việc này rồi hoặc lỗi mạng.';
            toast.error(`Lỗi: ${errorMsg}`, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChatWithRecruiter = async () => {
        if (!user) {
            toast.error('Bạn cần đăng nhập để nhắn tin với nhà tuyển dụng!');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        if (user.role !== 'Candidate') {
            toast.error('Chỉ tài khoản Ứng viên mới có thể nhắn tin cho nhà tuyển dụng.');
            return;
        }
        if (!jobDetail) return;

        setIsOpeningChat(true);
        try {
            if (!jobDetail.companyId) {
                if (!jobDetail.postedByUserId) {
                    toast.error('Tin tuyển dụng này hiện chưa có nhân sự tuyển dụng trực tuyến.');
                    return;
                }
                await openChatWith({
                    partnerId: jobDetail.postedByUserId,
                    partnerName: jobDetail.company?.companyName || 'Nhà tuyển dụng độc lập',
                    partnerAvatar: jobDetail.company?.logoImg || null,
                    partnerRole: 'Recruiter',
                    jobId: jobDetail.jobId,
                    jobTitle: jobDetail.title
                });
                return;
            }

            const recruiters = await axiosClient.get(`${API_URLS.RECRUITERS}/company/${jobDetail.companyId}`);
            const list = Array.isArray(recruiters) ? recruiters : [];
            const hr = list.find((r) => r.userId === jobDetail.postedByUserId) || list[0] || null;
            const partnerId = hr?.userId || jobDetail.postedByUserId;

            if (!partnerId) {
                toast.error('Doanh nghiệp này hiện chưa có nhân sự tuyển dụng trực tuyến.');
                return;
            }

            await openChatWith({
                partnerId,
                partnerName: hr?.fullName || jobDetail.company?.companyName || 'Nhà tuyển dụng',
                partnerAvatar: hr?.avatar || jobDetail.company?.logoImg || null,
                partnerRole: 'Recruiter',
                jobId: jobDetail.jobId,
                jobTitle: jobDetail.title
            });
        } catch {
            toast.error('Không thể kết nối tới nhà tuyển dụng lúc này.');
        } finally {
            setIsOpeningChat(false);
        }
    };

    return {
        user, jobDetail, matchResult, showModal, setShowModal,
        cvOption, setCvOption, isSubmitting, isOpeningChat, candidateProfile,
        handleOpenModal, handleFileChange, handleConfirmApply, handleOpenChatWithRecruiter,
        goBack: () => navigate(-1),
        goToCompany: (companyId) => navigate(`/detail-company/${companyId}`)
    };
}
