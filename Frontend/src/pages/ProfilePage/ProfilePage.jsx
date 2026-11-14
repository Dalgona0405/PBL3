import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import ProfileSidebar from './components/ProfileSidebar';
import EditProfileForm from './components/EditProfileForm';
import ExperienceSection from './components/ExperienceSection';
import SkillSection from './components/SkillSection';
import ChangePasswordForm from './components/ChangePasswordForm';
import SmartResumeReviewModal from './components/SmartResumeReviewModal';
import { validateProfileForm } from '../../utils/formValidators';

function ProfilePage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [formData, setFormData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [parsedCvData, setParsedCvData] = useState(null);
    const [isApplyingParsed, setIsApplyingParsed] = useState(false);
    const [syncKey, setSyncKey] = useState(0);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const profileData = await axiosClient.get(`${API_URLS.USERS}/profile`);

                if (profileData.role === 'Candidate') {
                    profileData.candidate = await axiosClient.get(`${API_URLS.CANDIDATE}/me`);
                } else if (profileData.role === 'Recruiter' || profileData.role === 'Company') {
                    profileData.recruiter = await axiosClient.get(`${API_URLS.RECRUITERS}/${user.id}`).catch(() => null);
                }

                setFormData(profileData);
            } catch {
                setError("Hệ thống đang bảo trì. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [navigate, user]);

    const handleSave = async () => {
        const { isValid, errors } = validateProfileForm(formData);
        if (!isValid) {
            setFieldErrors(errors);
            toast.error("Vui lòng kiểm tra lại các trường thông tin.");
            return;
        }
        try {
            if (formData.role === 'Candidate') {
                await axiosClient.put(`${API_URLS.CANDIDATE}/me`, {
                    fullName: formData.fullName,
                    gender: formData.candidate?.gender || null,
                    birthday: formData.candidate?.birthday || null,
                    phone: formData.candidate?.phone?.trim() || null,
                    address: formData.candidate?.address?.trim() || null,
                    cvUrl: formData.candidate?.cvUrl || null
                });
            } else if (formData.role === 'Recruiter' || formData.role === 'Company') {
                await axiosClient.put(`${API_URLS.RECRUITERS}/${user.id}`, {
                    fullName: formData.fullName, position: formData.recruiter?.position, companyId: formData.recruiter?.companyId
                });
            } else {
                await axiosClient.put(`${API_URLS.USERS}/${user.id}`, { fullName: formData.fullName });
            }
            setFieldErrors({});
            toast.success("🎉 Đã lưu thông tin cá nhân thành công! 🌿");
        } catch (err) {
            toast.error(err.response?.data?.message || "Có lỗi xảy ra khi lưu thông tin.");
        }
    };

    const handleApplyParsedCv = async ({ applyPersonal, personal, skills, experiences }) => {
        const resolvedCvUrl = parsedCvData?.cvUrl || parsedCvData?.CVUrl || formData.candidate?.cvUrl || null;
        const nextForm = applyPersonal
            ? { ...formData, fullName: personal.fullName, candidate: { ...formData.candidate, ...personal, cvUrl: resolvedCvUrl } }
            : { ...formData, candidate: { ...formData.candidate, cvUrl: resolvedCvUrl } };
        if (applyPersonal) {
            const { isValid, errors } = validateProfileForm(nextForm);
            if (!isValid) {
                toast.error(Object.values(errors)[0] || "Thông tin cá nhân chưa hợp lệ.");
                return;
            }
        }
        setIsApplyingParsed(true);
        try {
            if (applyPersonal) {
                await axiosClient.put(`${API_URLS.CANDIDATE}/me`, {
                    fullName: nextForm.fullName, gender: personal.gender || null,
                    birthday: personal.birthday || null, phone: personal.phone?.trim() || null,
                    address: personal.address?.trim() || null, cvUrl: resolvedCvUrl
                });
            }
            setFormData(nextForm);
            if (skills.length > 0) {
                const existing = await axiosClient.get(`${API_URLS.CANDIDATE}/${user.id}/skills`).catch(() => []);
                const mergedMap = new Map((existing || []).map((s) => [s.tagId, { tagId: s.tagId, proficiency: s.proficiency || 'Khá' }]));
                skills.forEach((s) => mergedMap.set(s.tagId, { tagId: s.tagId, proficiency: s.proficiency || 'Khá' }));
                await axiosClient.put(`${API_URLS.CANDIDATE}/me/skills`, Array.from(mergedMap.values()));
            }
            if (experiences.length > 0) {
                await Promise.all(experiences.map((exp) => axiosClient.post(`${API_URLS.CANDIDATE}/me/experiences`, {
                    jobTitle: exp.jobTitle, companyName: exp.companyName,
                    startDate: exp.startDate, endDate: exp.endDate || null, description: exp.description
                })));
            }
            setSyncKey((k) => k + 1);
            setParsedCvData(null);
            toast.success("✨ Đã đồng bộ hồ sơ từ CV thành công!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi khi đồng bộ dữ liệu CV.");
        } finally {
            setIsApplyingParsed(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải hồ sơ của bạn... 🌿</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            <div className="flex justify-end mb-6">
                <button className="bg-olive hover:bg-earth text-white font-bold py-2.5 px-6 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2" onClick={handleSave}>
                    💾 Lưu thay đổi
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <ProfileSidebar formData={formData} />
                <div className="lg:col-span-2">
                    <EditProfileForm
                        formData={formData} setFormData={setFormData} errors={fieldErrors}
                        onClearError={(field) => setFieldErrors((prev) => ({ ...prev, [field]: undefined }))}
                        onParsedCv={setParsedCvData}
                    />
                    {formData.role === 'Candidate' && (
                        <>
                            <SkillSection key={`skills-${syncKey}`} userId={user.id} />
                            <ExperienceSection key={`exp-${syncKey}`} userId={user.id} />
                        </>
                    )}
                    <ChangePasswordForm userId={user.id} />
                </div>
            </div>
            {parsedCvData && (
                <SmartResumeReviewModal
                    parsedData={parsedCvData} existingProfile={formData} isApplying={isApplyingParsed}
                    onClose={() => setParsedCvData(null)} onApplyParsed={handleApplyParsedCv}
                />
            )}
        </div>
    );
}

export default ProfilePage;
