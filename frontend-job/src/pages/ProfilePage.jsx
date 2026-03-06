import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
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
            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {profile.avatar ? <img src={profile.avatar} alt="Avatar" /> : <span>👩‍💻</span>}
                    </div>
                    <div className="profile-title">
                        <h2>{profile.fullName || "Người dùng ẩn danh"}</h2>
                        <p>{profile.email}</p>
                        <span className="role-badge">{profile.role === 'Candidate' ? 'Ứng Viên' : 'Nhà Tuyển Dụng'}</span>
                    </div>
                </div>

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
                    
                    <div className="profile-section">
                        <h3>Lịch sử ứng tuyển</h3>
                        {profile.applications?.length > 0 ? (
                            <div className="application-list">
                                {profile.applications.map(app => (
                                    <div key={app.applicationId} className="application-item">
                                        <h4>{app.job?.title}</h4>
                                        <p>🏢 Công ty: {app.job?.companyName}</p>
                                        <p>📅 Ngày nộp: {new Date(app.appliedDate).toLocaleDateString('vi-VN')}</p>
                                        <p>
                                            <strong>Trạng thái: </strong> 
                                            <span className={`status-text status-${app.status}`}>
                                                {app.status === 1 ? 'Chờ duyệt' : app.status === 2 ? 'Đang xem xét' : 'Đã phản hồi'}
                                            </span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-text">Chưa có lịch sử ứng tuyển nào. Ra trang chủ rải CV ngay thôi! 🚀</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;