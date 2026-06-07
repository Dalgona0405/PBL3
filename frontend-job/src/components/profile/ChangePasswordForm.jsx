import React, { useState } from 'react';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import InputField from '../ui/InputField';
import Button from '../ui/Button';

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
            toast.error("⚠️ Mật khẩu mới và xác nhận không khớp nhau nha!");
            return;
        }
        if (formData.newPassword.length < 6) {
            toast.error("⚠️ Mật khẩu mới phải có ít nhất 6 ký tự cho an toàn nhé!");
            return;
        }

        setIsLoading(true);
        try {
            await axiosClient.patch(`${API_URLS.USERS}/${userId}/change-password`, {
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
        <div className="bg-white rounded-3xl shadow-sm p-8 mt-8 border-t-8 border-olive">
            <h3 className="text-xl font-bold text-gray-700 mb-6 pb-3 border-b border-gray-100 flex items-center gap-2">
                🔒 Đổi mật khẩu
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <InputField 
                    label="Mật khẩu hiện tại"
                    name="currentPassword"
                    type="password"
                    placeholder="Nhập mật khẩu đang dùng..."
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required={true}
                    disabled={isLoading}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                        label="Mật khẩu mới"
                        name="newPassword"
                        type="password"
                        placeholder="Ít nhất 6 ký tự..."
                        value={formData.newPassword}
                        onChange={handleChange}
                        required={true}
                        disabled={isLoading}
                    />

                    <InputField 
                        label="Xác nhận mật khẩu mới"
                        name="confirmPassword"
                        type="password"
                        placeholder="Nhập lại mật khẩu mới..."
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required={true}
                        disabled={isLoading}
                    />
                </div>
                
                {/* Dòng 3: Nút bấm (Đẩy sang phải cho cân đối) */}
                <div className="pt-4 flex justify-end">
                    {/* Bọc trong div w-auto để nút không bị kéo dài ra hết màn hình */}
                    <div className="w-full md:w-auto">
                        <Button type="submit" isLoading={isLoading}>
                            Cập nhật mật khẩu
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default ChangePasswordForm;