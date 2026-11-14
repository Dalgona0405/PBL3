import React from 'react';

function ForecastOverviewCards({ overview }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-olive transform transition-transform hover:-translate-y-1">
                <p className="text-gray-500 font-medium mb-1">Tổng Việc Làm</p>
                <h3 className="text-4xl font-bold text-textmain">{overview.totalJobs || overview.TotalJobs || 0}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth transform transition-transform hover:-translate-y-1">
                <p className="text-gray-500 font-medium mb-1">Ứng Viên Đăng Ký</p>
                <h3 className="text-4xl font-bold text-textmain">{overview.totalCandidates || overview.TotalCandidates || 0}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-olive transform transition-transform hover:-translate-y-1">
                <p className="text-gray-500 font-medium mb-1">Công Ty Đối Tác</p>
                <h3 className="text-4xl font-bold text-textmain">{overview.totalCompanies || overview.TotalCompanies || 0}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth transform transition-transform hover:-translate-y-1">
                <p className="text-gray-500 font-medium mb-1">Tỉ Lệ Ứng Tuyển</p>
                <h3 className="text-4xl font-bold text-textmain">
                    {overview.applicationRate || overview.ApplicationRate || 0}%
                </h3>
            </div>
        </div>
    );
}

export default ForecastOverviewCards;
