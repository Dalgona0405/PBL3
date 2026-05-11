import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URLS } from "../api/api";
import axiosClient from "../api/axiosClient";

function HistoryAppliedPage() {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await axiosClient.get(`${API_URLS.APPLICATIONS}/candidate/me`);
                setApplications(data);
            } catch (err) {
                setError("Không thể tải lịch sử ứng tuyển. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [navigate]);

    // Hàm "Tô màu" cho các trạng thái
    const getStatusInfo = (statusCode) => {
        switch (statusCode) {
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
        <div className="max-w-5xl mx-auto w-full pb-12">
            
            {/* HEADER */}
            <div className="flex justify-between items-end mb-8 border-b-2 border-olive pb-4">
                <h2 className="text-3xl font-bold text-textmain">📤 Lịch sử ứng tuyển</h2>
                <span className="text-gray-500 font-medium bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100">
                    Tổng cộng: <strong className="text-earth">{applications.length}</strong>
                </span>
            </div>

            {/* NẾU CHƯA NỘP CV NÀO */}
            {applications.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-50">
                    <p className="text-gray-500 text-lg mb-6">Bạn chưa ứng tuyển công việc nào cả.</p>
                    <button 
                        onClick={() => navigate('/')} 
                        className="bg-earth hover:bg-olive text-white font-bold py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
                    >
                        Tìm việc ngay 🚀
                    </button>
                </div>
            ) : (
                
                /* DANH SÁCH CÁC CV ĐÃ NỘP */
                <div className="space-y-6">
                    {applications.map((app) => {
                        const statusInfo = getStatusInfo(app.status);

                        return (
                            <div key={app.applicationId} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-l-8 border-earth flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                
                                {/* Cột trái: Thông tin Job */}
                                <div className="flex-1">
                                    <h3 
                                        onClick={() => navigate(`/detail-job/${app.jobId}`)}
                                        className="text-xl font-bold text-olive hover:text-earth cursor-pointer transition-colors mb-2"
                                    >
                                        {app.job?.title || "Công việc không xác định"}
                                    </h3>

                                    <div className="flex flex-wrap gap-4 text-gray-600 font-medium mb-3">
                                        <p className="flex items-center"><span className="mr-2">🏢</span> {app.job?.companyName || "Công ty ẩn"}</p>
                                        <p className="flex items-center"><span className="mr-2">📍</span> {app.job?.locationName || "Chưa cập nhật"}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                        <p className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                            📅 Ngày nộp: {new Date(app.appliedDate).toLocaleDateString('vi-VN')}
                                        </p>
                                        <p className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                            💰 Lương: {app.job?.salaryMin ? `${app.job.salaryMin} - ${app.job.salaryMax} triệu` : 'Thỏa thuận'}
                                        </p>
                                    </div>
                                </div>

                                {/* Cột phải: Trạng thái (Badge) */}
                                <div className="shrink-0 mt-4 md:mt-0">
                                    <div className={`px-6 py-2.5 rounded-full text-sm font-bold border ${statusInfo.style} shadow-sm text-center min-w-[140px]`}>
                                        {statusInfo.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default HistoryAppliedPage;