// FILE: src/pages/CandidateProfile.jsx
import React, { useState, useEffect } from 'react';
import { API_URLS } from '../api/api';

function CandidateProfile({ user, token }) {
    const [formData, setFormData] = useState(null);
    const [allTags, setAllTags] = useState([]);
    const [userTags, setUserTags] = useState([]);
    const [selectedTagId, setSelectedTagId] = useState('');
    const[isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null); // Thêm state báo lỗi

    // 1. Lấy dữ liệu khi vừa vào trang
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const[profileRes, allTagsRes, userTagsRes, candidateRes] = await Promise.all([
                    fetch(`${API_URLS.USERS}/profile`, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }),
                    fetch(`${API_URLS.TAGS}`),
                    fetch(`${API_URLS.CANDIDATE}/${user.id}/skills`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URLS.CANDIDATE}/me`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (!profileRes.ok) throw new Error("Không thể tải hồ sơ người dùng.");

                const profileData = await profileRes.json();
                
                if (candidateRes.ok) {
                    profileData.candidate = await candidateRes.json();
                } else {
                    // Khởi tạo rỗng nếu ứng viên mới tạo tài khoản
                    profileData.candidate = { gender: '', phone: '', address: '', birthday: '' };
                }
                setFormData(profileData);
                
                if (allTagsRes.ok) setAllTags(await allTagsRes.json());
                if (userTagsRes.ok) setUserTags(await userTagsRes.json());
            } catch (err) {
                console.error("Lỗi tải dữ liệu Candidate:", err);
                setError("Hệ thống đang bảo trì hoặc lỗi kết nối. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    },[user.id, token]);

    // 2. Các hàm xử lý (Logic)
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        if (id === 'fullName') setFormData({ ...formData, fullName: value });
        else setFormData({ ...formData, candidate: { ...formData.candidate, [id]: value } });
    };

    const handleAddSkill = () => {
        if (!selectedTagId) return;
        if (userTags.some(t => t.tagId === parseInt(selectedTagId))) {
            alert("Bạn đã thêm kỹ năng này rồi nha!");
            return;
        }
        const tagToAdd = allTags.find(t => t.tagId === parseInt(selectedTagId));
        if (tagToAdd) {
            setUserTags([...userTags, { tagId: tagToAdd.tagId, tagName: tagToAdd.tagName, proficiency: "Beginner" }]);
            setSelectedTagId('');
        }
    };

    const handleRemoveSkill = (tagId) => setUserTags(userTags.filter(t => t.tagId !== tagId));

    const handleSave = async () => {
        try {
            const payloadCandidate = {
                fullName: formData.fullName,
                gender: formData.candidate?.gender,
                birthday: formData.candidate?.birthday,
                phone: formData.candidate?.phone,
                address: formData.candidate?.address
            };
            const payloadSkills = userTags.map(t => ({ tagId: t.tagId, proficiency: t.proficiency || "Beginner" }));

            const[res1, res2] = await Promise.all([
                fetch(`${API_URLS.CANDIDATE}/me`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payloadCandidate)
                }),
                fetch(`${API_URLS.CANDIDATE_TAGS}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payloadSkills)
                })
            ]);

            if (res1.ok && res2.ok) alert("Lưu thông tin thành công! 🌿");
            else alert("Có lỗi xảy ra khi lưu thông tin.");
        } catch (err) {
            alert("Lỗi kết nối mạng!");
        }
    };

    if (isLoading) return <div className="text-center text-olive animate-pulse mt-10">Đang tải hồ sơ Ứng viên... 🌿</div>;
    if (error) return <div className="text-center mt-10 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    // 3. Giao diện (UI)
    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            <div className="flex justify-end mb-6">
                <button onClick={handleSave} className="bg-earth hover:bg-olive text-white font-bold py-2.5 px-6 rounded-full shadow-md transition-all transform hover:-translate-y-1">
                    💾 Lưu thay đổi
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cột trái: Avatar */}
                <div className="bg-white rounded-3xl shadow-sm border-t-8 border-olive p-8 flex flex-col items-center text-center h-fit">
                    <div className="w-32 h-32 rounded-full bg-cream border-4 border-earth flex items-center justify-center overflow-hidden mb-6">
                        {formData?.avatar ? <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-5xl">👩‍💻</span>}
                    </div>
                    <h2 className="text-2xl font-bold text-textmain mb-3">{formData?.fullName || "Ứng viên ẩn danh"}</h2>
                    <span className="bg-earth text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">Ứng Viên</span>
                </div>
                
                {/* Cột phải: Form thông tin */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm p-8">
                        <h3 className="text-xl font-bold text-olive mb-6 pb-3 border-b border-gray-100">Thông tin cá nhân</h3>
                        <div className="space-y-5">
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <p className="w-32 font-medium text-gray-600">Họ và tên:</p>
                                <input type="text" id="fullName" value={formData?.fullName || ''} onChange={handleInputChange} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white" />
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <p className="w-32 font-medium text-gray-600">Giới tính:</p>
                                <select id="gender" value={formData?.candidate?.gender || ''} onChange={handleInputChange} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white">
                                    <option value="">-- Chọn giới tính --</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <p className="w-32 font-medium text-gray-600">Điện thoại:</p>
                                <input type="text" id="phone" value={formData?.candidate?.phone || ''} onChange={handleInputChange} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white" />
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <p className="w-32 font-medium text-gray-600">Địa chỉ:</p>
                                <input type="text" id="address" value={formData?.candidate?.address || ''} onChange={handleInputChange} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white" />
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <p className="w-32 font-medium text-gray-600">Sinh nhật:</p>
                                <input type="date" id="birthday" value={formData?.candidate?.birthday ? formData.candidate.birthday.split('T')[0] : ''} onChange={handleInputChange} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white" />
                            </div>
                        </div>
                    </div>

                    {/* Phần Kỹ năng */}
                    <div className="bg-white rounded-3xl shadow-sm p-8">
                        <h3 className="text-xl font-bold text-olive mb-6 pb-3 border-b border-gray-100">Kỹ năng chuyên môn</h3>
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <select value={selectedTagId} onChange={(e) => setSelectedTagId(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50">
                                <option value="">-- Chọn kỹ năng muốn thêm --</option>
                                {allTags.map(tag => <option key={tag.tagId} value={tag.tagId}>{tag.tagName}</option>)}
                            </select>
                            <button onClick={handleAddSkill} className="bg-olive hover:bg-earth text-white font-bold py-2.5 px-6 rounded-xl transition-colors">+ Thêm</button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {userTags.length > 0 ? userTags.map((tag) => (
                                <span key={tag.tagId} className="inline-flex items-center bg-cream text-olive px-4 py-2 rounded-full text-sm font-medium border border-gray-200 shadow-sm">
                                    {tag.tagName}
                                    <button onClick={() => handleRemoveSkill(tag.tagId)} className="ml-2 text-red-400 hover:text-red-600 font-bold text-lg leading-none focus:outline-none">&times;</button>
                                </span>
                            )) : <p className="text-gray-400 italic w-full text-center py-4">Chưa cập nhật kỹ năng.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CandidateProfile;