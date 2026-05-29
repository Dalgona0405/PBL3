// File: src/components/profile/ChangePasswordForm.jsx
import React, { useState } from 'react';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

function ChangePasswordForm({ userId }) {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("⚠️ Mật khẩu mới và xác nhận không khớp nhau nha Trúc ơi!");
            return;
        }
        if (formData.newPassword.length < 6) {
            toast.error("⚠️ Mật khẩu mới phải có ít nhất 6 ký tự cho an toàn nhé!");
            return;
        }

        setIsLoading(true);
        try {
            await axiosClient.put(`${API_URLS.USERS}/${userId}/change-password`, {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            });
            
            toast.success("🎉 Đổi mật khẩu thành công! Lần đăng nhập sau nhớ dùng mật khẩu mới nha.");
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            const msg = error.response?.data?.message || "Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra.";
            toast.error(`⚠️ Lỗi: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm p-8 mt-8 border-t-8 border-gray-200">
            <h3 className="text-xl font-bold text-gray-700 mb-6 pb-3 border-b border-gray-100 flex items-center gap-2">
                🔒 Đổi mật khẩu
            </h3>
            
            {/* 🌟 Đã bỏ max-w-md và tăng khoảng cách các dòng (space-y-5) */}
            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Dòng 1: Mật khẩu hiện tại (Full width) */}
                <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Mật khẩu hiện tại <span className="text-red-500">*</span></label>
                    <input 
                        type="password" name="currentPassword" required 
                        value={formData.currentPassword} onChange={handleChange} 
                        placeholder="Nhập mật khẩu đang dùng..." 
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all" 
                    />
                </div>
                
                {/* Dòng 2: Mật khẩu mới & Xác nhận (Chia 2 cột trên màn hình lớn) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">Mật khẩu mới <span className="text-red-500">*</span></label>
                        <input 
                            type="password" name="newPassword" required 
                            value={formData.newPassword} onChange={handleChange} 
                            placeholder="Ít nhất 6 ký tự..." 
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">Xác nhận mật khẩu mới <span className="text-red-500">*</span></label>
                        <input 
                            type="password" name="confirmPassword" required 
                            value={formData.confirmPassword} onChange={handleChange} 
                            placeholder="Nhập lại mật khẩu mới..." 
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all" 
                        />
                    </div>
                </div>
                
                {/* Dòng 3: Nút bấm (Đẩy sang phải cho cân đối với form trên) */}
                <div className="pt-4 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-md transition-all ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-900 hover:-translate-y-0.5'}`}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ChangePasswordForm;