import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function RecruiterDashboardPage() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [recruiterInfo, setRecruiterInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    // 1. LẤY DANH SÁCH CÔNG VIỆC CỦA HR
    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        if (user.role !== 'Recruiter') { navigate('/'); return; }

        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);

                // 1. Lấy thông tin Recruiter (Để hiển thị tên, avatar, tên công ty...)
                const recruiterData = await axiosClient.get(`${API_URLS.RECRUITERS}/${user.id}`);
                setRecruiterInfo(recruiterData);

                // 2. Lấy TOÀN BỘ danh sách công việc của công ty đó
                if (recruiterData.company && recruiterData.company.companyId) {                    
                    const jobsData = await axiosClient.get(`${API_URLS.JOBS}/company/${recruiterData.company.companyId}`);
                    const jobsList = jobsData.items || jobsData.Items || jobsData.data || jobsData;
                    setJobs(Array.isArray(jobsList) ? jobsList : []);
                } else {
                    setJobs([]);
                }
            } catch (err) {
                setError("Lỗi kết nối máy chủ. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate, user]);

    // 2. HÀM XÓA TIN TUYỂN DỤNG 
    const handleDeleteJob = async (jobId) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa tin tuyển dụng này không? Hành động này không thể hoàn tác! 🌿")) {
            try {
                await axiosClient.delete(`${API_URLS.JOBS}/${jobId}`);
                setJobs(prevJobs => prevJobs.filter(job => job.jobId !== jobId));
                toast.success("Đã xóa tin tuyển dụng thành công!");
            } catch (err) {
                toast.error("Không thể xóa tin này. Có thể đã có người ứng tuyển! 🌿");
            }
        }
    };

    // 3. HÀM MỚI: LẬT BẢNG HIỆU (ĐÓNG / MỞ TIN)
    const handleToggleStatus = async (jobId, currentStatus) => {
        const isCurrentlyOpen = currentStatus === 1 || currentStatus == null;
        const newStatus = isCurrentlyOpen ? 0 : 1;

        const actionText = newStatus === 1 ? "MỞ LẠI" : "ĐÓNG";

        if (!window.confirm(`Bạn có chắc muốn ${actionText} tin tuyển dụng này không?`)) return;

        const toastId = toast.loading(`Đang ${actionText.toLowerCase()} tin... 🌿`);
        try {
            await axiosClient.patch(`${API_URLS.JOBS}/${jobId}/status`, { status: newStatus });

            setJobs(prevJobs => prevJobs.map(job =>
                job.jobId === jobId ? { ...job, status: newStatus } : job
            ));

            toast.success(`🎉 Đã ${actionText.toLowerCase()} tin thành công!`, { id: toastId });
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái.";
            toast.error(`⚠️ Lỗi: ${errorMsg}`, { id: toastId });
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải dữ liệu... 🌿</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    const hasCompany = recruiterInfo?.company != null;

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">

            {/* HEADER & NÚT ĐĂNG TIN */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b-2 border-olive pb-4 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-textmain mb-2">🏢 Quản lý Bài đăng</h2>
                    <p className="text-gray-500">
                        {hasCompany
                            ? `Công ty: ${recruiterInfo.company.companyName}`
                            : "⚠️ Bạn chưa gia nhập công ty nào. Hãy cập nhật ở trang Hồ sơ!"}
                    </p>
                </div>

                <button
                    disabled={!hasCompany}
                    onClick={() => navigate('/recruiter/jobs/create')}
                    className={`px-6 py-3 rounded-full font-bold shadow-md transition-all transform ${hasCompany ? 'bg-earth text-white hover:bg-olive hover:-translate-y-1' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    title={!hasCompany ? "Vui lòng gia nhập công ty trước khi đăng tin" : ""}
                >
                    + Đăng tin tuyển dụng
                </button>
            </div>

            {/* DANH SÁCH BÀI ĐĂNG */}
            {jobs.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-50">
                    <p className="text-gray-500 text-lg">Công ty bạn chưa đăng tin tuyển dụng nào. 🌿</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {jobs.map(job => {
                        // Kiểm tra trạng thái hiện tại (Mặc định nếu null thì coi như đang mở = 1)
                        const isJobOpen = job.status === 1 || job.status == null;

                        return (
                            <div key={job.jobId} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-all border-l-8 ${isJobOpen ? 'border-earth' : 'border-gray-300 opacity-80'}`}>

                                {/* Cột trái: Thông tin Job */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3
                                            className={`text-xl font-bold cursor-pointer transition-colors ${isJobOpen ? 'text-olive hover:text-earth' : 'text-gray-500 hover:text-gray-700'}`}
                                            onClick={() => navigate(`/detail-job/${job.jobId}`)}
                                        >
                                            {job.title}
                                        </h3>

                                        {/* BADGE TRẠNG THÁI */}
                                        {isJobOpen ? (
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Đang mở</span>
                                        ) : (
                                            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">Đã đóng</span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 font-medium">
                                        <p>📍 {job.locationName || 'Chưa cập nhật'}</p>
                                        <p>💰 {job.salaryMin ? `${job.salaryMin} - ${job.salaryMax} triệu` : 'Thỏa thuận'}</p>
                                        <p>⏳ Hạn chót: {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Không thời hạn'}</p>
                                    </div>
                                </div>

                                {/* Cột phải: Các nút hành động */}
                                <div className="flex flex-wrap items-center gap-3 shrink-0 mt-4 md:mt-0">

                                    {/* NÚT LẬT BẢNG HIỆU (ĐÓNG/MỞ) */}
                                    <button
                                        onClick={() => handleToggleStatus(job.jobId, job.status)}
                                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors border ${isJobOpen ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-500 hover:text-white' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-500 hover:text-white'}`}
                                    >
                                        {isJobOpen ? '🔒 Đóng tin' : '🔓 Mở lại'}
                                    </button>

                                    <button
                                        onClick={() => navigate(`/recruiter/jobs/${job.jobId}/applications`)}
                                        className="bg-cream text-olive border border-olive hover:bg-olive hover:text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                                    >
                                        <span>👥</span> Xem CV
                                    </button>

                                    <button
                                        onClick={() => navigate(`/recruiter/jobs/edit/${job.jobId}`)}
                                        className="bg-gray-100 text-gray-600 hover:bg-earth hover:text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                                    >
                                        ✏️ Sửa
                                    </button>

                                    <button
                                        onClick={() => handleDeleteJob(job.jobId)}
                                        className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                                    >
                                        🗑️ Xóa
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default RecruiterDashboardPage;