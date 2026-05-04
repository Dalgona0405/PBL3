import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';

// ==========================================
// COMPONENT CON: FORM SỬA THÔNG TIN
// ==========================================
function EditProfileForm({ formData, setFormData }) {
    // State cho Search Company
    const [searchTerm, setSearchTerm] = useState('');
    const [companyResults, setCompanyResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const[selectedNewCompany, setSelectedNewCompany] = useState(null); // Lưu công ty vừa chọn để gửi request
    const[isSendingRequest, setIsSendingRequest] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    },[]);

    const handleSearchCompany = async (keyword) => {
        setSearchTerm(keyword);
        setSelectedNewCompany(null); // Reset công ty đã chọn nếu user gõ lại
        if (keyword.length < 2) {
            setCompanyResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        setShowDropdown(true);
        try {
            const res = await fetch(`${API_URLS.COMPANIES}/search?keyword=${encodeURIComponent(keyword)}`);
            if (res.ok) {
                const data = await res.json();
                setCompanyResults(data.items || data.Items ||[]);
            }
        } catch (err) {
            console.error("Lỗi tìm công ty:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectCompany = (company) => {
        setSearchTerm(company.companyName);
        setSelectedNewCompany(company); // Lưu lại để hiện nút "Gửi yêu cầu"
        setShowDropdown(false);
    };

    // HÀM MỚI: GỬI YÊU CẦU GIA NHẬP CÔNG TY
    const handleSendCompanyRequest = async () => {
        if (!selectedNewCompany) return;
        setIsSendingRequest(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(API_URLS.COMPANY_REQUESTS, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ companyId: selectedNewCompany.companyId })
            });

            const data = await res.json();
            if (res.ok) {
                alert("🎉 " + data.message);
                setSelectedNewCompany(null);
                setSearchTerm('');
            } else {
                alert("⚠️ " + data.message);
            }
        } catch (err) {
            alert("Lỗi kết nối, không thể gửi yêu cầu!");
        } finally {
            setIsSendingRequest(false);
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        if (id === 'fullName') {
            setFormData({ ...formData, [id]: value });
            return;
        }
        if (['gender', 'birthday', 'phone', 'address'].includes(id)) {
            setFormData({ ...formData, candidate: { ...formData.candidate, [id]: value } });
            return;
        }
        if (id === 'position') {
            setFormData({ ...formData, recruiter: { ...formData.recruiter, [id]: value } });
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

                {/* FORM CHO CANDIDATE */}
                {formData.role === 'Candidate' && (
                    <>
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

                {/* FORM CHO RECRUITER */}
                {formData.role === 'Recruiter' && (
                    <>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <p className="w-32 font-medium text-gray-600">💼 Chức vụ:</p>
                            <input type="text" id="position" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white"
                                value={formData.recruiter?.position || ''} onChange={handleInputChange} />
                        </div>
                        
                        {/* HIỂN THỊ CÔNG TY HIỆN TẠI */}
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <p className="w-32 font-medium text-gray-600">🏢 Công ty hiện tại:</p>
                            <div className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 font-medium">
                                {formData.recruiter?.company?.companyName || "Chưa thuộc công ty nào"}
                            </div>
                        </div>

                        {/* Ô TÌM KIẾM ĐỂ XIN VÀO CÔNG TY MỚI */}
                        <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 relative mt-6 pt-6 border-t border-dashed border-gray-200" ref={dropdownRef}>
                            <p className="w-32 font-medium text-olive mt-3">🔄 Đổi công ty:</p>
                            <div className="flex-1 relative">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Gõ tên công ty muốn gia nhập..."
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white"
                                        value={searchTerm} 
                                        onChange={(e) => handleSearchCompany(e.target.value)} 
                                        onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
                                    />
                                    {/* Nút gửi yêu cầu chỉ hiện khi đã chọn 1 công ty từ dropdown */}
                                    {selectedNewCompany && (
                                        <button 
                                            onClick={handleSendCompanyRequest}
                                            disabled={isSendingRequest}
                                            className="bg-earth hover:bg-olive text-white font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-sm"
                                        >
                                            {isSendingRequest ? 'Đang gửi...' : 'Gửi yêu cầu'}
                                        </button>
                                    )}
                                </div>
                                
                                {/* Dropdown kết quả tìm kiếm */}
                                {showDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        {isSearching ? (
                                            <div className="p-4 text-gray-500 text-center text-sm">Đang tìm kiếm... 🌿</div>
                                        ) : companyResults.length > 0 ? (
                                            companyResults.map(company => (
                                                <div 
                                                    key={company.companyId} 
                                                    className="p-3 hover:bg-cream cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                                    onClick={() => handleSelectCompany(company)}
                                                >
                                                    <p className="font-bold text-olive">{company.companyName}</p>
                                                    {company.website && <p className="text-xs text-gray-500">{company.website}</p>}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-gray-500 text-center text-sm">Không tìm thấy công ty nào.</div>
                                        )}
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 mt-2 italic">
                                    * Yêu cầu gia nhập sẽ được Admin phê duyệt. Trong lúc chờ, bạn vẫn thuộc công ty cũ.
                                </p>
                            </div>
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

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!savedUser || !token) { navigate('/login'); return; }
        const parsedUser = JSON.parse(savedUser);

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [profileRes, allTagsRes] = await Promise.all([
                    fetch(`${API_URLS.USERS}/profile`, {
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                    }),
                    fetch(`${API_URLS.TAGS}`)
                ]);

                if (!profileRes.ok) throw new Error("Không thể tải hồ sơ.");

                const profileData = await profileRes.json();
                const allTagsData = allTagsRes.ok ? await allTagsRes.json() :[];

                if (profileData.role === 'Candidate') {
                    const [userTagsRes, candidateRes] = await Promise.all([
                        fetch(`${API_URLS.CANDIDATE}/${parsedUser.id}/skills`, { headers: { 'Authorization': `Bearer ${token}` } }),
                        fetch(`${API_URLS.CANDIDATE}/me`, { headers: { 'Authorization': `Bearer ${token}` } })
                    ]);

                    if (userTagsRes.ok) setUserTags(await userTagsRes.json());
                    if (candidateRes.ok) profileData.candidate = await candidateRes.json();
                } 
                else if (profileData.role === 'Recruiter') {
                    const recruiterRes = await fetch(`${API_URLS.RECRUITERS}/${parsedUser.id}`, { 
                        headers: { 'Authorization': `Bearer ${token}` } 
                    });
                    if (recruiterRes.ok) profileData.recruiter = await recruiterRes.json();
                }

                setFormData(profileData);
                setAllTags(allTagsData);

            } catch (err) {
                setError("Hệ thống đang bảo trì. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

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

    const handleRemoveSkill = (tagId) => {
        setUserTags(userTags.filter(t => t.tagId !== tagId));
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        try {
            const apiCalls = [];
            if (formData.role === 'Candidate') {
                const payloadCandidate = {
                    fullName: formData.fullName,
                    gender: formData.candidate?.gender,
                    birthday: formData.candidate?.birthday,
                    phone: formData.candidate?.phone,
                    address: formData.candidate?.address
                };
                const payloadSkills = userTags.map(t => ({
                    tagId: t.tagId,
                    proficiency: t.proficiency || "Beginner"
                }));

                apiCalls.push(
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
                );
            } 
            // SỬA LỖI CHÍNH TẢ: Recruiter
            else if (formData.role === 'Recruiter') {
                const payloadRecruiter = {
                    fullName: formData.fullName,
                    position: formData.recruiter?.position,
                    // Gửi CompanyId (số nguyên) thay vì chuỗi tên công ty
                    companyId: formData.recruiter?.companyId 
                };

                apiCalls.push(
                    fetch(`${API_URLS.RECRUITERS}/${formData.userId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(payloadRecruiter)
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
            <div className="flex justify-end mb-6">
                <button
                    className="bg-earth hover:bg-olive text-white font-bold py-2.5 px-6 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2"
                    onClick={handleSave}
                >
                    💾 Lưu thay đổi
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

                <div className="lg:col-span-2">
                    <EditProfileForm formData={formData} setFormData={setFormData} />

                    {formData.role === 'Candidate' && (
                        <div className="bg-white rounded-3xl shadow-sm p-8">
                            <h3 className="text-xl font-bold text-olive mb-6 pb-3 border-b border-gray-100">
                                🧩 Kỹ năng chuyên môn
                            </h3>
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