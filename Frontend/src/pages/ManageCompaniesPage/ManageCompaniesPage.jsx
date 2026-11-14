import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import useDebounce from '../../hooks/useDebounce';
import CompanyTable from './components/CompanyTable';

function ManageCompaniesPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [keyword, setKeyword] = useState('');
    const debouncedKeyword = useDebounce(keyword, 300);
    const [currentPage, setCurrentPage] = useState(1);

    const queryKey = ['manageCompanies', debouncedKeyword, currentPage];

    const { data, isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            let url = `${API_URLS.COMPANIES}/search?page=${currentPage}&pageSize=10`;
            if (debouncedKeyword) {
                url += `&keyword=${encodeURIComponent(debouncedKeyword)}`;
            }
            const res = await axiosClient.get(url);
            return {
                items: res.items || [],
                totalPages: res.totalPages || 1
            };
        },
        placeholderData: keepPreviousData
    });

    const companies = data?.items || [];
    const totalPages = data?.totalPages || 1;

    const handleToggleVerify = async (company) => {
        const nextState = !company.isVerified;
        const actionLabel = nextState ? 'Cấp Tick Xanh' : 'Thu hồi Tick Xanh';
        const toastId = toast.loading(`Đang ${actionLabel.toLowerCase()}...`);
        try {
            await axiosClient.patch(`${API_URLS.COMPANIES}/${company.companyId}/verify?isVerified=${nextState}`);
            queryClient.setQueryData(queryKey, (prev) =>
                prev
                    ? {
                        ...prev,
                        items: prev.items.map((c) =>
                            c.companyId === company.companyId ? { ...c, isVerified: nextState } : c
                        )
                    }
                    : prev
            );
            toast.success(`Đã ${actionLabel.toLowerCase()} cho ${company.companyName}!`, { id: toastId });
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Không thể cập nhật trạng thái xác minh.';
            toast.error(`Lỗi: ${errorMsg}`, { id: toastId });
        }
    };

    const handleDelete = async (companyId, companyName) => {
        if (!window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA công ty "${companyName}" không? Toàn bộ tin tuyển dụng của công ty này có thể bị ảnh hưởng!`)) {
            return;
        }

        const toastId = toast.loading('Đang xóa công ty...');
        try {
            await axiosClient.delete(`${API_URLS.COMPANIES}/${companyId}`);
            queryClient.setQueryData(queryKey, (prev) =>
                prev ? { ...prev, items: prev.items.filter((c) => c.companyId !== companyId) } : prev
            );
            toast.success(`Đã xóa công ty ${companyName} thành công!`, { id: toastId });
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Không thể xóa công ty này vì đang có dữ liệu liên quan (HR, Job).';
            toast.error(`Lỗi: ${errorMsg}`, { id: toastId });
        }
    };

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            <div className="mb-8 border-b-2 border-olive pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-textmain mb-2">🏢 Quản lý Công ty</h2>
                    <p className="text-gray-500">Tra cứu, kiểm duyệt và quản lý các đối tác doanh nghiệp.</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex gap-2">
                <input
                    type="text"
                    placeholder="Nhập tên công ty cần tìm..."
                    value={keyword}
                    onChange={(e) => {
                        setKeyword(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all"
                />
            </div>

            <CompanyTable
                companies={companies}
                isLoading={isLoading}
                onViewDetail={(companyId) => navigate(`/detail-company/${companyId}`)}
                onToggleVerify={handleToggleVerify}
                onDelete={handleDelete}
            />

            {!isLoading && totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 gap-4">
                    <button
                        type="button"
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        disabled={currentPage === 1}
                        className={`px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-olive border border-olive hover:bg-olive hover:text-white'}`}
                    >
                        ⬅ Trang trước
                    </button>

                    <span className="font-bold text-textmain bg-white px-5 py-2.5 rounded-xl shadow-sm border border-gray-100">
                        Trang {currentPage} / {totalPages}
                    </span>

                    <button
                        type="button"
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-olive border border-olive hover:bg-olive hover:text-white'}`}
                    >
                        Trang sau ➡
                    </button>
                </div>
            )}
        </div>
    );
}

export default ManageCompaniesPage;
