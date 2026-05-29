import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';

function ManageCompaniesPage() {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [keyword, setKeyword] = useState('');

    // 🌟 STATE MỚI CHO PHÂN TRANG
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 🌟 EFFECT 1: Reset về trang 1 nếu gõ tìm kiếm
    useEffect(() => {
        setCurrentPage(1);
    }, [keyword]);

    // 🌟 EFFECT 2: Gọi API
    useEffect(() => {
        const fetchCompanies = async () => {
            setIsLoading(true);
            try {
                // Luôn dùng API search để có hỗ trợ phân trang
                let url = `${API_URLS.COMPANIES}/search?page=${currentPage}&pageSize=10`;
                if (keyword) {
                    url += `&keyword=${encodeURIComponent(keyword)}`;
                }
                    
                const data = await axiosClient.get(url);
                
                const companyList = data.items;
                setCompanies(Array.isArray(companyList) ? companyList : []);
                
                // Lấy tổng số trang
                setTotalPages(data.totalPages || 1);
            } catch (error) {
                console.error("Lỗi lấy danh sách công ty:", error);
                toast.error("Không thể tải danh sách công ty. 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanies();
    }, [currentPage, keyword]);

    const handleDelete = async (companyId, companyName) => {
        if (!window.confirm(`⚠️ NGUY HIỂM: Bạn có chắc chắn muốn XÓA công ty "${companyName}" không? Toàn bộ tin tuyển dụng của công ty này có thể bị ảnh hưởng!`)) {
            return;
        }

        const toastId = toast.loading("Đang xóa công ty... 🌿");
        try {
            await axiosClient.delete(`${API_URLS.COMPANIES}/${companyId}`);
            setCompanies(prev => prev.filter(c => c.companyId !== companyId));
            toast.success(`Đã xóa công ty ${companyName} thành công!`, { id: toastId });
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Không thể xóa công ty này vì đang có dữ liệu liên quan (HR, Job).";
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
                    onChange={(e) => setKeyword(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all"
                />
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden">
                {isLoading ? (
                    <div className="text-center text-olive animate-pulse py-20 text-lg font-medium">Đang tải dữ liệu doanh nghiệp... 🌿</div>
                ) : companies.length === 0 ? (
                    <div className="text-center text-gray-500 py-20">Không tìm thấy công ty nào.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-cream text-olive border-b-2 border-gray-100">
                                    <th className="py-4 px-6 font-bold">Doanh nghiệp</th>
                                    <th className="py-4 px-6 font-bold">Website</th>
                                    <th className="py-4 px-6 font-bold text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map(company => (
                                    <tr key={company.companyId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 p-1">
                                                    {company.logoImg ? <img src={company.logoImg} alt="logo" className="w-full h-full object-contain" /> : '🏢'}
                                                </div>
                                                <strong 
                                                    className="text-textmain text-lg hover:text-olive cursor-pointer transition-colors"
                                                    onClick={() => navigate(`/detail-company/${company.companyId}`)}
                                                >
                                                    {company.companyName}
                                                </strong>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600">
                                            {company.website ? (
                                                <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Truy cập</a>
                                            ) : "Chưa có"}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button 
                                                    onClick={() => navigate(`/detail-company/${company.companyId}`)}
                                                    className="bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg font-bold text-sm transition-colors"
                                                >
                                                    👁️ Xem
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(company.companyId, company.companyName)}
                                                    className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg font-bold text-sm transition-colors"
                                                >
                                                    🗑️ Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 🌟 KHU VỰC NÚT PHÂN TRANG */}
            {!isLoading && totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 gap-4">
                    <button 
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