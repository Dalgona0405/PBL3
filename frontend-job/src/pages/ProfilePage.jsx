import React from 'react';
import { Navigate } from 'react-router-dom';
import CandidateProfile from './CandidateProfile';
import RecruiterProfile from './RecruiterProfile';

function ProfilePage() {
    const savedUser = localStorage.getItem('user');

    if (!savedUser) {
        return <Navigate to="/login" />;
    }

    const user = JSON.parse(savedUser);

    if (user.role === 'Candidate') {
        return <CandidateProfile user={user} />;
    }

    if (user.role === 'Recruiter') {
        return <RecruiterProfile user={user} />;
    }

    return <div className="text-center mt-20 text-red-500">Lỗi: Không xác định được vai trò người dùng.</div>;
}

export default ProfilePage;