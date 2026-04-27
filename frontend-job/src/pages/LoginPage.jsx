import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URLS } from '../api/api';

function LoginPage({ setUser }) { 
  const navigate = useNavigate();
  const location = useLocation(); // Dùng để biết đang ở trang nào
  
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const[message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(''); 
    
    try {
      const response = await fetch(API_URLS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token); 
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        
        setMessage("Đăng nhập thành công! Đang chuyển hướng... 🌿");
        
        setTimeout(() => {
            if (data.user.role === 'Recruiter') {
                navigate('/recruiter-dashboard');
            } else {
                navigate('/');
            }
        }, 1000);

      } else {
        setMessage(data.message || "Sai email hoặc mật khẩu rùi nha!");
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      setMessage("Lỗi kết nối máy chủ. Bạn kiểm tra lại mạng hoặc Backend nhé! 🔌");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Khung to nhất: Xếp theo chiều dọc (flex-col), cao full màn hình
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
            onClick={() => navigate('/register')} 
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
            <h2 className="text-3xl font-bold text-textmain mb-2">Chào mừng trở lại! ✨</h2>
            <p className="text-gray-500">Đăng nhập để tìm kiếm cơ hội IT của bạn</p>
          </div>
          
          {message && (
            <div className={`mb-6 p-4 rounded-xl text-center font-medium ${message.includes('thành công') ? 'bg-green-50 text-olive' : 'bg-red-50 text-red-500'}`}>
                {message}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Email của bạn</label>
              <input type="email" name="email" placeholder="ví dụ: truc@gmail.com" value={credentials.email} onChange={handleChange} required disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Mật khẩu</label>
              <input type="password" name="password" placeholder="Nhập mật khẩu" value={credentials.password} onChange={handleChange} required disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" />
            </div>
            
            <button type="submit" disabled={isLoading} className={`w-full py-3.5 rounded-xl text-white font-bold text-lg transition-all transform hover:-translate-y-1 shadow-md ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-earth hover:bg-olive hover:shadow-lg'}`}>
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập ngay'}
            </button>
          </form>
          
          <p className="text-center mt-8 text-gray-500">
            Chưa có tài khoản?{' '}
            <span className="text-earth font-bold cursor-pointer hover:text-olive hover:underline transition-colors" onClick={() => navigate('/register')}>
              Đăng ký tại đây
            </span>
          </p>
        </div>
      </div>

    </div>
  );
}

export default LoginPage;