import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import LoginForm from './components/LoginForm';
import { loginSchema } from '../../utils/formValidators';

function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' }
    });

    const getRedirectPathByRole = (role) => {
        if (role === 'Recruiter') return '/recruiter-dashboard';
        if (role === 'Company') return '/company/profile';
        if (role === 'Admin') return '/admin/dashboard';
        return '/';
    };

    const handleLoginSuccess = (data, toastId) => {
        login(data.user, data.token);
        toast.success("Đăng nhập thành công! Đang chuyển hướng... 🌿", { id: toastId });
        setTimeout(() => {
            const from = location.state?.from;
            navigate(from || getRedirectPathByRole(data.user?.role));
        }, 800);
    };

    const handleLogin = async (credentials) => {
        setIsLoading(true);
        const toastId = toast.loading("Đang đăng nhập... 🌿");

        try {
            const data = await axiosClient.post(API_URLS.LOGIN, credentials);
            handleLoginSuccess(data, toastId);
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            const errorMsg = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
            toast.error(errorMsg, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvalid = () => {
        toast.error("Vui lòng kiểm tra thông tin đăng nhập.");
    };

    const handleGoogleLogin = async (idToken) => {
        setIsLoading(true);
        const toastId = toast.loading("Đang xác thực tài khoản Google... 🌿");

        try {
            const data = await axiosClient.post(API_URLS.GOOGLE_LOGIN, {
                idToken,
                role: 'Candidate'
            });
            handleLoginSuccess(data, toastId);
        } catch (error) {
            console.error("Lỗi Google Login:", error);
            const errorMsg = error.response?.data?.message || "Đăng nhập Google thất bại. Vui lòng thử lại.";
            toast.error(errorMsg, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-cream font-sans">
            <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 shrink-0">
                <h1
                    className="text-2xl font-bold text-olive cursor-pointer flex items-center gap-2"
                    onClick={() => navigate('/')}
                >
                    🌿 IT Job Hunter
                </h1>

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/login')}
                        className={`px-5 py-2 font-medium rounded-full transition-all ${location.pathname === '/login' ? 'bg-olive text-white shadow-md' : 'bg-earth text-white shadow-md hover:bg-olive hover:-translate-y-1'}`}
                    >
                        Đăng nhập
                    </button>
                    <button
                        onClick={() => navigate('/register', { state: { from: location.state?.from } })}
                        className={`px-5 py-2 font-medium rounded-full transition-all ${location.pathname === '/register' ? 'bg-olive text-white shadow-md' : 'bg-earth text-white shadow-md hover:bg-olive hover:-translate-y-1'}`}
                    >
                        Đăng ký
                    </button>
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <LoginForm
                    register={register}
                    errors={errors}
                    isLoading={isLoading}
                    onSubmit={handleSubmit(handleLogin, handleInvalid)}
                    onGoogleLogin={handleGoogleLogin}
                    onNavigateRegister={() => navigate('/register', { state: { from: location.state?.from } })}
                />
            </div>
        </div>
    );
}

export default LoginPage;
