import React from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function RegisterPage() {
    const navigate = useNavigate();
    return (
        <div className="app-wrapper">
        <Header />
        <div className="register-container">
            <div className="register-box">
            <h2>Chào mừng đến với IT Job Hunter!</h2>
            <p className="register-subtitle">Đăng ký để tìm kiếm cơ hội IT của bạn</p>
            <form className="register-form">
                <div className="input-group">
                <label>Email của bạn</label>
                <input type="email" placeholder="ví dụ: abc@gmail.com" />
                </div>
                <div className="input-group">
                <label>Mật khẩu</label>
                <input type="password" placeholder="Nhập mật khẩu" />
                </div>
                <div className="input-group">
                <label>Xác nhận mật khẩu</label>
                <input type="password" placeholder="Xác nhận mật khẩu" />
                </div>
                <div className="input-group">
                <label>Vai trò</label>
                <select name="role">
                    <option value="candidate">Người tìm việc</option>
                    <option value="recruiter">Nhà tuyển dụng</option>
                </select>
                </div>
                <button type="submit" className="btn-submit">Đăng ký ngay</button>
            </form>
            
            <p className="register-footer">
                Đã có tài khoản? <span className="link-register" onClick={() => navigate('/login')}>Đăng nhập tại đây</span>
            </p>
            </div>
        </div>
        </div>
  );
}

export default RegisterPage;