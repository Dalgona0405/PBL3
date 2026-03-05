import React from 'react';
import { useNavigate } from 'react-router-dom';

function Header() {
    const navigate = useNavigate();
    return (
        <div className="header-container">
            <h1 className="header-title" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
               🌿 IT Job Hunter
            </h1>
            <div className="button-group">
                <button className="btn-login" onClick={() => navigate('/login')}>
                    Đăng nhập
                </button>
                <button className="btn-register" onClick={() => navigate('/register')}>
                    Đăng ký
                </button>
            </div>
        </div>
    );
}

export default Header;