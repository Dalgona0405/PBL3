import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { API_URLS } from '../api/api'; // Tạm thời comment lại chờ Backend có API Login
import '../App.css';

// Nhận cái phễu setUser từ App.jsx truyền xuống
function LoginPage({ setUser }) { 
  const navigate = useNavigate();
  
  // 1. Hộp chứa email và password
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');

  // 2. Hàm hứng chữ khi gõ phím
  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  // 3. Hàm xử lý khi bấm Đăng nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // ==========================================
    // LOGIC GỌI API
    /*
    try {
      const response = await fetch(`${API_URLS.USERS}/login`, { // Đổi link này theo Backend
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const data = await response.json(); // Data thường chứa token và thông tin user
        // Xử lý thành công...
      }
    } catch (error) { ... }
    */
    // ==========================================

    // MÔ PHỎNG (MOCK) ĐỂ TEST PHÂN QUYỀN:
    if (credentials.email === "recruiter@gmail.com" && credentials.password === "123") {
      // Giả sử Backend trả về data như sau
      const fakeRecruiter = { id: 1, email: "recruiter@gmail.com", role: "Recruiter", name: "Chị HR xinh đẹp" };
      
      setUser(fakeRecruiter);
      localStorage.setItem('user', JSON.stringify(fakeRecruiter));
      
      setMessage("Đăng nhập thành công! Đang vào cổng Nhà Tuyển Dụng...");
      setTimeout(() => navigate('/recruiter-dashboard'), 1500);

    } else if (credentials.email === "abc@gmail.com" && credentials.password === "123") {
      
      const fakeCandidate = { id: 6, email: "abc@gmail.com", role: "Candidate", name: "ABC Dev" };
      setUser(fakeCandidate);
      localStorage.setItem('user', JSON.stringify(fakeCandidate));
      
      setMessage("Chào bạn! Đang đưa bạn về trang chủ...");
      setTimeout(() => navigate('/'), 1500);

    } else {
      setMessage("Sai email hoặc mật khẩu rùi nha!");
    }
  };

  return (
    <div className="app-wrapper">
      <div className="login-container">
        <div className="login-box">
          <h2>Chào mừng trở lại! ✨</h2>
          <p className="login-subtitle">Đăng nhập để tìm kiếm cơ hội IT của bạn</p>
          
          {message && <p style={{ color: '#D4A373', fontWeight: 'bold' }}>{message}</p>}

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
              />
            </div>
            
            <button type="submit" className="btn-submit">Đăng nhập ngay</button>
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