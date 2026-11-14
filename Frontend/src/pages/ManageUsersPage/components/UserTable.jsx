import React from 'react';

const getRoleBadge = (role) => {
    switch (role) {
        case 'Admin':
            return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">Admin 🛡️</span>;
        case 'Company':
            return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">Công ty 🏛️</span>;
        case 'Recruiter':
            return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">HR 🏢</span>;
        case 'Candidate':
            return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Ứng viên 👨‍💻</span>;
        default:
            return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{role}</span>;
    }
};

function UserTable({ users, isLoading, onDeleteUser }) {
    return (
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
                                                <strong className="text-textmain">{u.fullName || 'Chưa cập nhật'}</strong>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600">{u.email}</td>
                                        <td className="py-4 px-6">{getRoleBadge(u.role)}</td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                type="button"
                                                onClick={() => onDeleteUser(currentId, u.fullName || u.email)}
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
    );
}

export default UserTable;
