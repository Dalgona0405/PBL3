import React from 'react';

function CompanyBanner({ companyDetail }) {
    const displayWebsite = companyDetail.website || "Chưa cập nhật";
    const isVerified = Boolean(companyDetail.isVerified);

    return (
        <div className="bg-white rounded-3xl shadow-sm border-t-8 border-olive p-6 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-28 h-28 rounded-2xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-2">
                {companyDetail.logoImg ? (
                    <img
                        src={companyDetail.logoImg}
                        alt={`${companyDetail.companyName} logo`}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <span className="text-5xl text-gray-300">🏢</span>
                )}
            </div>

            <div className="flex-1 text-center md:text-left pt-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-textmain">
                        {companyDetail.companyName}
                    </h1>
                    {isVerified && (
                        <span
                            className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1 rounded-full text-xs font-bold"
                            title="Doanh nghiệp đã xác minh"
                        >
                            ✔️ Đã xác minh
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-3 text-gray-600">
                    <p className="flex items-center justify-center md:justify-start gap-3">
                        <span className="text-xl opacity-80">🌐</span>
                        <strong className="w-28 text-left">Website:</strong>
                        {companyDetail.website ? (
                            <a
                                href={companyDetail.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                            >
                                {displayWebsite}
                            </a>
                        ) : (
                            <span>{displayWebsite}</span>
                        )}
                    </p>
                    <p className="flex items-center justify-center md:justify-start gap-3">
                        <span className="text-xl opacity-80">👥</span>
                        <strong className="w-28 text-left">Quy mô:</strong>
                        <span>{companyDetail.size || "Chưa cập nhật"}</span>
                    </p>
                    <p className="flex items-center justify-center md:justify-start gap-3">
                        <span className="text-xl opacity-80">🧾</span>
                        <strong className="w-28 text-left">Mã số thuế:</strong>
                        <span>{companyDetail.taxCode || "Chưa cập nhật"}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default CompanyBanner;
