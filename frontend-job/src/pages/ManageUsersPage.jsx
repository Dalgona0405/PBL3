import React, { useState, useEffect } from 'react';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';

function ManageUsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [keyword, setKeyword] = useState('');
    const [roleFilter, setRoleFilter] = useState(''); 

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            let url = `${API_URLS.USERS}/search?page=1&pageSize=50`;
            if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
            if (roleFilter) url += `&role=${roleFilter}`;

            const data = await axiosClient.get(url);
            
            // In ra console để Trúc xem Backend trả về cái thùng hình gì nha
            console.log("Dữ liệu User từ Backend:", data); 
            
            // Tìm đúng cái hộp chứa danh sách (Array). Tùy Backend C# của Trúc viết mà nó nằm ở data.items, data.data, hoặc chính là data.
            const userList = data.items || data.Items || data.data || data;
            
            // Kiểm tra chắc chắn nó là Array (danh sách) thì mới đưa vào State
            if (Array.isArray(userList)) {
                setUsers(userList);
            } else {
                console.error("Backend không trả về danh sách Array hợp lệ!");
                setUsers([]); // Trả về mảng rỗng để không bị lỗi .map
            }

        } catch (error) {
            console.error("Lỗi lấy danh sách user:", error);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers();
    };

    // 🛠️ TÍNH NĂNG MỚI: XÓA MỀM (SOFT DELETE)
    const handleDeleteUser = async (userId, userName) => {
        // Hỏi lại cho chắc chắn (Confirm dialog)
        if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${userName}" không? (Hành động này là xóa mềm)`)) {
            return;
        }

        try {
            // Gọi API Delete của Backend
            await axiosClient.delete(`${API_URLS.USERS}/${userId}`);
            
            // Xóa thành công thì lọc (filter) user đó ra khỏi danh sách hiện tại trên màn hình
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
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên hoặc email..." 
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white"
                    />
                    <button type="submit" className="bg-earth hover:bg-olive text-white px-6 py-2.5 rounded-xl font-bold transition-colors">
                        🔍 Tìm
                    </button>
                </form>

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
                                    // Đảm bảo lấy đúng ID (tùy Backend trả về id hay userId)
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
                                                {/* Nút Xóa Mềm */}
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
        </div>
    );
}

export default ManageUsersPage;