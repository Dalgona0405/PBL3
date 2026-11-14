import React from 'react';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import Button from '../../../components/ui/Button';
import GoogleLoginButton from '../../../components/common/GoogleLoginButton';

function RegisterForm({ register, errors = {}, isLoading, onSubmit, onGoogleRegister, onNavigateLogin }) {
    return (
        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border-t-8 border-olive">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-textmain mb-2">Gia nhập IT Job Hunter!</h2>
                <p className="text-gray-500">Tạo tài khoản để bắt đầu hành trình</p>
            </div>

            <form onSubmit={onSubmit} noValidate className="space-y-5">
                <InputField
                    label="Họ và tên"
                    placeholder="ví dụ: Nguyễn Văn A"
                    error={errors.fullName?.message}
                    required={true}
                    disabled={isLoading}
                    {...register('fullName')}
                />

                <InputField
                    label="Email của bạn"
                    type="email"
                    placeholder="ví dụ: abc@gmail.com"
                    error={errors.email?.message}
                    required={true}
                    disabled={isLoading}
                    {...register('email')}
                />

                <InputField
                    label="Mật khẩu"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    error={errors.password?.message}
                    required={true}
                    disabled={isLoading}
                    {...register('password')}
                />

                <InputField
                    label="Xác nhận mật khẩu"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    error={errors.confirmPassword?.message}
                    required={true}
                    disabled={isLoading}
                    {...register('confirmPassword')}
                />

                <SelectField
                    label="Bạn là ai?"
                    error={errors.role?.message}
                    disabled={isLoading}
                    options={[
                        { label: '👨‍💻 Người tìm việc (Ứng viên)', value: 'Candidate' },
                        { label: '🏢 Nhà tuyển dụng (HR)', value: 'Recruiter' },
                        { label: '🏢 Công ty', value: 'Company' }
                    ]}
                    {...register('role')}
                />

                <div className="pt-2">
                    <Button type="submit" isLoading={isLoading}>
                        Đăng ký ngay
                    </Button>
                </div>
            </form>

            <GoogleLoginButton
                onSuccess={onGoogleRegister}
                isLoading={isLoading}
                text="Đăng ký nhanh với Google"
            />

            <p className="text-center mt-8 text-gray-500">
                Đã có tài khoản?{' '}
                <span
                    className="text-earth font-bold cursor-pointer hover:text-olive hover:underline transition-colors"
                    onClick={onNavigateLogin}
                >
                    Đăng nhập tại đây
                </span>
            </p>
        </div>
    );
}

export default RegisterForm;
