import React from 'react';
import InputField from '../../../components/ui/InputField';
import Button from '../../../components/ui/Button';
import GoogleLoginButton from '../../../components/common/GoogleLoginButton';

function LoginForm({ register, errors = {}, isLoading, onSubmit, onGoogleLogin, onNavigateRegister }) {
    return (
        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border-t-8 border-olive">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-textmain mb-2">Chào mừng! ✨</h2>
                <p className="text-gray-500">Đăng nhập để tìm kiếm cơ hội IT của bạn</p>
            </div>

            <form onSubmit={onSubmit} noValidate className="space-y-6">
                <InputField
                    label="Email của bạn"
                    type="email"
                    placeholder="ví dụ: ungvien@gmail.com"
                    error={errors.email?.message}
                    required
                    disabled={isLoading}
                    {...register('email')}
                />

                <InputField
                    label="Mật khẩu"
                    type="password"
                    placeholder="Nhập mật khẩu của bạn"
                    error={errors.password?.message}
                    required
                    disabled={isLoading}
                    {...register('password')}
                />

                <Button type="submit" isLoading={isLoading}>
                    Đăng nhập ngay
                </Button>
            </form>

            <GoogleLoginButton
                onSuccess={onGoogleLogin}
                isLoading={isLoading}
                text="Đăng nhập với Google"
            />

            <p className="text-center mt-8 text-gray-500">
                Chưa có tài khoản?{' '}
                <span
                    className="text-earth font-bold cursor-pointer hover:text-olive hover:underline transition-colors"
                    onClick={onNavigateRegister}
                >
                    Đăng ký tại đây
                </span>
            </p>
        </div>
    );
}

export default LoginForm;
