import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';

// ==========================================
// COMPONENT CON: FORM SỬA THÔNG TIN
// ==========================================
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
        <div className="bg-white rounded-3xl shadow-sm p-8 mb-6">
            <h3 className="text-xl font-bold text-olive mb-6 pb-3 border-b border-gray-100">
                📝 Thông tin cá nhân
            </h3>
            
            <div className="space-y-5">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <p className="w-32 font-medium text-gray-600">Họ và tên:</p> 
                    <input type="text" id="fullName" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" 
                        value={formData.fullName || ''} onChange={handleInputChange} />
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <p className="w-32 font-medium text-gray-600">⚧️ Giới tính:</p>
                    <select id="gender" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" 
                        value={formData.candidate?.gender || ''} onChange={handleInputChange} >
                        <option value="">-- Chọn giới tính --</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                    </select>
                </div>

                {formData.role === 'Candidate' && (
                    <>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <p className="w-32 font-medium text-gray-600">📞 Điện thoại:</p> 
                            <input type="text" id="phone" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" 
                                value={formData.candidate?.phone || ''} onChange={handleInputChange} />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <p className="w-32 font-medium text-gray-600">🏠 Địa chỉ:</p> 
                            <input type="text" id="address" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" 
                                value={formData.candidate?.address || ''} onChange={handleInputChange} />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <p className="w-32 font-medium text-gray-600">🎂 Sinh nhật:</p>
                            <input type="date" id="birthday" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" 
                                value={formData.candidate?.birthday ? formData.candidate.birthday.split('T')[0] : ''} onChange={handleInputChange} />
                        </div>
                    </>
                )}

                {formData.role === 'Recruiter' && (
                    <>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <p className="w-32 font-medium text-gray-600">💼 Chức vụ:</p>
                            <input type="text" id="position" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" 
                                value={formData.recruiter?.position || ''} onChange={handleInputChange} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ==========================================
// COMPONENT CHÍNH: PROFILE PAGE
// ==========================================
function ProfilePage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);
    const[allTags, setAllTags] = useState([]);
    const [userTags, setUserTags] = useState([]);
    const[selectedTagId, setSelectedTagId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. LẤY DỮ LIỆU KHI VÀO TRANG
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token'); // Lấy thẻ VIP
        
        if (!savedUser || !token) { navigate('/login'); return; }
        const parsedUser = JSON.parse(savedUser);
        
        const fetchData = async () => {
            try {
                setIsLoading(true);
                
                // Gọi API lấy Profile và Danh sách tất cả kỹ năng
                const [profileRes, allTagsRes] = await Promise.all([
                    fetch(`${API_URLS.USERS}/profile`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URLS.TAGS}`)
                ]);

                if (!profileRes.ok) throw new Error("Không thể tải hồ sơ.");

                const profileData = await profileRes.json();
                const allTagsData = allTagsRes.ok ? await allTagsRes.json() :[];

                setFormData(profileData);
                setAllTags(allTagsData);

                // Nếu là Candidate thì gọi API lấy kỹ năng của họ
                if (profileData.role === 'Candidate') {
                    const userTagsRes = await fetch(`${API_URLS.CANDIDATE}/me/skills`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (userTagsRes.ok) {
                        const userTagsData = await userTagsRes.json();
                        setUserTags(userTagsData);
                    }
                }
            } catch (err) {
                setError("Hệ thống đang bảo trì. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    // 2. HÀM THÊM KỸ NĂNG (Chỉ thêm vào State UI, chưa lưu Database)
    const handleAddSkill = () => {
        if (!selectedTagId) return;
        if (userTags.some(t => t.tagId === parseInt(selectedTagId))) {
            alert("Bạn đã có kỹ năng này rồi nhé!");
            return;
        }
        
        const tagToAdd = allTags.find(t => t.tagId === parseInt(selectedTagId));
        if (tagToAdd) {
            setUserTags([...userTags, { tagId: tagToAdd.tagId, tagName: tagToAdd.tagName, proficiency: "Beginner" }]);
            setSelectedTagId(''); 
        }
    };

    // 3. HÀM XÓA KỸ NĂNG (Chỉ xóa trên State UI)
    const handleRemoveSkill = (tagId) => {
        setUserTags(userTags.filter(t => t.tagId !== tagId));
    };

    // 4. HÀM LƯU TOÀN BỘ THÔNG TIN XUỐNG DATABASE
    const handleSave = async () => {
        const token = localStorage.getItem('token');
        try {
            const payloadUser = {
                fullName: formData.fullName,
                avatar: formData.avatar
            };
            
            const payloadCandidate = {
                fullName: formData.fullName,
                gender: formData.candidate?.gender,
                birthday: formData.candidate?.birthday,
                phone: formData.candidate?.phone,
                address: formData.candidate?.address
            };

            // Chuẩn bị mảng Kỹ năng để gửi cho Backend C# mới
            const payloadSkills = userTags.map(t => ({
                tagId: t.tagId,
                proficiency: t.proficiency || "Beginner"
            }));

            // Bắn 3 API cùng lúc (User, Candidate, Skills)
            const apiCalls =[
                fetch(`${API_URLS.USERS}/profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payloadUser)
                })
            ];

            if (formData.role === 'Candidate') {
                apiCalls.push(
                    fetch(`${API_URLS.CANDIDATE}/me`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(payloadCandidate)
                    }),
                    fetch(`${API_URLS.CANDIDATE_TAGS}`, { // Đây là API PUT /api/candidates/me/skills
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(payloadSkills)
                    })
                );
            }

            const responses = await Promise.all(apiCalls);
            
            if (responses.every(res => res.ok)) {
                alert("🎉 Đã lưu thông tin thành công! 🌿");
            } else {
                alert("Có lỗi xảy ra khi lưu thông tin.");
            }
        } catch (err) {
            alert("Hệ thống lỗi hoặc rớt mạng, không thể lưu được!");
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải hồ sơ của bạn... 🌿</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            
            {/* Thanh công cụ chứa nút Lưu */}
            <div className="flex justify-end mb-6">
                <button 
                    className="bg-earth hover:bg-olive text-white font-bold py-2.5 px-6 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2"
                    onClick={handleSave}
                >
                    💾 Lưu thay đổi
                </button>
            </div>

            {/* Layout 2 cột */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* CỘT TRÁI: AVATAR & ROLE */}
                <div className="bg-white rounded-3xl shadow-sm border-t-8 border-olive p-8 flex flex-col items-center text-center h-fit">
                    <div className="w-32 h-32 rounded-full bg-cream border-4 border-earth flex items-center justify-center overflow-hidden mb-6 shadow-inner">
                        {formData.avatar ? (
                            <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-5xl">👩‍💻</span>
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-textmain mb-3">
                        {formData.fullName || "Người dùng ẩn danh"}
                    </h2>
                    <span className="bg-earth text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                        {formData.role === 'Candidate' ? 'Ứng Viên' : 'Nhà Tuyển Dụng'}
                    </span>
                </div>

                {/* CỘT PHẢI: FORM & SKILLS */}
                <div className="lg:col-span-2">
                    
                    {/* Form thông tin cá nhân */}
                    <EditProfileForm formData={formData} setFormData={setFormData} />

                    {/* Khu vực Kỹ năng (Chỉ hiện cho Candidate) */}
                    {formData.role === 'Candidate' && (
                        <div className="bg-white rounded-3xl shadow-sm p-8">
                            <h3 className="text-xl font-bold text-olive mb-6 pb-3 border-b border-gray-100">
                                🧩 Kỹ năng chuyên môn
                            </h3>

                            {/* Form thêm kỹ năng */}
                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                <select 
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50"
                                    value={selectedTagId}
                                    onChange={(e) => setSelectedTagId(e.target.value)}
                                >
                                    <option value="">-- Chọn kỹ năng muốn thêm --</option>
                                    {allTags.map(tag => (
                                        <option key={tag.tagId} value={tag.tagId}>{tag.tagName}</option>
                                    ))}
                                </select>
                                <button 
                                    className="bg-olive hover:bg-earth text-white font-bold py-2.5 px-6 rounded-xl transition-colors"
                                    onClick={handleAddSkill}
                                >
                                    + Thêm
                                </button>
                            </div>

                            {/* Danh sách kỹ năng đang có */}
                            <div className="flex flex-wrap gap-3">
                                {userTags.length > 0 ? (
                                    userTags.map((tag) => (
                                        <span key={tag.tagId} className="inline-flex items-center bg-cream text-olive px-4 py-2 rounded-full text-sm font-medium border border-gray-200 shadow-sm">
                                            {tag.tagName}
                                            <button 
                                                className="ml-2 text-red-400 hover:text-red-600 font-bold text-lg leading-none focus:outline-none transform hover:scale-110 transition-transform"
                                                onClick={() => handleRemoveSkill(tag.tagId)}
                                                title="Xóa kỹ năng này"
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-gray-400 italic w-full text-center py-4">
                                        Chưa cập nhật kỹ năng. Hãy thêm kỹ năng để tìm được công việc phù hợp nhé! 🌿
                                    </p>
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