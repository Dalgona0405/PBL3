import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import CompanyRequestCard from './components/CompanyRequestCard';

function CompanyRequestsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isCompanyMaster = Boolean(user && user.role === 'Company');

    useEffect(() => {
        if (!isCompanyMaster) {
            navigate('/');
        }
    }, [isCompanyMaster, navigate]);

    const { data: requests = [], isLoading, isError } = useQuery({
        queryKey: ['companyJoinRequests', user?.id],
        queryFn: async () => {
            const data = await axiosClient.get(`${API_URLS.COMPANY_REQUESTS}/pending`);
            return Array.isArray(data) ? data : [];
        },
        enabled: isCompanyMaster
    });

    const handleUpdateStatus = async (requestId, newStatus, companyName) => {
        const actionName = newStatus === 1 ? 'DUYỆT' : 'TỪ CHỐI';
        const displayName = companyName || 'Công ty';

        if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} yêu cầu của "${displayName}" không?`)) {
            return;
        }

        const toastId = toast.loading(`Đang ${actionName.toLowerCase()} yêu cầu...`);
        try {
            await axiosClient.patch(`${API_URLS.COMPANY_REQUESTS}/${requestId}/status`, {
                status: newStatus
            });

            queryClient.setQueryData(['companyJoinRequests', user?.id], (prev = []) =>
                prev.filter((req) => req.requestId !== requestId)
            );
            toast.success(`Đã ${actionName.toLowerCase()} thành công!`, { id: toastId });
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.';
            toast.error(`Lỗi: ${errorMsg}`, { id: toastId });
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải danh sách chờ duyệt... 🌿</div>;
    if (isError) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">Không thể tải danh sách yêu cầu. Vui lòng thử lại sau!</div>;

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            <div className="flex justify-between items-end mb-8 border-b-2 border-olive pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-textmain mb-2">🛡️ Phê duyệt Yêu cầu Gia nhập</h2>
                    <p className="text-gray-500">Quản lý các yêu cầu gia nhập công ty từ Nhà tuyển dụng.</p>
                </div>
                <span className="bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100 text-gray-500 font-medium">
                    Đang chờ duyệt: <strong className="text-earth">{requests.length}</strong>
                </span>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-50">
                    <div className="text-5xl mb-4">☕</div>
                    <p className="text-gray-500 text-lg font-medium">Tuyệt vời! Hiện tại không có yêu cầu nào cần duyệt.</p>
                    <p className="text-gray-400 text-sm mt-2">Bạn sẽ nhận được thông báo khi có nhân sự mới gửi yêu cầu.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {requests.map((req) => (
                        <CompanyRequestCard
                            key={req.requestId}
                            request={req}
                            onUpdateStatus={handleUpdateStatus}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default CompanyRequestsPage;
