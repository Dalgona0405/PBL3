import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import EditProfileForm from '../components/profile/EditProfileForm';
import ExperienceSection from '../components/profile/ExperienceSection';
import SkillSection from '../components/profile/SkillSection';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import EditCompanyForm from '../components/profile/EditCompanyForm';


function ProfilePage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [formData, setFormData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        if (!user) { navigate('/login'); return; }

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const profileData = await axiosClient.get(`${API_URLS.USERS}/profile`);

                if (profileData.role === 'Candidate') {
                    profileData.candidate = await axiosClient.get(`${API_URLS.CANDIDATE}/me`);
                }
                else if (profileData.role === 'Recruiter') {
                    profileData.recruiter = await axiosClient.get(`${API_URLS.RECRUITERS}/${user.id}`);
                }

                setFormData(profileData);
            } catch (err) {
                setError("Hệ thống đang bảo trì. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handleSave = async () => {
        try {
            if (formData.role === 'Candidate') {
                const payloadCandidate = {
                    fullName: formData.fullName,
                    gender: formData.candidate?.gender,
                    birthday: formData.candidate?.birthday,
                    phone: formData.candidate?.phone,
                    address: formData.candidate?.address
                };
                await axiosClient.put(`${API_URLS.CANDIDATE}/me`, payloadCandidate);
            }
            else if (formData.role === 'Recruiter') {
                const payloadRecruiter = {
                    fullName: formData.fullName,
                    position: formData.recruiter?.position,
                    companyId: formData.recruiter?.companyId
                };
                await axiosClient.put(`${API_URLS.RECRUITERS}/${user.id}`, payloadRecruiter);
            }
            toast.success("🎉 Đã lưu thông tin cá nhân thành công! 🌿");
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Có lỗi xảy ra khi lưu thông tin.";
            toast.error(errorMessage);
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
                        {formData.role === 'Candidate' ? "Ứng viên" : formData.role === 'Recruiter' ? "Nhà tuyển dụng" : "Quản trị viên"}
                    </span>
                </div>

                <div className="lg:col-span-2">
                    <EditProfileForm formData={formData} setFormData={setFormData} />
                    {formData.role === 'Recruiter' && formData.recruiter?.company && (
                        <EditCompanyForm company={formData.recruiter.company} setFormData={setFormData} />
                    )}
                    {formData.role === 'Candidate' && (
                        <>
                            <SkillSection userId={user.id} />
                            <ExperienceSection userId={user.id} />
                        </>
                    )}
                    <ChangePasswordForm userId={user.id} />
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;