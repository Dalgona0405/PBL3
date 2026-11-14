import React from 'react';

function AdminOverviewCards({ overview, jobStatus, apps }) {
    const totalUsers = (overview.totalCandidates || overview.TotalCandidates || 0)
        + (overview.totalRecruiters || overview.TotalRecruiters || 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-olive flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center text-2xl shrink-0">👥</div>
                <div>
                    <p className="text-gray-500 font-medium text-sm mb-1">Tổng Người Dùng</p>
                    <h3 className="text-3xl font-bold text-textmain">{totalUsers}</h3>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-2xl shrink-0">🏢</div>
                <div>
                    <p className="text-gray-500 font-medium text-sm mb-1">Doanh Nghiệp</p>
                    <h3 className="text-3xl font-bold text-textmain">{overview.totalCompanies || overview.TotalCompanies || 0}</h3>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-olive flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center text-2xl shrink-0">💼</div>
                <div>
                    <p className="text-gray-500 font-medium text-sm mb-1">Việc Làm Đang Mở</p>
                    <h3 className="text-3xl font-bold text-textmain">{jobStatus.active || jobStatus.Active || 0}</h3>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-2xl shrink-0">📤</div>
                <div>
                    <p className="text-gray-500 font-medium text-sm mb-1">Tổng Lượt Nộp CV</p>
                    <h3 className="text-3xl font-bold text-textmain">{apps.total || apps.Total || 0}</h3>
                </div>
            </div>
        </div>
    );
}

export default AdminOverviewCards;
