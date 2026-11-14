import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import AppliedJobItem from './components/AppliedJobItem';
import HrFeedbackModal from './components/HrFeedbackModal';

function HistoryAppliedPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isUploading, setIsUploading] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState(null);
    const fileInputRef = useRef(null);

    const [viewFeedbackModal, setViewFeedbackModal] = useState({
        isOpen: false,
        data: null
    });

    const { data: applications = [], isLoading, isError } = useQuery({
        queryKey: ['myApplications'],
        queryFn: async () => {
            const data = await axiosClient.get(`${API_URLS.APPLICATIONS}/candidate/me`);
            return data.items || data || [];
        }
    });

    const handleWithdraw = async (appId, jobTitle) => {
        if (!window.confirm(`Bạn có chắc chắn muốn rút hồ sơ khỏi vị trí "${jobTitle}" không? Hành động này không thể hoàn tác.`)) return;

        const toastId = toast.loading("Đang rút hồ sơ... 🌿");
        try {
            await axiosClient.delete(`${API_URLS.APPLICATIONS}/${appId}`);
            queryClient.setQueryData(['myApplications'], (prev = []) =>
                prev.filter((app) => app.applicationId !== appId)
            );
            toast.success("Đã rút hồ sơ thành công!", { id: toastId });
        } catch {
            toast.error("Không thể rút hồ sơ lúc này. Vui lòng thử lại!", { id: toastId });
        }
    };

    const triggerFileSelect = (appId) => {
        setSelectedAppId(appId);
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error("Vui lòng chỉ tải lên tệp PDF!");
            e.target.value = null;
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading("Đang tải CV mới lên... 🌿");

        try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await axiosClient.post(API_URLS.FILES_UPLOAD, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newCvUrl = uploadRes.url || uploadRes.fileUrl || uploadRes.data || uploadRes.file || uploadRes;

            await axiosClient.patch(`${API_URLS.APPLICATIONS}/${selectedAppId}/cv`, { cvUrl: newCvUrl });

            queryClient.setQueryData(['myApplications'], (prev = []) =>
                prev.map((app) => (app.applicationId === selectedAppId ? { ...app, cvUrl: newCvUrl } : app))
            );
            toast.success("🎉 Đã cập nhật CV mới thành công!", { id: toastId });
        } catch {
            toast.error("⚠️ Có lỗi xảy ra khi đổi CV. Vui lòng thử lại!", { id: toastId });
        } finally {
            setIsUploading(false);
            setSelectedAppId(null);
            e.target.value = null;
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải lịch sử ứng tuyển... 🌿</div>;
    if (isError) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">Không thể tải lịch sử ứng tuyển. Vui lòng thử lại sau! 🌿</div>;

    return (
        <div className="max-w-5xl mx-auto w-full pb-12 relative">
            <div className="flex justify-between items-end mb-8 border-b-2 border-olive pb-4">
                <h2 className="text-3xl font-bold text-textmain">📤 Danh sách ứng tuyển</h2>
                <span className="text-gray-500 font-medium bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100">
                    Tổng cộng: <strong className="text-earth">{applications.length}</strong>
                </span>
            </div>

            {applications.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-50">
                    <p className="text-gray-500 text-lg mb-6">Bạn chưa ứng tuyển công việc nào cả.</p>
                    <button onClick={() => navigate('/')} className="bg-earth hover:bg-olive text-white font-bold py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
                        Tìm việc ngay 🚀
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {applications.map((app) => (
                        <AppliedJobItem
                            key={app.applicationId}
                            app={app}
                            isUploading={isUploading}
                            onNavigateJob={(jobId) => navigate(`/detail-job/${jobId}`)}
                            onViewFeedback={(data) => setViewFeedbackModal({ isOpen: true, data })}
                            onChangeCv={triggerFileSelect}
                            onWithdraw={handleWithdraw}
                        />
                    ))}
                </div>
            )}

            <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            {viewFeedbackModal.isOpen && viewFeedbackModal.data && (
                <HrFeedbackModal
                    data={viewFeedbackModal.data}
                    onClose={() => setViewFeedbackModal({ isOpen: false, data: null })}
                />
            )}
        </div>
    );
}

export default HistoryAppliedPage;
