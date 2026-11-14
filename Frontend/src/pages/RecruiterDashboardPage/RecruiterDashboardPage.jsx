import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import RecruiterJobItem from './components/RecruiterJobItem';

function RecruiterDashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [navigate, user]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['recruiterDashboard', user?.id],
        queryFn: async () => {
            const recruiterData = await axiosClient.get(`${API_URLS.RECRUITERS}/${user.id}`);
            const jobsUrl = recruiterData.company?.companyId
                ? `${API_URLS.JOBS}/company/${recruiterData.company.companyId}`
                : `${API_URLS.JOBS}/my-jobs`;
            const jobsData = await axiosClient.get(jobsUrl);
            const jobsList = jobsData.items || jobsData.Items || jobsData.data || jobsData;
            return {
                recruiterInfo: recruiterData,
                jobs: Array.isArray(jobsList) ? jobsList : []
            };
        },
        enabled: Boolean(user?.id)
    });

    const recruiterInfo = data?.recruiterInfo || null;
    const jobs = data?.jobs || [];

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa tin tuyển dụng này không? Hành động này không thể hoàn tác!")) return;

        try {
            await axiosClient.delete(`${API_URLS.JOBS}/${jobId}`);
            queryClient.setQueryData(['recruiterDashboard', user?.id], (prev) =>
                prev ? { ...prev, jobs: prev.jobs.filter((job) => job.jobId !== jobId) } : prev
            );
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            toast.success("Đã xóa tin tuyển dụng thành công!");
        } catch {
            toast.error("Không thể xóa tin này. Có thể đã có ứng viên nộp hồ sơ!");
        }
    };

    const handleToggleStatus = async (jobId, currentStatus) => {
        const isCurrentlyOpen = currentStatus === 1 || currentStatus == null;
        const newStatus = isCurrentlyOpen ? 0 : 1;
        const actionText = newStatus === 1 ? "MỞ LẠI" : "ĐÓNG";

        if (!window.confirm(`Bạn có chắc muốn ${actionText} tin tuyển dụng này không?`)) return;

        const toastId = toast.loading(`Đang ${actionText.toLowerCase()} tin... 🌿`);
        try {
            await axiosClient.patch(`${API_URLS.JOBS}/${jobId}/status`, { status: newStatus });
            queryClient.setQueryData(['recruiterDashboard', user?.id], (prev) =>
                prev
                    ? {
                        ...prev,
                        jobs: prev.jobs.map((job) => (job.jobId === jobId ? { ...job, status: newStatus } : job))
                    }
                    : prev
            );
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            toast.success(`🎉 Đã ${actionText.toLowerCase()} tin thành công!`, { id: toastId });
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái.";
            toast.error(`⚠️ Lỗi: ${errorMsg}`, { id: toastId });
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải dữ liệu... 🌿</div>;
    if (isError) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">Lỗi kết nối máy chủ. Vui lòng thử lại sau! 🌿</div>;

    const hasCompany = recruiterInfo?.company != null;

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b-2 border-olive pb-4 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-textmain mb-2">🏢 Quản lý Bài đăng</h2>
                    {hasCompany ? (
                        <p className="text-gray-500">Công ty: {recruiterInfo.company.companyName}</p>
                    ) : (
                        <p className="text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-sm font-medium mt-1">
                            ⚠️ Nhà tuyển dụng độc lập (Chưa xác minh doanh nghiệp) — Tin đăng của bạn sẽ gắn nhãn cảnh báo chưa xác minh doanh nghiệp.
                        </p>
                    )}
                </div>

                <button
                    onClick={() => navigate('/recruiter/jobs/create')}
                    className="px-6 py-3 rounded-full font-bold shadow-md transition-all transform bg-earth text-white hover:bg-olive hover:-translate-y-1 shrink-0"
                >
                    + Đăng tin tuyển dụng
                </button>
            </div>

            {jobs.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-50">
                    <p className="text-gray-500 text-lg">
                        {hasCompany ? 'Công ty bạn chưa đăng tin tuyển dụng nào. 🌿' : 'Bạn chưa đăng tin tuyển dụng độc lập nào. 🌿'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {jobs.map((job) => (
                        <RecruiterJobItem
                            key={job.jobId}
                            job={job}
                            onNavigate={(path) => navigate(path)}
                            onToggleStatus={handleToggleStatus}
                            onDelete={handleDeleteJob}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default RecruiterDashboardPage;
