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

    // 1. LẤY DANH SÁCH CÔNG TY
    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            // Gọi API lấy danh sách công ty (Nếu có keyword thì gọi API search, không thì lấy hết)
            const url = keyword 
                ? `${API_URLS.COMPANIES}/search?keyword=${encodeURIComponent(keyword)}` 
                : API_URLS.COMPANIES;
                
            const data = await axiosClient.get(url);
            
            // Lọc lấy cái hộp chứa mảng dữ liệu
            const companyList = data.items || data.Items || data.data || data;
            setCompanies(Array.isArray(companyList) ? companyList : []);
        } catch (error) {
            console.error("Lỗi lấy danh sách công ty:", error);
            toast.error("Không thể tải danh sách công ty. 🌿");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    // 2. TÌM KIẾM
    const handleSearch = (e) => {
        e.preventDefault();
        fetchCompanies();
    };

    // 3. XÓA CÔNG TY
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
            {/* HEADER */}
            <div className="mb-8 border-b-2 border-olive pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-textmain mb-2">🏢 Quản lý Công ty</h2>
                    <p className="text-gray-500">Tra cứu, kiểm duyệt và quản lý các đối tác doanh nghiệp.</p>
                </div>
                <span className="bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100 text-gray-500 font-medium">
                    Tổng số: <strong className="text-earth">{companies.length}</strong>
                </span>
            </div>

            {/* THANH TÌM KIẾM */}
            <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex gap-2">
                <input 
                    type="text" 
                    placeholder="Nhập tên công ty cần tìm..." 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all"
                />
                <button type="submit" className="bg-earth hover:bg-olive text-white px-8 py-2.5 rounded-xl font-bold transition-colors shadow-sm">
                    🔍 Tìm
                </button>
                {keyword && (
                    <button type="button" onClick={() => { setKeyword(''); fetchCompanies(); }} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-2.5 rounded-xl font-bold transition-colors">
                        Xóa lọc
                    </button>
                )}
            </form>

            {/* BẢNG DANH SÁCH */}
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
                                    <th className="py-4 px-6 font-bold">Quy mô</th>
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
                                        <td className="py-4 px-6 text-gray-600">{company.size || "Chưa cập nhật"}</td>
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
        </div>
    );
}

export default ManageCompaniesPage;