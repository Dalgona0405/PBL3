import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import EditCompanyForm from '../components/profile/EditCompanyForm';
import ManageStaffSection from '../components/profile/ManageStaffSection'; 

function ManageCompanyProfilePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [formData, setFormData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🌟 STATE MỚI: Quản lý Tab đang mở ('profile' hoặc 'staff')
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (!user || user.role !== 'Company') {
            navigate('/');
            return;
        }

        const fetchCompanyData = async () => {
            try {
                setIsLoading(true);
                const profileData = await axiosClient.get(`${API_URLS.USERS}/profile`);
                profileData.recruiter = await axiosClient.get(`${API_URLS.RECRUITERS}/${user.id}`);
                
                setFormData(profileData);
            } catch (err) {
                setError("Không thể tải thông tin doanh nghiệp. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanyData();
    }, [user, navigate]);

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải hồ sơ doanh nghiệp... 🏢</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    const companyId = formData?.recruiter?.company?.companyId;

    return (
        <div className="max-w-5xl mx-auto w-full pb-12">
            <div className="mb-8 border-b-2 border-olive pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-textmain mb-2">🏢 Quản lý Doanh nghiệp</h2>
                    <p className="text-gray-500">Quản lý hình ảnh thương hiệu và đội ngũ nhân sự của bạn.</p>
                </div>
            </div>

            {/* 🌟 THANH ĐIỀU HƯỚNG (TABS) */}
            {companyId && (
                <div className="flex gap-4 mb-6 border-b border-gray-200 pb-px">
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`pb-3 px-4 font-bold text-lg transition-colors relative ${activeTab === 'profile' ? 'text-olive' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Thông tin Công ty
                        {activeTab === 'profile' && <span className="absolute bottom-0 left-0 w-full h-1 bg-olive rounded-t-md"></span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('staff')}
                        className={`pb-3 px-4 font-bold text-lg transition-colors relative ${activeTab === 'staff' ? 'text-earth' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Đội ngũ Nhân sự
                        {activeTab === 'staff' && <span className="absolute bottom-0 left-0 w-full h-1 bg-earth rounded-t-md"></span>}
                    </button>
                </div>
            )}

            {/* 🌟 KHU VỰC HIỂN THỊ NỘI DUNG THEO TAB */}
            {companyId ? (
                <>
                    {activeTab === 'profile' && (
                        <EditCompanyForm company={formData.recruiter.company} setFormData={setFormData} />
                    )}
                    
                    {activeTab === 'staff' && (
                        <ManageStaffSection companyId={companyId} />
                    )}
                </>
            ) : (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-50">
                    <p className="text-gray-500 text-lg">Hệ thống đang thiết lập công ty cho bạn. Vui lòng quay lại sau! 🌿</p>
                </div>
            )}
        </div>
    );
}

export default ManageCompanyProfilePage;