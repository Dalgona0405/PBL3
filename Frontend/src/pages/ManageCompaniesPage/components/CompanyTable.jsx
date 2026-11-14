import React from 'react';

function CompanyTable({ companies, isLoading, onViewDetail, onToggleVerify, onDelete }) {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden">
            {isLoading ? (
                <div className="text-center text-olive animate-pulse py-20 text-lg font-medium">Đang tải dữ liệu doanh nghiệp... 🌿</div>
            ) : companies.length === 0 ? (
                <div className="text-center text-gray-500 py-20">Không tìm thấy công ty nào.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-cream text-olive border-b-2 border-gray-100">
                                <th className="py-4 px-6 font-bold">Doanh nghiệp</th>
                                <th className="py-4 px-6 font-bold">Mã số thuế</th>
                                <th className="py-4 px-6 font-bold">Xác thực</th>
                                <th className="py-4 px-6 font-bold">Website</th>
                                <th className="py-4 px-6 font-bold text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map(company => (
                                <tr key={company.companyId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 p-1">
                                                {company.logoImg ? <img src={company.logoImg} alt="logo" className="w-full h-full object-contain" /> : '🏢'}
                                            </div>
                                            <strong
                                                className="text-textmain text-lg hover:text-olive cursor-pointer transition-colors"
                                                onClick={() => onViewDetail(company.companyId)}
                                            >
                                                {company.companyName}
                                            </strong>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-gray-600 font-mono text-sm">
                                        {company.taxCode || 'Chưa cập nhật'}
                                    </td>
                                    <td className="py-4 px-6">
                                        {company.isVerified ? (
                                            <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-full text-xs font-bold">
                                                ✔️ Tick Xanh
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center bg-gray-100 text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                                                Chưa xác minh
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-gray-600">
                                        {company.website ? (
                                            <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Truy cập</a>
                                        ) : 'Chưa có'}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex justify-center gap-2 flex-wrap">
                                            <button
                                                type="button"
                                                onClick={() => onToggleVerify(company)}
                                                className={`${company.isVerified ? 'bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white'} px-3 py-1.5 rounded-lg font-bold text-sm transition-colors`}
                                            >
                                                {company.isVerified ? '🚫 Thu hồi Tick' : '✔️ Cấp Tick Xanh'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onViewDetail(company.companyId)}
                                                className="bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg font-bold text-sm transition-colors"
                                            >
                                                👁️ Xem
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDelete(company.companyId, company.companyName)}
                                                className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg font-bold text-sm transition-colors"
                                            >
                                                🗑️ Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default CompanyTable;
