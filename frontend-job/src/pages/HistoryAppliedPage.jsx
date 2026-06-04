import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URLS } from "../api/api";
import axiosClient from "../api/axiosClient";
import toast from "react-hot-toast";

function HistoryAppliedPage() {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isUploading, setIsUploading] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState(null);
    const fileInputRef = useRef(null);

    // 🌟 STATE MỚI: Quản lý Hộp thoại xem thư mời/phản hồi của HR
    const [viewFeedbackModal, setViewFeedbackModal] = useState({
        isOpen: false,
        data: null
    });

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await axiosClient.get(`${API_URLS.APPLICATIONS}/candidate/me`);
                setApplications(data.items || data); // 🌟 Đã dọn dẹp code theo chuẩn mới
            } catch (err) {
                setError("Không thể tải lịch sử ứng tuyển. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [navigate]);

    // HÀM 1: RÚT HỒ SƠ
    const handleWithdraw = async (appId, jobTitle) => {
        if (!window.confirm(`Bạn có chắc chắn muốn rút hồ sơ khỏi vị trí "${jobTitle}" không? Hành động này không thể hoàn tác.`)) return;

        const toastId = toast.loading("Đang rút hồ sơ... 🌿");
        try {
            await axiosClient.delete(`${API_URLS.APPLICATIONS}/${appId}`);
            setApplications(prev => prev.filter(app => app.applicationId !== appId));
            toast.success("Đã rút hồ sơ thành công!", { id: toastId });
        } catch (err) {
            toast.error("Không thể rút hồ sơ lúc này. Vui lòng thử lại!", { id: toastId });
        }
    };

    // HÀM 2: KÍCH HOẠT CHỌN FILE
    const triggerFileSelect = (appId) => {
        setSelectedAppId(appId);
        fileInputRef.current.click();
    };

    // HÀM 3: UPLOAD & ĐỔI CV
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error("Vui lòng chỉ tải lên file PDF nha Trúc ơi! 🌿");
            e.target.value = null;
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading("Đang tải CV mới lên... 🌿");

        try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await axiosClient.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newCvUrl = uploadRes.url || uploadRes.fileUrl || uploadRes.data || uploadRes.file || uploadRes;

            await axiosClient.patch(`${API_URLS.APPLICATIONS}/${selectedAppId}/cv`, { cvUrl: newCvUrl });

            toast.success("🎉 Đã cập nhật CV mới thành công!", { id: toastId });
        } catch (err) {
            toast.error("⚠️ Có lỗi xảy ra khi đổi CV. Vui lòng thử lại!", { id: toastId });
        } finally {
            setIsUploading(false);
            setSelectedAppId(null);
            e.target.value = null;
        }
    };

    const getStatusInfo = (statusCode) => {
        switch (statusCode) {
            case 0:
            case 1: return { text: 'Chờ duyệt', style: 'bg-gray-100 text-gray-600 border-gray-200' };
            case 2: return { text: 'Đang xem xét', style: 'bg-orange-50 text-orange-600 border-orange-200' };
            case 3: return { text: 'Phỏng vấn', style: 'bg-blue-50 text-blue-600 border-blue-200' };
            case 4: return { text: 'Trúng tuyển', style: 'bg-green-50 text-green-600 border-green-200' };
            case 5: return { text: 'Từ chối', style: 'bg-red-50 text-red-600 border-red-200' };
            default: return { text: 'Không xác định', style: 'bg-gray-50 text-gray-500 border-gray-200' };
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải lịch sử ứng tuyển... 🌿</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

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
                    {applications.map((app) => {
                        const statusInfo = getStatusInfo(app.status);
                        // 🌟 Cho phép sửa/xóa khi status là 0 hoặc 1
                        const canEditOrDelete = app.status === 0 || app.status === 1;

                        // 🌟 Kiểm tra xem HR có để lại lời nhắn hay lịch phỏng vấn không
                        const hasFeedback = app.message || app.interviewTime || app.interviewLocation;

                        return (
                            <div key={app.applicationId} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-l-8 border-olive flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                                <div className="flex-1">
                                    <h3 onClick={() => navigate(`/detail-job/${app.jobId}`)} className="text-xl font-bold text-olive hover:text-earth cursor-pointer transition-colors mb-2">
                                        {app.job?.title || "Công việc không xác định"}
                                    </h3>

                                    <div className="flex flex-wrap gap-4 text-gray-600 font-medium mb-3">
                                        <p className="flex items-center"><span className="mr-2">🏢</span> {app.job?.companyName || "Công ty ẩn"}</p>

                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                        <p className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                            📅 Ngày nộp: {new Date(app.appliedDate).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>

                                <div className="shrink-0 mt-4 md:mt-0 flex flex-col items-end gap-3">
                                    <div className={`px-6 py-2.5 rounded-full text-sm font-bold border ${statusInfo.style} shadow-sm text-center min-w-[140px]`}>
                                        {statusInfo.text}
                                    </div>

                                    {/* 🌟 NÚT XEM PHẢN HỒI (Dành cho Ứng viên) */}
                                    {hasFeedback && (
                                        <button
                                            onClick={() => setViewFeedbackModal({ isOpen: true, data: app })}
                                            className="w-full text-xs font-bold bg-cream text-earth hover:text-olive px-3 py-2 rounded-lg transition-colors border border-gray-200 flex items-center justify-center gap-1 shadow-sm"
                                        >
                                            💌 Xem thư mời / phản hồi
                                        </button>
                                    )}

                                    {/* NÚT ĐỔI CV & RÚT HỒ SƠ */}
                                    {canEditOrDelete && (
                                        <div className="flex gap-2">
                                            <button onClick={() => triggerFileSelect(app.applicationId)} disabled={isUploading} className="text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors border border-blue-100">
                                                📄 Đổi CV
                                            </button>
                                            <button onClick={() => handleWithdraw(app.applicationId, app.job?.title)} disabled={isUploading} className="text-xs font-bold bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors border border-red-100">
                                                🗑️ Rút hồ sơ
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            {/* ======================================================= */}
            {/* 🌟 MODAL XEM THƯ MỜI / PHẢN HỒI TỪ HR */}
            {/* ======================================================= */}
            {viewFeedbackModal.isOpen && viewFeedbackModal.data && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border-t-8 border-earth">

                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-cream">
                            <h3 className="text-xl font-bold text-olive flex items-center gap-2">
                                💌 Thư từ Nhà tuyển dụng
                            </h3>
                            <button onClick={() => setViewFeedbackModal({ isOpen: false, data: null })} className="text-gray-400 hover:text-red-500 text-3xl leading-none transition-colors">&times;</button>
                        </div>

                        <div className="p-8 space-y-5">
                            <p className="text-gray-600 text-sm">
                                Vị trí: <strong className="text-textmain text-base">{viewFeedbackModal.data.job?.title}</strong>
                            </p>

                            {/* Nếu là Phỏng vấn thì hiện giờ giấc */}
                            {viewFeedbackModal.data.status === 3 && (
                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-3">
                                    <div>
                                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">⏰ Thời gian phỏng vấn</p>
                                        <p className="text-blue-900 font-medium">
                                            {viewFeedbackModal.data.interviewTime
                                                ? new Date(viewFeedbackModal.data.interviewTime).toLocaleString('vi-VN')
                                                : "Chưa cập nhật"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">📍 Địa điểm / Link tham gia</p>
                                        <p className="text-blue-900 font-medium break-words">
                                            {viewFeedbackModal.data.interviewLocation || "Chưa cập nhật"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Lời nhắn */}
                            {viewFeedbackModal.data.message && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">💬 Lời nhắn từ HR</p>
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-gray-700 whitespace-pre-line italic">
                                        "{viewFeedbackModal.data.message}"
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setViewFeedbackModal({ isOpen: false, data: null })}
                                className="px-6 py-2.5 rounded-xl font-bold text-white bg-earth hover:bg-olive transition-colors shadow-sm"
                            >
                                Đã hiểu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HistoryAppliedPage;