import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function RegisterPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        fullName: '', email: '', password: '', confirmPassword: '', role: 'Candidate'
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp nha!');
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                role: formData.role
            };

            const data = await axiosClient.post(API_URLS.REGISTER, payload);

            if (data.token) {
                const userInfo = { id: data.userId, email: data.email, role: data.role, name: data.fullName };
                login(userInfo, data.token);

                toast.success('🎉 Đăng ký thành công! Đang tự động đăng nhập...', { id: toastId });

                setTimeout(() => {
                    const from = location.state?.from;
                    if (from) {
                        navigate(from);
                    } else {
                        if (userInfo.role === 'Recruiter') navigate('/recruiter-dashboard');
                        else navigate('/');
                    }
                }, 1500);

            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
            const errorMsg = error.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại!';
            toast.error(errorMsg, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-cream font-sans">

            {/* HEADER GIỐNG MAIN LAYOUT */}
            <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 shrink-0">
                <h1 className="text-2xl font-bold text-olive cursor-pointer flex items-center gap-2" onClick={() => navigate('/')}>
                    🌿 IT Job Hunter
                </h1>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/login', { state: { from: location.state?.from } })} className={`px-5 py-2 font-medium rounded-full transition-all ${location.pathname === '/login' ? 'bg-olive text-white shadow-md' : 'bg-earth text-white shadow-md hover:bg-olive hover:-translate-y-1'}`}>
                        Đăng nhập
                    </button>
                    <button onClick={() => navigate('/register')} className={`px-5 py-2 font-medium rounded-full transition-all ${location.pathname === '/register' ? 'bg-olive text-white shadow-md' : 'bg-earth text-white shadow-md hover:bg-olive hover:-translate-y-1'}`}>
                        Đăng ký
                    </button>
                </div>
            </header>

            {/* KHU VỰC FORM */}
            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border-t-8 border-olive">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-textmain mb-2">Gia nhập IT Job Hunter!</h2>
                        <p className="text-gray-500">Tạo tài khoản để bắt đầu hành trình</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Họ và tên</label>
                            <input type="text" name="fullName" placeholder="ví dụ: Nguyễn Văn A" value={formData.fullName} onChange={handleChange} required disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Email của bạn</label>
                            <input type="email" name="email" placeholder="ví dụ: abc@gmail.com" value={formData.email} onChange={handleChange} required disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Mật khẩu</label>
                            <input type="password" name="password" placeholder="Nhập mật khẩu" value={formData.password} onChange={handleChange} required disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Xác nhận mật khẩu</label>
                            <input type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Bạn là ai?</label>
                            <select name="role" value={formData.role} onChange={handleChange} disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white text-textmain cursor-pointer">
                                <option value="Candidate">👨‍💻 Người tìm việc (Ứng viên)</option>
                                <option value="Recruiter">🏢 Nhà tuyển dụng (HR)</option>
                            </select>
                        </div>

                        <button type="submit" disabled={isLoading} className={`w-full py-3.5 mt-4 rounded-xl text-white font-bold text-lg transition-all transform hover:-translate-y-1 shadow-md ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-earth hover:bg-olive hover:shadow-lg'}`}>
                            {isLoading ? 'Đang xử lý...' : 'Đăng ký ngay'}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-gray-500">
                        Đã có tài khoản?{' '}
                        <span
                            className="text-earth font-bold cursor-pointer hover:text-olive hover:underline transition-colors"
                            onClick={() => navigate('/login', { state: { from: location.state?.from } })}>
                            Đăng nhập tại đây
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;