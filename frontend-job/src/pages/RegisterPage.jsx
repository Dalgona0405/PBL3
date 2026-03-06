import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import '../App.css';

function RegisterPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Candidate'
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleRegister = async (e) => {
        e.preventDefault(); // Ngăn trình duyệt tự động load lại trang khi bấm form

        if (formData.password !== formData.confirmPassword) {
            setMessage('Mật khẩu xác nhận không khớp nha!');
            return;
        }

        try {
            const payload = {
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                role: formData.role
            };

            const response = await fetch(API_URLS.USERS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setMessage('🎉 Đăng ký thành công! Đang chuyển sang đăng nhập...');
                setTimeout(() => navigate('/login'), 2000); 
            } else {
                const errorData = await response.json();
                setMessage(errorData.message || 'Có lỗi xảy ra, thử lại sau nhé.');
            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
            setMessage('Lỗi kết nối máy chủ.');
        }
    };

    return (
        <div className="app-wrapper">
            <div className="register-container">
                <div className="register-box">
                    <h2>Chào mừng đến với IT Job Hunter!</h2>
                    <p className="register-subtitle">Đăng ký để tìm kiếm cơ hội IT của bạn</p>
                    {message && <p style={{ color: '#D4A373', fontWeight: 'bold' }}>{message}</p>}

                    <form className="register-form" onSubmit={handleRegister}>
                        
                        <div className="input-group">
                            <label>Họ và tên</label>
                            <input 
                                type="text" 
                                name="fullName"
                                placeholder="ví dụ: Nguyễn Văn A" 
                                value={formData.fullName}
                                onChange={handleChange}
                                required 
                            />
                        </div>

                        <div className="input-group">
                            <label>Email của bạn</label>
                            <input 
                                type="email" 
                                name="email"
                                placeholder="ví dụ: abc@gmail.com" 
                                value={formData.email}
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
                                value={formData.password}
                                onChange={handleChange}
                                required 
                            />
                        </div>

                        <div className="input-group">
                            <label>Xác nhận mật khẩu</label>
                            <input 
                                type="password" 
                                name="confirmPassword"
                                placeholder="Xác nhận mật khẩu" 
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required 
                            />
                        </div>

                        <div className="input-group">
                            <label>Vai trò</label>
                            <select name="role" value={formData.role} onChange={handleChange}>
                                <option value="Candidate">Người tìm việc</option>
                                <option value="Recruiter">Nhà tuyển dụng</option>
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