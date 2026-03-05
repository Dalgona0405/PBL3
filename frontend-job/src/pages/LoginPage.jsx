import React from 'react';
import Header from '../components/Header';
import '../App.css';

function LoginPage() {
  return (
    <div className="app-wrapper">
      <Header />
      <div className="login-container">
        <div className="login-box">
          <h2>Chào mừng trở lại! ✨</h2>
          <p className="login-subtitle">Đăng nhập để tìm kiếm cơ hội IT của bạn</p>
          
          <form className="login-form">
            <div className="input-group">
              <label>Email của bạn</label>
              <input type="email" placeholder="ví dụ: abc@gmail.com" />
            </div>
            <div className="input-group">
              <label>Mật khẩu</label>
              <input type="password" placeholder="Nhập mật khẩu" />
            </div>
            
            <button type="submit" className="btn-submit">Đăng nhập ngay</button>
          </form>
          
          <p className="login-footer">
            Chưa có tài khoản? <span className="link-register">Đăng ký tại đây</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;