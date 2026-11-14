import React from 'react';

function ProfileSidebar({ formData }) {
    const getRoleLabel = (role) => {
        if (role === 'Candidate') return 'Ứng viên';
        if (role === 'Recruiter') return 'Nhà tuyển dụng';
        if (role === 'Company') return 'Chủ doanh nghiệp';
        return 'Quản trị viên';
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border-t-8 border-olive p-8 flex flex-col items-center text-center h-fit">
            <div className="w-32 h-32 rounded-full bg-cream border-4 border-olive flex items-center justify-center overflow-hidden mb-6 shadow-inner">
                {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-5xl">👩‍💻</span>
                )}
            </div>
            <h2 className="text-2xl font-bold text-textmain mb-3">
                {formData.fullName || "Người dùng ẩn danh"}
            </h2>
            <span className="bg-olive text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                {getRoleLabel(formData.role)}
            </span>
        </div>
    );
}

export default ProfileSidebar;
