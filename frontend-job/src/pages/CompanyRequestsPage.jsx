import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function CompanyRequestsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. LẤY DANH SÁCH HỒ SƠ ĐANG CHỜ DUYỆT
    useEffect(() => {
        if (!user || user.role !== 'Admin') {
            navigate('/');
            return;
        }

        const fetchPendingRequests = async () => {
            try {
                const toastId = toast.loading("Đang tải danh sách yêu cầu... 🌿");
                setIsLoading(true);
                const data = await axiosClient.get(`${API_URLS.COMPANY_REQUESTS}/pending`);
                setRequests(data ||[]);
            } catch (err) {
                toast.error("Không thể tải danh sách yêu cầu. Vui lòng thử lại sau! 🌿", { id: toastId });
            } finally {
                setIsLoading(false);
            }
        };

        fetchPendingRequests();
    }, [user, navigate]);

    // 2. HÀM XỬ LÝ ĐÓNG MỘC (DUYỆT / TỪ CHỐI)
    const handleUpdateStatus = async (requestId, newStatus, companyName) => {
        // newStatus: Backend quy định 1 là Duyệt (Approved), 2 là Từ chối (Rejected)
        const actionName = newStatus === 1 ? "DUYỆT" : "TỪ CHỐI";
        
        if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} công ty "${companyName}" không?`)) {
            return;
        }

        try {
            const toastId = toast.loading(`Đang ${actionName.toLowerCase()} công ty... 🌿`);
            await axiosClient.patch(`${API_URLS.COMPANY_REQUESTS}/${requestId}/status`, {
                status: newStatus
            });

            setRequests(prev => prev.filter(req => req.requestId !== requestId));
            
            toast.success(`🎉 Đã ${actionName.toLowerCase()} thành công!`, { id: toastId });
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái.";
            toast.error(`⚠️ Lỗi: ${errorMsg}`, { id: toastId });
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải danh sách chờ duyệt... 🌿</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            
            {/* HEADER */}
            <div className="flex justify-between items-end mb-8 border-b-2 border-olive pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-textmain mb-2">🛡️ Phê duyệt Công ty</h2>
                    <p className="text-gray-500">Quản lý các yêu cầu gia nhập/tạo công ty từ Nhà tuyển dụng.</p>
                </div>
                <span className="bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100 text-gray-500 font-medium">
                    Đang chờ duyệt: <strong className="text-earth">{requests.length}</strong>
                </span>
            </div>

            {/* DANH SÁCH YÊU CẦU */}
            {requests.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-50">
                    <div className="text-5xl mb-4">☕</div>
                    <p className="text-gray-500 text-lg font-medium">Tuyệt vời! Hiện tại không có yêu cầu nào cần duyệt.</p>
                    <p className="text-gray-400 text-sm mt-2">Admin có thể nghỉ ngơi uống trà rồi nhé 🌿</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {requests.map((req) => (
                        <div key={req.requestId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-shadow border-l-8 border-orange-300">
                            
                            {/* Thông tin người gửi & Công ty */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">
                                        Đang chờ duyệt
                                    </span>
                                    <span className="text-sm text-gray-400">
                                        📅 Ngày gửi: {new Date(req.requestDate || Date.now()).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                
                                <h3 className="text-xl font-bold text-olive mb-1">
                                    Công ty: {req.company?.companyName || "Tên công ty ẩn"}
                                </h3>
                                <p className="text-gray-600 font-medium flex items-center gap-2">
                                    <span>👤 Người yêu cầu:</span> 
                                    <span className="text-textmain">{req.recruiter?.fullName || "HR Ẩn danh"}</span>
                                </p>
                            </div>

                            {/* Nút Hành động (Đóng mộc) */}
                            <div className="flex gap-3 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                                <button 
                                    onClick={() => handleUpdateStatus(req.requestId, 2, req.company?.companyName)}
                                    className="flex-1 md:flex-none bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-6 py-2.5 rounded-xl font-bold transition-colors border border-red-100 hover:border-red-500"
                                >
                                    ❌ Từ chối
                                </button>
                                <button 
                                    onClick={() => handleUpdateStatus(req.requestId, 1, req.company?.companyName)}
                                    className="flex-1 md:flex-none bg-earth text-white hover:bg-olive px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                                >
                                    ✅ Phê duyệt
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CompanyRequestsPage;