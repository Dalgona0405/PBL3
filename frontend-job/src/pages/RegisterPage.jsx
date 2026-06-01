import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import InputField from '../components/ui/InputField';
import Button from '../components/ui/Button';
import SelectField from '../components/ui/SelectField';

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
                        <InputField 
                            label="Họ và tên"
                            name="fullName"
                            placeholder="ví dụ: Nguyễn Văn A"
                            value={formData.fullName}
                            onChange={handleChange}
                            required={true}
                            disabled={isLoading}
                        />

                        <InputField 
                            label="Email của bạn"
                            name="email"
                            type="email"
                            placeholder="ví dụ: abc@gmail.com"
                            value={formData.email}
                            onChange={handleChange}
                            required={true}
                            disabled={isLoading}
                        />

                        <InputField 
                            label="Mật khẩu"
                            name="password"
                            type="password"
                            placeholder="Nhập mật khẩu"
                            value={formData.password}
                            onChange={handleChange}
                            required={true}
                            disabled={isLoading}
                        />

                        <InputField 
                            label="Xác nhận mật khẩu"
                            name="confirmPassword"
                            type="password"
                            placeholder="Nhập lại mật khẩu"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required={true}
                            disabled={isLoading}
                        />

                        <SelectField 
                            label="Bạn là ai?"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            disabled={isLoading}
                            options={[
                                { label: '👨‍💻 Người tìm việc (Ứng viên)', value: 'Candidate' },
                                { label: '🏢 Nhà tuyển dụng (HR)', value: 'Recruiter' }
                            ]}
                        />

                        <div className="pt-2">
                            <Button type="submit" isLoading={isLoading}>
                                Đăng ký ngay
                            </Button>
                        </div>

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