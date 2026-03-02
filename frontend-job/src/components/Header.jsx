import React from 'react';

function Header() {
    return (
        <div className = "header-container">
            <h1 className = "header-title">🌿 IT Job Hunter</h1>
            <div className="button-group">
                <button className="btn-login">Đăng nhập</button>
                <button className="btn-register">Đăng ký</button>
            </div>
        </div>
    );
}

export default Header;