import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import '../css/ProfilePage.css';

function EditProfileForm({ formData, setFormData }) {
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData({
            ...formData, 
            [id]: value  
        });
    };

    return (
        <div className="profile-section">
            <h3>Thông tin cá nhân</h3>
            <div className="info-group">
                <p>⚧️ Giới tính:</p>
                <input type="text" id="gender" className="edit-input" value={formData.gender || ''} onChange={handleInputChange} />
            </div>
            <div className="info-group">
                <p>📞 Điện thoại:</p> 
                <input type="text" id="phone" className="edit-input" value={formData.phone || ''} onChange={handleInputChange} />
            </div>
            <div className="info-group">
                <p>🏠 Địa chỉ:</p> 
                <input type="text" id="address" className="edit-input" value={formData.address || ''} onChange={handleInputChange} />
            </div>
            <div className="info-group">
                <p>🎂 Sinh nhật:</p>
                <input type="text" id="birthday" className="edit-input" value={formData.birthday || ''} onChange={handleInputChange} />
            </div>
        </div>
    );
}

function ProfilePage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) { navigate('/login'); return; }
        const parsedUser = JSON.parse(savedUser);

        fetch(`${API_URLS.USERS}/${parsedUser.id}`)
            .then(res => {
                if (!res.ok) throw new Error("Lỗi fetch");
                return res.json();
            })
            .then(data => {
                setFormData(data); 
            })
            .catch(err => {
                console.error("Lỗi lấy hồ sơ:", err);
                alert("Hệ thống đang bảo trì hoặc không tìm thấy User này. Vui lòng thử lại sau! 🌿");
            });
    }, [navigate]);

    // HÀM XỬ LÝ KHI BẤM NÚT LƯU
    const handleSave = () => {
        console.log("Dữ liệu chuẩn bị gửi xuống Backend:", formData);
        alert("Đã lưu thông tin thành công! 🌿"); 
    };

    if (!formData) {
        return (
            <div className="app-wrapper">
                <div style={{ textAlign: 'center', marginTop: '5rem', color: '#8E9775', fontSize: '1.6rem' }}>Đang tải hồ sơ của bạn... 🌿</div>
            </div>
        );
    }

    return (
        <div className="app-wrapper">
            <div className="profile-layout-grid">
                <div className="profile-left-column">
                    <div className="profile-avatar">
                        {formData.avatar ? <img src={formData.avatar} alt="Avatar" /> : <span style={{fontSize: '5rem'}}>👩‍💻</span>}
                    </div>
                    <div className="profile-title">
                        <h2>{formData.fullName || "Người dùng ẩn danh"}</h2>
                        <span className="role-badge">
                            {formData.role === 'Candidate' ? 'Ứng Viên' : 'Nhà Tuyển Dụng'}
                        </span>
                    </div>
                </div>
                <div className="profile-right-column">
                    <div className="action-bar">
                        <button className="update-profile" onClick={handleSave}>
                            💾 Cập nhật thông tin
                        </button>
                    </div>

                    <EditProfileForm formData={formData} setFormData={setFormData} />
                    {formData.candidate && (
                        <div className="profile-section">
                            <h3>Kỹ năng chuyên môn</h3>
                            <div className="skill-tags">
                                {formData.candidate.skills?.length > 0 ? (
                                    formData.candidate.skills.map((skill, index) => (
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