import React, { useState, useEffect } from 'react';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import CandidateSkillComparison from './CandidateSkillComparison';
import ResumePdfPreviewer from './ResumePdfPreviewer';

function CandidateDetailModal({ candidateId, application = null, jobRequiredSkills = [], onClose }) {
    const [profile, setProfile] = useState(null);
    const [skills, setSkills] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!candidateId) return;
        setActiveTab('profile');

        const fetchCandidateData = async () => {
            try {
                setIsLoading(true);
                const [profileData, skillsData, expData] = await Promise.all([
                    axiosClient.get(`${API_URLS.CANDIDATE}/${candidateId}`),
                    axiosClient.get(`${API_URLS.CANDIDATE}/${candidateId}/skills`).catch(() => []),
                    axiosClient.get(`${API_URLS.CANDIDATE}/${candidateId}/experiences`).catch(() => []),
                ]);

                setProfile(profileData);
                setSkills(Array.isArray(skillsData) ? skillsData : []);
                setExperiences(Array.isArray(expData) ? expData : []);
            } catch (error) {
                console.error('Lỗi lấy thông tin ứng viên:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCandidateData();
    }, [candidateId]);

    const effectiveCvPath = application?.cvUrl || profile?.cvUrl || '';
    const candidateSkillList = skills.length > 0 ? skills : (application?.candidate?.skills || []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-fade-in-up overflow-hidden border-t-8 border-olive">
                <div className="px-8 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3 bg-cream">
                    <div>
                        <h3 className="text-2xl font-bold text-olive">👤 Hồ sơ Ứng viên</h3>
                        <div className="flex gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('profile')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${activeTab === 'profile' ? 'bg-olive text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                            >
                                📋 Hồ sơ & Đối soát Kỹ năng
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('cv')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${activeTab === 'cv' ? 'bg-earth text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                            >
                                📄 Xem trước CV (PDF Preview)
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl leading-none transition-colors">&times;</button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-gray-50">
                    {isLoading ? (
                        <div className="text-center text-olive animate-pulse py-10 font-medium">
                            Đang trích xuất hồ sơ từ hệ thống... 🌿
                        </div>
                    ) : activeTab === 'cv' ? (
                        <ResumePdfPreviewer cvPath={effectiveCvPath} />
                    ) : !profile ? (
                        <div className="text-center text-red-400 py-10">Không tìm thấy thông tin ứng viên.</div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                                <div className="w-24 h-24 rounded-full bg-cream border-4 border-earth flex items-center justify-center overflow-hidden shrink-0">
                                    {profile.avatar ? (
                                        <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl">👩‍💻</span>
                                    )}
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h2 className="text-2xl font-bold text-textmain mb-2">{profile.fullName || 'Chưa cập nhật tên'}</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600 text-sm">
                                        <p>📧 {profile.email || 'Chưa có email'}</p>
                                        <p>📞 {profile.phone || 'Chưa có SĐT'}</p>
                                        <p>⚧️ {profile.gender || 'Chưa rõ'}</p>
                                        <p>🎂 {profile.birthday ? new Date(profile.birthday).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                                        <p className="sm:col-span-2">🏠 {profile.address || 'Chưa cập nhật địa chỉ'}</p>
                                    </div>
                                </div>
                            </div>

                            <CandidateSkillComparison
                                candidateSkills={candidateSkillList}
                                jobRequiredSkills={jobRequiredSkills}
                                aiMatchScore={application?.aiMatchScore}
                                aiScoreBreakdown={application?.aiScoreBreakdown}
                            />

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h4 className="text-lg font-bold text-olive mb-4 border-b border-gray-50 pb-2">💼 Kinh nghiệm làm việc</h4>
                                <div className="space-y-4">
                                    {experiences.length > 0 ? experiences.map((exp) => (
                                        <div key={exp.expId || exp.experienceId || exp.id} className="border-l-4 border-earth pl-4 py-1">
                                            <h5 className="font-bold text-textmain">{exp.jobTitle}</h5>
                                            <p className="text-olive text-sm font-medium mb-1">{exp.companyName}</p>
                                            <p className="text-xs text-gray-500 mb-2">
                                                {exp.startDate ? new Date(exp.startDate).toLocaleDateString('vi-VN') : '...'} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString('vi-VN') : 'Hiện tại'}
                                            </p>
                                            <p className="text-gray-600 text-sm whitespace-pre-line">{exp.description}</p>
                                        </div>
                                    )) : (
                                        <p className="text-gray-400 italic text-sm">Ứng viên chưa cập nhật kinh nghiệm.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-8 py-4 bg-white border-t border-gray-100 flex justify-end">
                    <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2.5 px-6 rounded-xl transition-colors">
                        Đóng lại
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CandidateDetailModal;
