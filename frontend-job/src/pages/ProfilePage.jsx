import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import '../css/ProfilePage.css';
import '../App.css';

function ProfilePage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) { navigate('/login'); return; }
        const parsedUser = JSON.parse(savedUser);

        fetch(`${API_URLS.USERS}/${parsedUser.id}`)
            .then(res => {
                if (!res.ok) {
                    return res.text().then(text => { throw new Error(text) });
                }
                return res.json();
            })
            .then(data => setProfile(data))
            .catch(err => {
                console.error("Lỗi lấy hồ sơ:", err);
                alert("Hệ thống đang bảo trì hoặc không tìm thấy User này. Vui lòng thử lại sau! 🌿");
            });
    }, [navigate]);

    if (!profile) {
        return (
            <div className="app-wrapper">
                <div style={{ textAlign: 'center', marginTop: '50px', color: '#8E9775' }}>Đang tải hồ sơ của bạn... 🌿</div>
            </div>
        );
    }

    return (
        <div className="app-wrapper">
            <div className="profile-header">
                <div className="profile-header-left">
                    <div className="profile-avatar">
                        {profile.avatar ? <img src={profile.avatar} alt="Avatar" /> : <span>👩‍💻</span>}
                    </div>
                    <div className="profile-title">
                        <h2>{profile.fullName || "Người dùng ẩn danh"}</h2>
                        <span className="role-badge">{profile.role === 'Candidate' ? 'Ứng Viên' : 'Nhà Tuyển Dụng'}</span>
                    </div>
                </div>
                <button className='update-profile'> Sửa thông tin </button>
            </div>
            <div className="profile-container">
                <div className="profile-content">
                    <div className="profile-section">
                        <h3>Thông tin cá nhân</h3>
                        <p><strong>📞 Điện thoại:</strong> {profile.phone || 'Chưa cập nhật'}</p>
                        <p><strong>🏠 Địa chỉ:</strong> {profile.address || 'Chưa cập nhật'}</p>
                    </div>

                    {profile.candidate && (
                        <div className="profile-section">
                            <h3>Kỹ năng chuyên môn</h3>
                            <div className="skill-tags">
                                {profile.candidate.skills?.length > 0 ? (
                                    profile.candidate.skills.map((skill, index) => (
                                        <span key={index} className="tag">{skill}</span>
                                    ))
                                ) : (
                                    <p className="empty-text">Chưa cập nhật kỹ năng 🌿</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;