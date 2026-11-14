import React from 'react';
import { APPLICATION_STATUS_OPTIONS } from '../../../constants/applicationStatus';
import { useChatStore } from '../../../stores/useChatStore';

const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
};

function KanbanCard({ app, onDragStart, onSelectCandidate, onOpenStatusModal, onViewFeedback }) {
    const openChatWith = useChatStore((state) => state.openChatWith);
    const skills = app.candidate?.skills || [];
    const hasScore = app.aiMatchScore !== null && app.aiMatchScore !== undefined;
    const hasFeedback = app.message || app.interviewTime || app.interviewLocation || app.meetingLink;

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, app)}
            className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 hover:shadow-md hover:border-earth/50 transition-all cursor-grab active:cursor-grabbing space-y-2.5"
        >
            <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-full bg-cream border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 text-sm">
                    {app.candidate?.avatar ? (
                        <img src={app.candidate.avatar} alt={app.candidate.fullName} className="w-full h-full object-cover" />
                    ) : '👤'}
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-textmain text-sm truncate">{app.candidate?.fullName || 'Ứng viên'}</h4>
                    <p className="text-xs text-gray-400 truncate">{app.candidate?.email}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {hasScore && (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getScoreBadgeClass(Number(app.aiMatchScore))}`}>
                        🤖 {Math.round(Number(app.aiMatchScore))}%
                    </span>
                )}
                {app.candidate?.experienceYears && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-cream text-olive border border-gray-200">
                        💼 {app.candidate.experienceYears}
                    </span>
                )}
            </div>

            {skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-200 text-[11px] font-medium">
                            {skill}
                        </span>
                    ))}
                    {skills.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[11px] text-gray-400 font-bold">+{skills.length - 3}</span>
                    )}
                </div>
            )}

            {app.interviewTime && (
                <div className="text-[11px] bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-lg border border-blue-100 font-medium">
                    📅 {new Date(app.interviewTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                    {app.interviewType && ` • ${app.interviewType}`}
                </div>
            )}

            <div className="pt-1 border-t border-gray-50 flex flex-wrap gap-1.5">
                <button
                    type="button"
                    onClick={() => onSelectCandidate(app)}
                    className="flex-1 min-h-[36px] bg-earth text-white hover:bg-olive px-2.5 py-1 rounded-lg font-bold text-xs transition-colors"
                >
                    👁️ Hồ sơ & CV
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
                    className="min-h-[36px] bg-cream text-olive hover:bg-olive hover:text-white px-2.5 py-1 rounded-lg font-bold text-xs transition-colors border border-gray-200"
                >
                    💬
                </button>
                {hasFeedback && (
                    <button
                        type="button"
                        onClick={() => onViewFeedback(app)}
                        title="Xem lịch hẹn / phản hồi"
                        className="min-h-[36px] bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-bold text-xs border border-blue-200"
                    >
                        📬
                    </button>
                )}
            </div>

            <select
                value={app.status}
                onChange={(e) => onOpenStatusModal(app, parseInt(e.target.value, 10))}
                className="w-full text-xs bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-2.5 py-1.5 font-medium outline-none cursor-pointer"
            >
                {APPLICATION_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

export default KanbanCard;
