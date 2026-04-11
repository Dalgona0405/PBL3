import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import '../css/ProfilePage.css';

function EditProfileForm({ formData, setFormData }) {
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        if (id === 'fullName') {
                setFormData({ ...formData, [id]: value });
                return;
            }
        if (['gender', 'birthday', 'phone', 'address'].includes(id)) {
                setFormData({
                    ...formData,
                    candidate: { ...formData.candidate, [id]: value }
                });
                return;
            }
        if (id === 'position' || id === 'company') {
                setFormData({
                    ...formData,
                    recruiter: { ...formData.recruiter, [id]: value }
                });
                return;
            }
    };

    return (
        <div className="profile-section">
            <h3>Thông tin cá nhân</h3>
            <div className="info-group">
                <p> Họ và tên:</p> 
                <input type="text" id="fullName" className="edit-input" 
                    value={formData.fullName || ''} 
                    onChange={handleInputChange} />
            </div>
            <div className="info-group">
                <p>⚧️ Giới tính:</p>
                <select id="gender" className="edit-input" 
                    value={formData.candidate?.gender || ''} 
                    onChange={handleInputChange} >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                </select>
            </div>
            {formData.role === 'Candidate' && (
                <>
                    <div className="info-group">
                        <p>📞 Điện thoại:</p> 
                        <input type="text" id="phone" className="edit-input" 
                            value={formData.candidate?.phone || ''} 
                            onChange={handleInputChange} />
                    </div>
                    <div className="info-group">
                        <p>🏠 Địa chỉ:</p> 
                        <input type="text" id="address" className="edit-input" 
                            value={formData.candidate?.address || ''} 
                            onChange={handleInputChange} />
                    </div>
                    <div className="info-group">
                        <p>🎂 Sinh nhật:</p>
                        <input type="date" id="birthday" className="edit-input" 
                            value={formData.candidate?.birthday ? formData.candidate.birthday.split('T')[0] : ''} 
                            onChange={handleInputChange} />
                    </div>
                </>
            )}
            {formData.role === 'Recruiter' && (
                <>
                <div className="info-group">
                    <p> Chức vụ:</p>
                    <input type="text" id="position" className="edit-input" 
                        value={formData.recruiter?.position || ''} 
                        onChange={handleInputChange} />
                </div>
                <div className="info-group">
                    <p> Công ty:</p>
                    <input type="text" id="companies" className="edit-input" 
                        value={formData.recruiter?.company?.companyName || ''} 
                        onChange={handleInputChange} />
                </div>
                </>
            )}
        </div>
    );
}

function ProfilePage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);

    // State cho Skill
    const[allTags, setAllTags] = useState([]);
    const [userTags, setUserTags] = useState([]);
    const[selectedTagId, setSelectedTagId] = useState('');

    //State cho UI
    const[isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    //Get data ban đầu
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) { navigate('/login'); return;}
        const parsedUser = JSON.parse(savedUser);
        
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const [profileRes, allTagsRes] = await Promise.all([
                    fetch(`${API_URLS.USERS}/${parsedUser.id}`),
                    fetch(`${API_URLS.TAGS}`)
                ]);

                if (!profileRes.ok) {
                    throw new Error("Không thể tải hồ sơ. User có thể không tồn tại.");
                }

                const profileData = await profileRes.json();
                const allTagsData = allTagsRes.ok ? await allTagsRes.json() : [];

                setFormData(profileData);
                setAllTags(allTagsData);

                if (profileData.role === 'Candidate') {
                    const userTagsRes = await fetch(`${API_URLS.CANDIDATE_TAGS}/candidate/${parsedUser.id}`);
                    if (userTagsRes.ok) {
                        const userTagsData = await userTagsRes.json();
                        setUserTags(userTagsData);
                    } else {
                        console.warn("Không thể tải skill của user, có thể user chưa có skill nào.");
                        setUserTags([]);
                    }
                } else {
                    // Nếu là Recruiter, không cần fetch skill, set mảng rỗng
                    setUserTags([]);
                }

            } catch (err) {
                console.error("Lỗi fetchData:", err);
                setError("Hệ thống đang bảo trì. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    //HÀM THÊM KỸ NĂNG
    const handleAddSkill = async () => {
        if (!selectedTagId) return;

        if(userTags.some(t => t.tagId === parseInt(selectedTagId))){
            alert("Bạn đã nhập kỹ năng này rồi nhé!");
            return;
        }
        try{
            const payload = {
                userId: formData.userId,
                tagId: parseInt(selectedTagId),
                proficiency: "Beginner"
            };
            const res = await fetch(`${API_URLS.CANDIDATE_TAGS}`,{
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload) 
            });
            if (res.ok) {
                const newTagData = await res.json();
                //Cập nhật UI mà không reload
                setUserTags([...userTags, {tagId: newTagData.tagId, tagName: newTagData.tagName}]);
                setSelectedTagId(''); //Reset dropdown
            } else {
                alert("Lỗi khi thêm kĩ năng!");
            }
        } catch (err) {
            alert("Hệ thống lỗi hoặc rớt mạng, không thể thêm kỹ năng!");
        }
    };

    //HÀM XÓA KỸ NĂNG
    const handleRemoveSkill = async (tagId) => {
        try {
            const res = await fetch(`${API_URLS.CANDIDATE_TAGS}/${formData.userId}/${tagId}`,{
                method: 'DELETE'
            });
            if (res.ok) {
                setUserTags(userTags.filter(t => t.tagId !== tagId));
            }
        } catch (err){
            alert("Hệ thống lỗi hoặc rớt mạng, không thể xóa được!");
        }
    };

    // HÀM LƯU THÔNG TIN CÁ NHÂN
    const handleSave = async () => {
        try {
            const payloadUser = {
                fullName: formData.fullName,
                phone: formData.candidate?.phone,
                address: formData.candidate?.address
            };
            
            const payloadCandidate = {
                fullName: formData.fullName,
                gender: formData.candidate?.gender,
                birthday: formData.candidate?.birthday,
                phone: formData.candidate?.phone,
                address: formData.candidate?.address
            };

            const res = await Promise.all([
                fetch(`${API_URLS.USERS}/${formData.userId}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payloadUser)
                }),
                fetch(`${API_URLS.CANDIDATE}/${formData.userId}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payloadCandidate)
                })
            ]);
            
            if(res[0].ok && res[1].ok){
                alert("Đã lưu thông tin thành công! 🌿");
            } else {
                alert("Có lỗi xảy ra khi lưu thông tin.");
            }
        } catch (err){
            alert("Hệ thống lỗi hoặc rớt mạng, không thể lưu được!");
        }
    };

    if(isLoading){
        return (
            <div className="app-wrapper">
                <div className="loading-spinner">Đang tải hồ sơ của bạn... 🌿</div>
            </div>
        );
    }

    if(error) {
        return (
            <div className="app-wrapper">
                <div className="error-message">{error}</div>
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

                    {formData.role === 'Candidate' && (
                        <div className="profile-section">
                            <h3>Kỹ năng chuyên môn</h3>

                            {/*Form thêm kỹ năng*/}
                            <div className="add-skill-container">
                                <select className= "skill-select"
                                        value={selectedTagId}
                                        onChange={(e) => setSelectedTagId(e.target.value)}>
                                    <option value="">--Chọn kỹ năng muốn thêm--</option>
                                    {allTags.map(tag => (
                                        <option key={tag.tagId} value={tag.tagId}>
                                            {tag.tagName}
                                        </option>
                                    ))}
                                </select>
                                <button className="btn-add-skill" onClick={handleAddSkill}>
                                    + Thêm
                                </button>
                            </div>

                            {/* Danh sách kỹ năng đang có */}
                            <div className="skill-tags">
                                {userTags.length > 0 ? (
                                    userTags.map((tag) => (
                                        <span key={tag.tagId} className="tag">
                                            {tag.tagName}
                                            <button className="btn-remove-tag"
                                                    onClick={() => handleRemoveSkill(tag.tagId)}
                                                    title="Xóa kỹ năng này">
                                                        x
                                                    </button>
                                        </span>
                                    ))
                                ) : (
                                    <p className="empty-text"> Chưa cập nhật kỹ năng. Hãy thêm kỹ năng để tìm được công việc phù hợp nhé! 🌿</p>
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