import React from 'react';
import { APPLICATION_STATUS_OPTIONS, getApplicationStatusInfo } from '../../../constants/applicationStatus';
import { useChatStore } from '../../../stores/useChatStore';

function ApplicationTable({ applications, onSelectCandidate, onOpenStatusModal, onViewFeedback }) {
    const openChatWith = useChatStore((state) => state.openChatWith);

    if (applications.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-50">
                <p className="text-gray-500 text-lg">Không tìm thấy ứng viên nào khớp với bộ lọc hiện tại. 🌿</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-cream text-olive border-b-2 border-gray-100 text-sm">
                            <th className="py-4 px-5 font-bold">Ứng viên</th>
                            <th className="py-4 px-5 font-bold">Kỹ năng &amp; KN</th>
                            <th className="py-4 px-5 font-bold">AI Match</th>
                            <th className="py-4 px-5 font-bold">Hồ sơ &amp; CV</th>
                            <th className="py-4 px-5 font-bold">Trạng thái</th>
                            <th className="py-4 px-5 font-bold">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map((app) => {
                            const statusInfo = getApplicationStatusInfo(app.status);
                            const skills = app.candidate?.skills || [];
                            const hasScore = app.aiMatchScore !== null && app.aiMatchScore !== undefined;
                            const hasFeedback = app.message || app.interviewTime || app.interviewLocation || app.meetingLink;

                            return (
                                <tr key={app.applicationId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                                {app.candidate?.avatar ? (
                                                    <img src={app.candidate.avatar} alt="avt" className="w-full h-full object-cover" />
                                                ) : '👤'}
                                            </div>
                                            <div>
                                                <strong className="text-textmain block text-base">{app.candidate?.fullName}</strong>
                                                <span className="text-xs text-gray-500 block">{app.candidate?.email}</span>
                                                <span className="text-[11px] text-gray-400">
                                                    Nộp: {new Date(app.appliedDate).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-5 max-w-[230px]">
                                        {app.candidate?.experienceYears && (
                                            <span className="inline-block mb-1.5 px-2 py-0.5 rounded-md bg-cream text-olive text-xs font-bold border border-gray-200">
                                                💼 {app.candidate.experienceYears}
                                            </span>
                                        )}
                                        <div className="flex flex-wrap gap-1">
                                            {skills.length > 0 ? skills.slice(0, 4).map((s) => (
                                                <span key={s} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs">{s}</span>
                                            )) : <span className="text-xs text-gray-400 italic">Chưa cập nhật</span>}
                                        </div>
                                    </td>
                                    <td className="py-4 px-5">
                                        {hasScore ? (
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${Number(app.aiMatchScore) >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                🤖 {Math.round(Number(app.aiMatchScore))}%
                                            </span>
                                        ) : <span className="text-xs text-gray-400">—</span>}
                                    </td>
                                    <td className="py-4 px-5">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onSelectCandidate(app)}
                                                className="inline-flex items-center gap-1 bg-earth text-white hover:bg-olive px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm"
                                            >
                                                👁️ Hồ sơ &amp; CV
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openChatWith({
                                                    partnerId: app.candidate?.userId || app.userId,
                                                    partnerName: app.candidate?.fullName || 'Ứng viên',
                                                    partnerAvatar: app.candidate?.avatar || null,
                                                    partnerRole: 'Candidate',
                                                    jobId: app.jobId,
                                                    jobTitle: app.job?.title || null,
                                                })}
                                                className="inline-flex items-center gap-1 bg-cream text-olive hover:bg-olive hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors border border-gray-200"
                                            >
                                                💬 Nhắn tin
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-4 px-5">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${statusInfo.style}`}>
                                            {statusInfo.text}
                                        </span>
                                    </td>
                                    <td className="py-4 px-5 min-w-[170px]">
                                        <select
                                            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-earth focus:border-earth block w-full p-2 outline-none cursor-pointer shadow-sm font-medium"
                                            value={app.status}
                                            onChange={(e) => onOpenStatusModal(app, parseInt(e.target.value, 10))}
                                        >
                                            {APPLICATION_STATUS_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        {hasFeedback && (
                                            <button
                                                type="button"
                                                onClick={() => onViewFeedback(app)}
                                                className="mt-2 w-full text-xs font-bold text-earth hover:text-olive bg-cream py-1.5 rounded-lg border border-gray-200"
                                            >
                                                📬 Xem lịch / phản hồi
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ApplicationTable;
