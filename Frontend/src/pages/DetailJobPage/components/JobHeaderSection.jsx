import React from 'react';

function JobHeaderSection({ jobDetail, onNavigateCompany }) {
    const isVerified = Boolean(jobDetail.company?.isVerified);
    const isScraped = Boolean(jobDetail.isScraped || jobDetail.originalId);
    const isFreelance = Boolean(jobDetail.isFreelanceRecruiter || !jobDetail.company?.companyId);

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 flex flex-col md:flex-row gap-6 items-start">
            <div
                className={`w-28 h-28 rounded-2xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-2 ${jobDetail.company?.companyId ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                onClick={() => jobDetail.company?.companyId && onNavigateCompany(jobDetail.company.companyId)}
            >
                {jobDetail.company?.logoImg ? (
                    <img src={jobDetail.company.logoImg} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                    <span className="text-4xl">🏢</span>
                )}
            </div>

            <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold text-textmain leading-tight">{jobDetail.title}</h1>
                    {isScraped && (
                        <span
                            className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold"
                            title={jobDetail.originalId ? `Mã nguồn: #${jobDetail.originalId}` : 'Tin tổng hợp thị trường'}
                        >
                            🌐 Tin tổng hợp
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                    <p
                        className={`text-lg font-bold ${jobDetail.company?.companyId ? 'text-olive cursor-pointer hover:text-earth transition-colors' : 'text-gray-700'}`}
                        onClick={() => jobDetail.company?.companyId && onNavigateCompany(jobDetail.company.companyId)}
                    >
                        {jobDetail.company?.companyName || 'Nhà tuyển dụng độc lập'}
                    </p>
                    {isVerified && (
                        <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
                            ✔️ Đã xác minh
                        </span>
                    )}
                    {isFreelance && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
                            ⚠️ Nhà tuyển dụng độc lập (Chưa xác minh doanh nghiệp)
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
                    <span className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-1.5">
                        🕒 Đăng ngày: {new Date(jobDetail.postedDate).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-1.5">
                        👁️ {jobDetail.viewCount || 0} lượt xem
                    </span>
                    <span className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-1.5">
                        📥 {jobDetail.applicationCount || 0} lượt ứng tuyển
                    </span>
                </div>
            </div>
        </div>
    );
}

export default JobHeaderSection;
