import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import '../App.css';

function LoginPage({ setUser }) { 
  const navigate = useNavigate();
  
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Thêm state loading cho mượt

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(''); // Xóa thông báo cũ
    
    try {
      // 1. Gửi Email/Password lên Backend
      const response = await fetch(API_URLS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      // 2. Nếu Backend trả về OK (Status 200)
      if (response.ok) {
        // Cất Token (Thẻ VIP) vào ví (localStorage)
        localStorage.setItem('token', data.token); 
        
        // Cất thông tin User vào localStorage và State của React
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        
        setMessage("Đăng nhập thành công! Đang chuyển hướng... 🌿");
        
        // Chuyển hướng dựa theo Role
        setTimeout(() => {
            if (data.user.role === 'Recruiter') {
                navigate('/recruiter-dashboard');
            } else {
                navigate('/');
            }
        }, 1000);

      } else {
        // 3. Nếu sai pass hoặc email không tồn tại (Status 401)
        setMessage(data.message || "Sai email hoặc mật khẩu rùi nha!");
      }
    } catch (error) {
      // 4. Bắt lỗi khi rớt mạng hoặc Backend chưa chạy
      console.error("Lỗi đăng nhập:", error);
      setMessage("Lỗi kết nối máy chủ. Bạn kiểm tra lại mạng hoặc Backend nhé! 🔌");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      <div className="login-container">
        <div className="login-box">
          <h2>Chào mừng trở lại! ✨</h2>
          <p className="login-subtitle">Đăng nhập để tìm kiếm cơ hội IT của bạn</p>
          
          {/* Hiển thị thông báo lỗi hoặc thành công */}
          {message && (
            <p style={{ 
                color: message.includes('thành công') ? '#8E9775' : '#e74c3c', 
                fontWeight: 'bold',
                backgroundColor: message.includes('thành công') ? '#f0f4eb' : '#fdf5f5',
                padding: '10px',
                borderRadius: '8px',
                textAlign: 'center'
            }}>
                {message}
            </p>
          )}

          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email của bạn</label>
              <input 
                type="email" 
                name="email"
                placeholder="ví dụ: truc@gmail.com" 
                value={credentials.email}
                onChange={handleChange}
                required
                disabled={isLoading} // Khóa ô nhập khi đang loading
              />
            </div>
            
            <div className="input-group">
              <label>Mật khẩu</label>
              <input 
                type="password" 
                name="password"
                placeholder="Nhập mật khẩu" 
                value={credentials.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            
            <button type="submit" className="btn-submit" disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập ngay'}
            </button>
          </form>
          
          <p className="login-footer">
            Chưa có tài khoản? <span className="link-register" onClick={() => navigate('/register')}>Đăng ký tại đây</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;