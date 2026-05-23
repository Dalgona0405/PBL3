import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function JobApplicationsPage() {
    const { jobId } = useParams(); // Lấy ID của Job từ trên thanh địa chỉ (URL) xuống
    const navigate = useNavigate();
    const { user } = useAuth();

    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. LẤY DANH SÁCH CV CỦA JOB NÀY
    useEffect(() => {
        if (!user) { navigate('/login'); return; }

        const fetchApplications = async () => {
            try {
                setIsLoading(true);
                const data = await axiosClient.get(`${API_URLS.APPLICATIONS}/jobs/${jobId}`);
                setApplications(data);
            } catch (err) {
                setError("Lỗi kết nối máy chủ. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchApplications();
    }, [jobId, navigate]);

    // 2. HÀM CẬP NHẬT TRẠNG THÁI CV
    const handleUpdateStatus = async (appId, newStatus) => {
        try {
            await axiosClient.patch(`${API_URLS.APPLICATIONS}/${appId}/status`, { status: newStatus });

            // Cập nhật UI ngay lập tức
            setApplications(prev => prev.map(app =>
                app.applicationId === appId ? { ...app, status: newStatus } : app
            ));
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Cập nhật thất bại! Bạn có quyền đổi trạng thái không?";
            toast.error(errorMsg, { id: toastId });
        }
    };

    // Hàm tô màu Badge trạng thái
    const getStatusBadge = (status) => {
        switch (status) {
            case 1: return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">Chờ duyệt</span>;
            case 2: return <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">Đang xem xét</span>;
            case 3: return <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">Phỏng vấn</span>;
            case 4: return <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Trúng tuyển</span>;
            case 5: return <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-200">Từ chối</span>;
            default: return <span className="bg-gray-50 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">Chưa rõ</span>;
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải danh sách ứng viên... 🌿</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    // Lấy tên Job từ ứng viên đầu tiên (nếu có) để hiển thị lên Header cho đẹp
    const jobTitle = applications.length > 0 ? applications[0].job?.title : "Công việc này";

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">

            {/* NÚT QUAY LẠI & HEADER */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/recruiter-dashboard')}
                    className="text-gray-500 hover:text-olive font-medium flex items-center gap-2 mb-4 transition-colors"
                >
                    ⬅ Quay lại Dashboard
                </button>
                <div className="border-b-2 border-olive pb-4 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-bold text-textmain mb-2">👥 Danh sách Ứng viên</h2>
                        <p className="text-gray-500">Đang xem hồ sơ cho vị trí: <strong className="text-earth">{jobTitle}</strong></p>
                    </div>
                    <span className="bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100 text-gray-500 font-medium">
                        Tổng số CV: <strong className="text-olive">{applications.length}</strong>
                    </span>
                </div>
            </div>

            {/* BẢNG DANH SÁCH ỨNG VIÊN */}
            {applications.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-50">
                    <p className="text-gray-500 text-lg">Chưa có ứng viên nào nộp CV vào vị trí này. 🌿</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-cream text-olive border-b-2 border-gray-100">
                                    <th className="py-4 px-6 font-bold">Ứng viên</th>
                                    <th className="py-4 px-6 font-bold">Ngày nộp</th>
                                    <th className="py-4 px-6 font-bold">CV Đính kèm</th>
                                    <th className="py-4 px-6 font-bold">Trạng thái</th>
                                    <th className="py-4 px-6 font-bold">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map(app => (
                                    <tr key={app.applicationId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                                    {app.candidate?.avatar ? <img src={app.candidate.avatar} alt="avt" className="w-full h-full object-cover" /> : '👤'}
                                                </div>
                                                <div>
                                                    <strong className="text-textmain block text-lg">{app.candidate?.fullName}</strong>
                                                    <span className="text-sm text-gray-500">{app.candidate?.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 font-medium">
                                            {new Date(app.appliedDate).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="py-4 px-6">
                                            {app.candidate?.cvUrl ? (
                                                <a href={app.candidate.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
                                                    📄 Xem CV
                                                </a>
                                            ) : <span className="text-gray-400 text-sm italic">Chưa có CV</span>}
                                        </td>
                                        <td className="py-4 px-6">
                                            {getStatusBadge(app.status)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <select
                                                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-earth focus:border-earth block w-full p-2.5 outline-none cursor-pointer shadow-sm font-medium"
                                                value={app.status}
                                                onChange={(e) => handleUpdateStatus(app.applicationId, parseInt(e.target.value))}
                                            >
                                                <option value={1}>Chờ duyệt</option>
                                                <option value={2}>Đang xem xét</option>
                                                <option value={3}>Phỏng vấn</option>
                                                <option value={4}>Trúng tuyển</option>
                                                <option value={5}>Từ chối</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default JobApplicationsPage;