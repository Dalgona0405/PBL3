import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import InputField from '../components/ui/InputField';
import Button from '../components/ui/Button';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation(); // Dùng để biết đang ở trang nào
  const { login } = useAuth();

  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading("Đang đăng nhập... 🌿");

    try {
      const data = await axiosClient.post(API_URLS.LOGIN, credentials); // Sử dụng axiosClient để gửi yêu cầu
      login(data.user, data.token); // Cập nhật context với token và thông tin user

      toast.success("Đăng nhập thành công! Đang chuyển hướng... 🌿", { id: toastId });

      setTimeout(() => {
        // 1. Kiểm tra xem khách có gửi kèm cái "địa chỉ bàn cũ" (from) không?
        const from = location.state?.from;

        if (from) {
          // Nếu có, dẫn khách về đúng cái bàn đó
          navigate(from);
        } else {
          // Nếu không có (khách mới vào thẳng trang login), thì phân loại theo Role như cũ
          if (data.user.role === 'Recruiter') {
            navigate('/recruiter-dashboard');
          } else if (data.user.role === 'Admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/');
          }
        }
      }, 1000);
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    const errorMsg = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
    toast.error(errorMsg, { id: toastId });
  } finally {
    setIsLoading(false);
  }
};

return (
  <div className="min-h-screen flex flex-col bg-cream font-sans">

    {/* HEADER GIỐNG MAIN LAYOUT */}
    <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 shrink-0">
      {/* Logo bên trái */}
      <h1
        className="text-2xl font-bold text-olive cursor-pointer flex items-center gap-2"
        onClick={() => navigate('/')}
      >
        🌿 IT Job Hunter
      </h1>

      {/* 2 Nút bên phải */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/login')}
          className={`px-5 py-2 font-medium rounded-full transition-all ${location.pathname === '/login' ? 'bg-olive text-white shadow-md' : 'bg-earth text-white shadow-md hover:bg-olive hover:-translate-y-1'}`}
        >
          Đăng nhập
        </button>
        <button
          onClick={() => navigate('/register', { state: { from: location.state?.from } })} // Giữ nguyên "địa chỉ bàn cũ" khi chuyển sang trang đăng ký
          className={`px-5 py-2 font-medium rounded-full transition-all ${location.pathname === '/register' ? 'bg-olive text-white shadow-md' : 'bg-earth text-white shadow-md hover:bg-olive hover:-translate-y-1'}`}
        >
          Đăng ký
        </button>
      </div>
    </header>

    {/* KHU VỰC FORM (Nằm giữa phần không gian còn lại) */}
    <div className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border-t-8 border-olive">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-textmain mb-2">Chào mừng! ✨</h2>
          <p className="text-gray-500">Đăng nhập để tìm kiếm cơ hội IT của bạn</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <InputField
              label="Email của bạn"
              type="email"
              name="email"
              placeholder="ví dụ: truc@gmail.com"
              value={credentials.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <InputField
              label="Mật khẩu"
              type="password"
              name="password"
              placeholder="Nhập mật khẩu của bạn"
              value={credentials.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <Button 
            type="submit" 
            isLoading={isLoading} 
          >
            Đăng nhập ngay
          </Button>
        </form>

        <p className="text-center mt-8 text-gray-500">
          Chưa có tài khoản?{' '}
          <span 
          className="text-earth font-bold cursor-pointer hover:text-olive hover:underline transition-colors" 
          onClick={() => navigate('/register', { state: { from: location.state?.from } })}>
            Đăng ký tại đây
          </span>
        </p>
      </div>
    </div>

  </div>
);
}

export default LoginPage;