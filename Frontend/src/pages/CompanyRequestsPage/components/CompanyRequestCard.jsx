import React from 'react';

function CompanyRequestCard({ request, onUpdateStatus }) {
    const companyName = request.companyName || request.company?.companyName || 'Tên công ty ẩn';
    const rawDate = request.createdAt || request.requestDate;
    const requestDateText = rawDate ? new Date(rawDate).toLocaleDateString('vi-VN') : 'Vừa xong';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-shadow border-l-8 border-orange-300">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">
                        Đang chờ duyệt
                    </span>
                    <span className="text-sm text-gray-400">
                        📅 Ngày gửi: {requestDateText}
                    </span>
                </div>

                <h3 className="text-xl font-bold text-olive mb-2">
                    Công ty: {companyName}
                </h3>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <p className="text-gray-600 font-medium flex items-center gap-2">
                        <span>👤 Người yêu cầu:</span>
                        <strong className="text-textmain">{request.recruiterName || 'HR Ẩn danh'}</strong>
                    </p>
                    {request.recruiterEmail && (
                        <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 flex items-center gap-1 w-fit">
                            📧 {request.recruiterEmail}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex gap-3 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                <button
                    type="button"
                    onClick={() => onUpdateStatus(request.requestId, 2, companyName)}
                    className="flex-1 md:flex-none bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-6 py-2.5 rounded-xl font-bold transition-colors border border-red-100 hover:border-red-500"
                >
                    ❌ Từ chối
                </button>
                <button
                    type="button"
                    onClick={() => onUpdateStatus(request.requestId, 1, companyName)}
                    className="flex-1 md:flex-none bg-earth text-white hover:bg-olive px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                    ✅ Phê duyệt
                </button>
            </div>
        </div>
    );
}

export default CompanyRequestCard;
