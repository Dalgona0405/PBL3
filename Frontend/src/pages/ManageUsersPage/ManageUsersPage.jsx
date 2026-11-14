import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import useDebounce from '../../hooks/useDebounce';
import UserTable from './components/UserTable';

function ManageUsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [keyword, setKeyword] = useState('');
    const debouncedKeyword = useDebounce(keyword, 300);
    const [roleFilter, setRoleFilter] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedKeyword, roleFilter]);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                let url = `${API_URLS.USERS}/search?page=${currentPage}&pageSize=10`;
                if (debouncedKeyword) url += `&keyword=${encodeURIComponent(debouncedKeyword)}`;
                if (roleFilter) url += `&role=${roleFilter}`;

                const data = await axiosClient.get(url);
                setUsers(data.items || []);
                setTotalPages(data.totalPages || 1);
            } catch (error) {
                console.error('Lỗi lấy danh sách user:', error);
                toast.error('Không thể tải danh sách người dùng.');
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [currentPage, debouncedKeyword, roleFilter]);

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${userName}" không? (Hành động này là xóa mềm)`)) {
            return;
        }

        const toastId = toast.loading('Đang xóa tài khoản...');
        try {
            await axiosClient.delete(`${API_URLS.USERS}/${userId}`);
            setUsers(prevUsers => prevUsers.filter(u => (u.id || u.userId) !== userId));
            toast.success(`Đã xóa tài khoản ${userName} thành công!`, { id: toastId });
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Không thể xóa người dùng này. Vui lòng thử lại!';
            toast.error(`Lỗi: ${errorMsg}`, { id: toastId });
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
                    <option value="Company">Chỉ Tài khoản Công ty</option>
                    <option value="Admin">Chỉ Admin</option>
                </select>
            </div>

            <UserTable
                users={users}
                isLoading={isLoading}
                onDeleteUser={handleDeleteUser}
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

export default ManageUsersPage;
