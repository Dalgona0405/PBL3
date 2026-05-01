// FILE: src/pages/RecruiterProfile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { API_URLS } from '../api/api';

function RecruiterProfile({ user, token }) {
    const [formData, setFormData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null); // Mảnh Lego mới: Dùng để chứa thông báo lỗi
    
    // State cho việc tìm kiếm công ty
    const [searchTerm, setSearchTerm] = useState('');
    const[companyResults, setCompanyResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const[showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // 1. Lấy dữ liệu
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const profileRes = await fetch(`${API_URLS.USERS}/profile`, { 
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } 
                });
                
                if (!profileRes.ok) throw new Error("Không thể tải hồ sơ người dùng.");
                
                const profileData = await profileRes.json();
                
                const recruiterRes = await fetch(`${API_URLS.RECRUITERS}/${user.id}`, { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                
                if (recruiterRes.ok) {
                    profileData.recruiter = await recruiterRes.json();
                    setSearchTerm(profileData.recruiter?.company?.companyName || '');
                } else {
                    // FIX LỖI: Nếu HR mới tạo tài khoản, chưa có data thì gán mặc định để form không bị crash
                    profileData.recruiter = { position: '', companyId: null, company: null };
                }
                
                setFormData(profileData);
            } catch (err) {
                console.error("Lỗi tải dữ liệu HR:", err);
                setError("Hệ thống đang bảo trì hoặc lỗi kết nối. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    },[user.id, token]);

    // Tắt dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    },[]);

    // 2. Logic xử lý
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        if (id === 'fullName') setFormData({ ...formData, fullName: value });
        else if (id === 'position') setFormData({ ...formData, recruiter: { ...formData.recruiter, position: value } });
    };

    const handleSearchCompany = async (keyword) => {
        setSearchTerm(keyword);
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
        setShowDropdown(false);
        setFormData({
            ...formData,
            recruiter: { ...formData.recruiter, companyId: company.companyId, company: { companyName: company.companyName } }
        });
    };

    const handleSave = async () => {
        try {
            const payloadRecruiter = {
                fullName: formData.fullName,
                position: formData.recruiter?.position,
                companyId: formData.recruiter?.companyId 
            };
            
            // FIX LỖI: Dùng user.id (lấy từ thẻ đăng nhập) thay vì formData.userId cho chắc chắn 100%
            const res = await fetch(`${API_URLS.RECRUITERS}/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payloadRecruiter)
            });

            if (res.ok) alert("Lưu thông tin thành công! 🌿");
            else alert("Có lỗi xảy ra khi lưu thông tin.");
        } catch (err) {
            alert("Lỗi kết nối mạng!");
        }
    };

    // Nếu đang tải hoặc có lỗi thì hiển thị màn hình này, không render Form bên dưới để tránh crash
    if (isLoading) return <div className="text-center text-olive animate-pulse mt-10">Đang tải hồ sơ Nhà tuyển dụng... 🌿</div>;
    if (error) return <div className="text-center mt-10 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    // 3. Giao diện
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
                        {formData?.avatar ? <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-5xl">👩‍💼</span>}
                    </div>
                    <h2 className="text-2xl font-bold text-textmain mb-3">{formData?.fullName || "HR ẩn danh"}</h2>
                    <span className="bg-earth text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">Nhà Tuyển Dụng</span>
                </div>
                
                {/* Cột phải: Form thông tin */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl shadow-sm p-8">
                        <h3 className="text-xl font-bold text-olive mb-6 pb-3 border-b border-gray-100">Thông tin công việc</h3>
                        <div className="space-y-5">
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <p className="w-32 font-medium text-gray-600">Họ và tên:</p>
                                <input type="text" id="fullName" value={formData?.fullName || ''} onChange={handleInputChange} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white" />
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <p className="w-32 font-medium text-gray-600">Chức vụ:</p>
                                <input type="text" id="position" value={formData?.recruiter?.position || ''} onChange={handleInputChange} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white" />
                            </div>
                            
                            {/* Tìm kiếm công ty */}
                            <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 relative" ref={dropdownRef}>
                                <p className="w-32 font-medium text-gray-600 mt-3">Công ty:</p>
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        placeholder="Gõ tên công ty tìm kiếm..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white"
                                        value={searchTerm} 
                                        onChange={(e) => handleSearchCompany(e.target.value)} 
                                        onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
                                    />
                                    {showDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                            {isSearching ? (
                                                <div className="p-4 text-gray-500 text-center text-sm">Đang tìm kiếm...</div>
                                            ) : companyResults.length > 0 ? (
                                                companyResults.map(company => (
                                                    <div key={company.companyId} className="p-3 hover:bg-cream cursor-pointer border-b border-gray-50" onClick={() => handleSelectCompany(company)}>
                                                        <p className="font-bold text-olive">{company.companyName}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 text-gray-500 text-center text-sm">Không tìm thấy công ty nào.</div>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2 italic">* Công ty sẽ được Admin phê duyệt.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RecruiterProfile;