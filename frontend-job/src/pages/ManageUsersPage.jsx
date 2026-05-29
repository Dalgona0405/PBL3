import React, { useState, useEffect } from 'react';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';

function ManageUsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [keyword, setKeyword] = useState('');
    const [roleFilter, setRoleFilter] = useState(''); 

    // 🌟 STATE CHO PHÂN TRANG
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 🌟 EFFECT 1: Nếu Admin gõ tìm kiếm hoặc đổi Role, tự động lật về Trang 1
    useEffect(() => {
        setCurrentPage(1);
    }, [keyword, roleFilter]);

    // 🌟 EFFECT 2: Gọi API
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                let url = '';
                // Nếu có gõ từ khóa hoặc chọn Role -> Gọi API Search
                if (keyword || roleFilter) {
                    url = `${API_URLS.USERS}/search?page=${currentPage}&pageSize=10`;
                    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
                    if (roleFilter) url += `&role=${roleFilter}`;
                } 
                // Nếu để trống -> Gọi API Get All (API này Backend trả về FullName đầy đủ)
                else {
                    url = `${API_URLS.USERS}?page=${currentPage}&pageSize=10`;
                }

                const data = await axiosClient.get(url);
                
                const userList = data.data;
                if (Array.isArray(userList)) {
                    setUsers(userList);
                } else {
                    setUsers([]);
                }

                setTotalPages(data.totalPages || data.TotalPages || 1);

            } catch (error) {
                console.error("Lỗi lấy danh sách user:", error);
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [currentPage, keyword, roleFilter]);

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${userName}" không? (Hành động này là xóa mềm)`)) {
            return;
        }

        try {
            await axiosClient.delete(`${API_URLS.USERS}/${userId}`);
            setUsers(prevUsers => prevUsers.filter(u => (u.id || u.userId) !== userId));
            toast.success(`Đã xóa tài khoản ${userName} thành công! 🌿`);
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Không thể xóa người dùng này. Vui lòng thử lại!";
            toast.error(`⚠️ Lỗi: ${errorMsg}`);
        }
    };

    const getRoleBadge = (role) => {
        switch(role) {
            case 'Admin': return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">Admin 🛡️</span>;
            case 'Recruiter': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">HR 🏢</span>;
            case 'Candidate': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Ứng viên 👨‍💻</span>;
            default: return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{role}</span>;
        }
    };

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            <div className="mb-8 border-b-2 border-olive pb-4">
                <h2 className="text-3xl font-bold text-textmain mb-2">👥 Quản lý Người dùng</h2>
                <p className="text-gray-500">Tra cứu và quản lý tài khoản trong hệ thống.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên hoặc email..." 
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white"
                    />
                </div>

                <select 
                    value={roleFilter} 
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 font-medium text-gray-600 cursor-pointer"
                >
                    <option value="">Tất cả vai trò</option>
                    <option value="Candidate">Chỉ Ứng viên</option>
                    <option value="Recruiter">Chỉ Nhà tuyển dụng</option>
                    <option value="Admin">Chỉ Admin</option>
                </select>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden">
                {isLoading ? (
                    <div className="text-center text-olive animate-pulse py-20 text-lg">Đang tải dữ liệu người dùng... 🌿</div>
                ) : users.length === 0 ? (
                    <div className="text-center text-gray-500 py-20">Không tìm thấy người dùng nào phù hợp.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-cream text-olive border-b-2 border-gray-100">
                                    <th className="py-4 px-6 font-bold">Người dùng</th>
                                    <th className="py-4 px-6 font-bold">Email đăng nhập</th>
                                    <th className="py-4 px-6 font-bold">Vai trò</th>
                                    <th className="py-4 px-6 font-bold text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => {
                                    const currentId = u.id || u.userId; 
                                    return (
                                        <tr key={currentId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                                        {u.avatar ? <img src={u.avatar} alt="avt" className="w-full h-full object-cover" /> : '👤'}
                                                    </div>
                                                    <strong className="text-textmain">{u.fullName || "Chưa cập nhật"}</strong>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600">{u.email}</td>
                                            <td className="py-4 px-6">{getRoleBadge(u.role)}</td>
                                            <td className="py-4 px-6 text-center">
                                                <button 
                                                    onClick={() => handleDeleteUser(currentId, u.fullName || u.email)}
                                                    className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-1.5 rounded-lg font-bold text-sm transition-colors border border-red-100"
                                                >
                                                    🗑️ Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
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

export default ManageUsersPage;