import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Header({ user, setUser }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return (
        <div className="header-container">
            <h1 className="header-title" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
               🌿 IT Job Hunter
            </h1>
            <div 
                className="welcome-message" 
                onClick={() => user && navigate('/profile')}
                style={{ 
                    fontWeight: '500', 
                    color: '#D4A373', 
                    cursor: user ? 'pointer' : 'default',
                    textDecoration: user ? 'underline' : 'none'
                }}
            >
                {user 
                    ? `Chào ${user.name}! (${user.role === 'Recruiter' ? 'Nhà Tuyển Dụng' : 'Ứng Viên'}) ✨` 
                    : 'Chào mừng bạn đến với IT Job Hunter! 🌟'
                }
            </div>

            <div className="button-group">
                {user ? (
                    <>
                        {/* {user.role === 'Recruiter' && (
                            <button 
                                className="btn-register" 
                                onClick={() => navigate('/recruiter-dashboard')}
                                style={{ marginRight: '10px' }}
                            >
                                Quản lý Tuyển dụng
                            </button>
                        )} */}
                        <button className="btn-login" onClick={handleLogout}>
                            Đăng xuất
                        </button>
                    </>
                ) : (
                    <>
                        <button className="btn-login" onClick={() => navigate('/login')}>
                            Đăng nhập
                        </button>
                        <button className="btn-register" onClick={() => navigate('/register')}>
                            Đăng ký
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default Header;