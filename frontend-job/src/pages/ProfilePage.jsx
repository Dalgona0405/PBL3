import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import '../css/ProfilePage.css';
// import '../App.css';

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
            <div className="profile-layout-grid">
                <div className="profile-left-column">
                    <div className="profile-avatar">
                        {profile.avatar ? <img src={profile.avatar} alt="Avatar" /> : <span style={{fontSize: '50px'}}>👩‍💻</span>}
                    </div>
                    <div className="profile-title">
                        <h2>{profile.fullName || "Người dùng ẩn danh"}</h2>
                        <span className="role-badge">
                            {profile.role === 'Candidate' ? 'Ứng Viên' : 'Nhà Tuyển Dụng'}
                        </span>
                    </div>
                </div>

                <div className="profile-right-column">
                    <div className="action-bar">
                        <button className="update-profile">✏️ Sửa thông tin</button>
                    </div>
                    <div className="profile-section">
                        <h3>Thông tin cá nhân</h3>
                        <div className="info-group">
                            <p> ⚧️ Giới tính: </p>
                            <input type="text" id="gender" className="edit-input" value={profile.gender || 'Chưa cập nhật'}></input>
                        </div>
                        <div className="info-group">
                            <p>📞 Điện thoại:</p> 
                            <input type="text" id="phone" className="edit-input" value={profile.phone || 'Chưa cập nhật'}></input>
                        </div>
                        <div className="info-group">
                            <p>🏠 Địa chỉ:</p> 
                            <input type="text" id="address" className="edit-input" value={profile.address || 'Chưa cập nhật'}></input>
                        </div>
                        <div className="info-group">
                            <p>🎂 Sinh nhật: </p>
                            <input type="text" id="birthday" className="edit-input" value={profile.birthday || 'Chưa cập nhật'}></input>
                        </div>
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