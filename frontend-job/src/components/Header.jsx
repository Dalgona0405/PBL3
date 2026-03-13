import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Header({ user, setUser }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

return (
        <div className="header-container">
            <h1 className="header-title" onClick={() => navigate('/')} style={{ cursor: 'pointer', margin: 0, color: '#8E9775' }}>
                🌿 IT Job Hunter
            </h1>

            <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
                {user ? (
                    // --- KHU VỰC CÓ DROPDOWN KHI ĐÃ ĐĂNG NHẬP ---
                    <div className="user-menu-container">

                        <div className="welcome-message" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="header-avatar">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="Avatar" />
                                ) : (
                                    /* Nếu không có ảnh thì lấy chữ cái đầu tiên của tên */
                                    <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                                )}
                            </div>
                            <span className="greeting-text">
                                Chào {user.name}! ({user.role === 'Recruiter' ? 'Nhà Tuyển Dụng' : 'Ứng Viên'}) ✨
                            </span>
                        </div>

                        <div className="dropdown-menu">
                            <div className="dropdown-item" onClick={() => navigate('/profile')}>
                                👤 Hồ sơ cá nhân
                            </div>
                            
                            {user.role === 'Candidate' && (
                                <div className="dropdown-item" onClick={() => navigate('/profile')}>
                                    📝 Việc làm đã ứng tuyển
                                </div>
                            )}
                            {user.role === 'Candidate' && (
                                <div className="dropdown-item" onClick={() => navigate('/')}>
                                    📝 Việc làm đã lưu
                                </div>
                            )}
                            {user.role === 'Candidate' && (
                                <div className="dropdown-item" onClick={() => navigate('/')}>
                                    📝 Việc làm phù hợp
                                </div>
                            )}

                            {user.role === 'Recruiter' && (
                                <div className="dropdown-item" onClick={() => navigate('/recruiter-dashboard')}>
                                    🏢 Quản lý tuyển dụng
                                </div>
                            )}

                            <div className="dropdown-divider"></div>
                            
                            <div className="dropdown-item logout-item" onClick={handleLogout}>
                                🚪 Đăng xuất
                            </div>
                        </div>
                    </div>
                ) : (
                    // --- KHU VỰC NÚT BẤM KHI CHƯA ĐĂNG NHẬP ---
                    <div className="button-group">
                        <button className="btn-login" onClick={() => navigate('/login')}>
                            Đăng nhập
                        </button>
                        <button className="btn-register" onClick={() => navigate('/register')}>
                            Đăng ký
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Header;