import React, { useState, useEffect } from 'react';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

function ManageStaffSection({ companyId }) {
    const [staffList, setStaffList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;

        const fetchStaff = async () => {
            try {
                setIsLoading(true);
                const data = await axiosClient.get(`${API_URLS.RECRUITERS}/company/${companyId}`);
                setStaffList(Array.isArray(data) ? data : (data.items || []));
            } catch (error) {
                console.error("Lỗi lấy danh sách nhân sự:", error);
                toast.error("Không thể tải danh sách nhân viên lúc này. 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchStaff();
    }, [companyId]);

    // Hàm xử lý khi bấm nút Đuổi việc
    const handleFireStaff = async (recruiterId, staffName) => {
        if (!window.confirm(`⚠️ Bạn có chắc chắn muốn xóa quyền của nhân viên "${staffName}" khỏi công ty không?`)) {
            return;
        }

        const toastId = toast.loading("Đang xử lý... 🌿");
        try {
            await axiosClient.put(`${API_URLS.RECRUITERS}/${recruiterId}`, {
                companyId: null 
            });

            setStaffList(prev => prev.filter(staff => staff.recruiterId !== recruiterId && staff.id !== recruiterId));
            toast.success(`Đã xóa quyền của ${staffName} thành công!`, { id: toastId });
        } catch (error) {
            toast.error("Có lỗi xảy ra. Vui lòng thử lại sau!", { id: toastId });
        }
    };

    if (isLoading) return <div className="text-center text-olive animate-pulse py-10 font-medium">Đang tải danh sách nhân sự... 🌿</div>;

    return (
        <div className="bg-white rounded-3xl shadow-sm p-8 mt-8 border-t-8 border-earth animate-fade-in-up">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
                <h3 className="text-xl font-bold text-olive flex items-center gap-2">
                    👥 Danh sách Nhân sự
                </h3>
                <span className="bg-gray-50 px-4 py-1.5 rounded-full text-sm font-bold text-gray-600 border border-gray-200">
                    Tổng cộng: {staffList.length} người
                </span>
            </div>

            {staffList.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500 italic">Công ty bạn hiện chưa có nhân viên tuyển dụng nào.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {staffList.map((staff, index) => {
                        const currentId = staff.recruiterId || staff.id;
                        const fullName = staff.user?.fullName || staff.fullName || "Nhân viên ẩn danh";
                        const email = staff.user?.email || staff.email || "Chưa có email";
                        const avatar = staff.user?.avatar || staff.avatar;
                        const position = staff.position || "Nhân viên HR";

                        return (
                            <div key={currentId || index} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow group">
                                {/* Avatar */}
                                <div className="w-14 h-14 rounded-full bg-cream border-2 border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                    {avatar ? (
                                        <img src={avatar} alt="avt" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl">👤</span>
                                    )}
                                </div>

                                {/* Thông tin */}
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="font-bold text-textmain truncate">{fullName}</h4>
                                    <p className="text-xs text-olive font-medium mb-1">{position}</p>
                                    <p className="text-xs text-gray-500 truncate">{email}</p>
                                </div>

                                {/* Nút Đuổi việc (Chỉ hiện khi hover chuột vào) */}
                                <button 
                                    onClick={() => handleFireStaff(currentId, fullName)}
                                    className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                    title="Xóa khỏi công ty"
                                >
                                    🗑️
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ManageStaffSection;