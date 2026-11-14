import React from 'react';

function RecruiterJobItem({ job, onNavigate, onToggleStatus, onDelete }) {
    const isJobOpen = job.status === 1 || job.status == null;

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-all border-l-8 ${isJobOpen ? 'border-earth' : 'border-gray-300 opacity-80'}`}>
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <h3
                        className={`text-xl font-bold cursor-pointer transition-colors ${isJobOpen ? 'text-olive hover:text-earth' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => onNavigate(`/detail-job/${job.jobId}`)}
                    >
                        {job.title}
                    </h3>

                    {isJobOpen ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Đang mở</span>
                    ) : (
                        <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">Đã đóng</span>
                    )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 font-medium">
                    <p>📍 {job.locationName || 'Chưa cập nhật'}</p>
                    <p>💰 {job.salaryMin ? `${job.salaryMin} - ${job.salaryMax} triệu` : 'Thỏa thuận'}</p>
                    <p>⏳ Hạn chót: {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Không thời hạn'}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 mt-4 md:mt-0">
                <button
                    onClick={() => onToggleStatus(job.jobId, job.status)}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors border ${isJobOpen ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-500 hover:text-white' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-500 hover:text-white'}`}
                >
                    {isJobOpen ? '🔒 Đóng tin' : '🔓 Mở lại'}
                </button>

                <button
                    onClick={() => onNavigate(`/recruiter/jobs/${job.jobId}/applications`)}
                    className="bg-cream text-olive border border-olive hover:bg-olive hover:text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                >
                    <span>👥</span> Xem CV
                </button>

                <button
                    onClick={() => onNavigate(`/recruiter/jobs/edit/${job.jobId}`)}
                    className="bg-gray-100 text-gray-600 hover:bg-earth hover:text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                >
                    ✏️ Sửa
                </button>

                <button
                    onClick={() => onDelete(job.jobId)}
                    className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                >
                    🗑️ Xóa
                </button>
            </div>
        </div>
    );
}

export default RecruiterJobItem;
