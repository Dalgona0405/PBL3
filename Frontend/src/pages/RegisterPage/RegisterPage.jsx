import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import RegisterForm from './components/RegisterForm';
import { registerSchema } from '../../utils/formValidators';

function RegisterPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', role: 'Candidate' }
    });

    const selectedRole = watch('role');

    const getRedirectPathByRole = (role) => {
        if (role === 'Recruiter') return '/recruiter-dashboard';
        if (role === 'Company') return '/company/profile';
        return '/';
    };

    const handleRegister = async (formData) => {
        setIsLoading(true);
        const toastId = toast.loading("Đang đăng ký tài khoản... 🌿");

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
                    navigate(from || getRedirectPathByRole(userInfo.role));
                }, 1000);
            } else {
                toast.success('🎉 Đăng ký thành công! Vui lòng đăng nhập.', { id: toastId });
                navigate('/login');
            }
        } catch (error) {
            console.error("Lỗi đăng ký:", error);
            const errorMsg = error.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại!';
            toast.error(errorMsg, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvalid = (validationErrors) => {
        const firstMsg = Object.values(validationErrors)[0]?.message || 'Vui lòng kiểm tra lại thông tin.';
        toast.error(firstMsg);
    };

    const handleGoogleRegister = async (idToken) => {
        setIsLoading(true);
        const toastId = toast.loading("Đang liên kết tài khoản Google... 🌿");

        try {
            const data = await axiosClient.post(API_URLS.GOOGLE_LOGIN, {
                idToken,
                role: selectedRole || 'Candidate'
            });

            login(data.user, data.token);
            toast.success('🎉 Xác thực Google thành công! Đang chuyển hướng...', { id: toastId });
            setTimeout(() => {
                const from = location.state?.from;
                navigate(from || getRedirectPathByRole(data.user?.role));
            }, 800);
        } catch (error) {
            console.error("Lỗi Google Register:", error);
            const errorMsg = error.response?.data?.message || 'Đăng ký qua Google thất bại. Vui lòng thử lại!';
            toast.error(errorMsg, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-cream font-sans">
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

            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <RegisterForm
                    register={register}
                    errors={errors}
                    isLoading={isLoading}
                    onSubmit={handleSubmit(handleRegister, handleInvalid)}
                    onGoogleRegister={handleGoogleRegister}
                    onNavigateLogin={() => navigate('/login', { state: { from: location.state?.from } })}
                />
            </div>
        </div>
    );
}

export default RegisterPage;
