import React, { useState, useEffect } from 'react';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';

function CandidateDetailModal({ candidateId, onClose }) {
    const [profile, setProfile] = useState(null);
    const [skills, setSkills] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1. GỌI API LẤY DỮ LIỆU KHI MỞ POPUP
    useEffect(() => {
        if (!candidateId) return;

        const fetchCandidateData = async () => {
            try {
                setIsLoading(true);
                const [profileData, skillsData, expData] = await Promise.all([
                    axiosClient.get(`${API_URLS.CANDIDATE}/${candidateId}`),
                    axiosClient.get(`${API_URLS.CANDIDATE}/${candidateId}/skills`).catch(() => []),
                    axiosClient.get(`${API_URLS.CANDIDATE}/${candidateId}/experiences`).catch(() => [])
                ]);

                setProfile(profileData);
                setSkills(skillsData || []);
                setExperiences(expData || []);
            } catch (error) {
                console.error("Lỗi lấy thông tin ứng viên:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCandidateData();
    }, [candidateId]);

    return (
        // Lớp nền đen mờ (Backdrop)
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
            
            {/* Khung Popup chính */}
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fade-in-up overflow-hidden border-t-8 border-olive">
                
                {/* HEADER POPUP */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-cream">
                    <h3 className="text-2xl font-bold text-olive flex items-center gap-2">
                        👤 Hồ sơ Ứng viên
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-red-500 text-3xl leading-none transition-colors"
                    >
                        &times;
                    </button>
                </div>

                {/* BODY POPUP (Có thanh cuộn nếu nội dung dài) */}
                <div className="p-8 overflow-y-auto flex-1 bg-gray-50">
                    {isLoading ? (
                        <div className="text-center text-olive animate-pulse py-10 font-medium">
                            Đang trích xuất hồ sơ từ hệ thống... 🌿
                        </div>
                    ) : !profile ? (
                        <div className="text-center text-red-400 py-10">Không tìm thấy thông tin ứng viên.</div>
                    ) : (
                        <div className="space-y-8">
                            
                            {/* 1. THÔNG TIN CƠ BẢN */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                                <div className="w-24 h-24 rounded-full bg-cream border-4 border-earth flex items-center justify-center overflow-hidden shrink-0">
                                    {profile.avatar ? (
                                        <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl">👩‍💻</span>
                                    )}
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h2 className="text-2xl font-bold text-textmain mb-2">{profile.fullName || "Chưa cập nhật tên"}</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600 text-sm">
                                        <p>📧 {profile.email || "Chưa có email"}</p>
                                        <p>📞 {profile.phone || "Chưa có SĐT"}</p>
                                        <p>⚧️ {profile.gender || "Chưa rõ"}</p>
                                        <p>🎂 {profile.birthday ? new Date(profile.birthday).toLocaleDateString('vi-VN') : "Chưa cập nhật"}</p>
                                        <p className="sm:col-span-2">🏠 {profile.address || "Chưa cập nhật địa chỉ"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. KỸ NĂNG CHUYÊN MÔN */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h4 className="text-lg font-bold text-olive mb-4 border-b border-gray-50 pb-2">🧩 Kỹ năng chuyên môn</h4>
                                <div className="flex flex-wrap gap-2">
                                    {skills.length > 0 ? (
                                        skills.map(skill => (
                                            <span key={skill.tagId} className="bg-cream text-olive px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200">
                                                {skill.tagName}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-gray-400 italic text-sm">Ứng viên chưa cập nhật kỹ năng.</p>
                                    )}
                                </div>
                            </div>

                            {/* 3. KINH NGHIỆM LÀM VIỆC */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h4 className="text-lg font-bold text-olive mb-4 border-b border-gray-50 pb-2">💼 Kinh nghiệm làm việc</h4>
                                <div className="space-y-4">
                                    {experiences.length > 0 ? (
                                        experiences.map(exp => (
                                            <div key={exp.experienceId || exp.id} className="border-l-4 border-earth pl-4 py-1">
                                                <h5 className="font-bold text-textmain">{exp.jobTitle}</h5>
                                                <p className="text-olive text-sm font-medium mb-1">{exp.companyName}</p>
                                                <p className="text-xs text-gray-500 mb-2">
                                                    {exp.startDate ? new Date(exp.startDate).toLocaleDateString('vi-VN') : '...'} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString('vi-VN') : 'Hiện tại'}
                                                </p>
                                                <p className="text-gray-600 text-sm whitespace-pre-line">{exp.description}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-400 italic text-sm">Ứng viên chưa cập nhật kinh nghiệm.</p>
                                    )}
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* FOOTER POPUP */}
                <div className="px-8 py-4 bg-white border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2.5 px-6 rounded-xl transition-colors"
                    >
                        Đóng lại
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CandidateDetailModal;