import React, { useState } from 'react';
import { APPLICATION_STATUS, getApplicationStatusInfo } from '../../../constants/applicationStatus';
import ExplainableScoreCard from '../../../components/common/ExplainableScoreCard';
import { parseAiScorePayload } from '../../../utils/aiScoreUtils';

function AppliedJobItem({ app, isUploading, onNavigateJob, onViewFeedback, onChangeCv, onWithdraw }) {
    const [showAiDetail, setShowAiDetail] = useState(false);
    const statusInfo = getApplicationStatusInfo(app.status);
    const canEditOrDelete = app.status === 0 || app.status === APPLICATION_STATUS.APPLIED;
    const hasFeedback = app.message || app.interviewTime || app.interviewLocation || app.meetingLink;
    const hasAiScore = app.aiMatchScore !== undefined && app.aiMatchScore !== null;
    const parsedAiScore = hasAiScore ? parseAiScorePayload(app.aiMatchScore, app.aiScoreBreakdown) : null;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-l-8 border-olive space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                    <h3
                        onClick={() => onNavigateJob(app.jobId)}
                        className="text-xl font-bold text-olive hover:text-earth cursor-pointer transition-colors mb-2"
                    >
                        {app.job?.title || "Công việc không xác định"}
                    </h3>

                    <div className="flex flex-wrap gap-4 text-gray-600 font-medium mb-3">
                        <p className="flex items-center"><span className="mr-2">🏢</span> {app.job?.companyName || "Công ty ẩn"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <p className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                            📅 Ngày nộp: {new Date(app.appliedDate).toLocaleDateString('vi-VN')}
                        </p>
                        {hasAiScore && (
                            <button
                                type="button"
                                onClick={() => setShowAiDetail((prev) => !prev)}
                                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 font-bold text-xs transition-colors"
                            >
                                🎯 AI Match {app.aiMatchScore}% • {showAiDetail ? 'Ẩn chi tiết ▲' : 'Xem giải thích ▼'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="shrink-0 mt-4 md:mt-0 flex flex-col items-end gap-3">
                    <div className={`px-6 py-2.5 rounded-full text-sm font-bold border ${statusInfo.style} shadow-sm text-center min-w-[140px]`}>
                        {statusInfo.text}
                    </div>

                    {hasFeedback && (
                        <button
                            onClick={() => onViewFeedback(app)}
                            className="w-full text-xs font-bold bg-cream text-earth hover:text-olive px-3 py-2 rounded-lg transition-colors border border-gray-200 flex items-center justify-center gap-1 shadow-sm"
                        >
                            💌 Xem thư mời / phản hồi
                        </button>
                    )}

                    {canEditOrDelete && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => onChangeCv(app.applicationId)}
                                disabled={isUploading}
                                className="text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                            >
                                📄 Đổi CV
                            </button>
                            <button
                                onClick={() => onWithdraw(app.applicationId, app.job?.title)}
                                disabled={isUploading}
                                className="text-xs font-bold bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                            >
                                🗑️ Rút hồ sơ
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showAiDetail && parsedAiScore && (
                <ExplainableScoreCard matchResult={parsedAiScore} compact />
            )}
        </div>
    );
}

export default AppliedJobItem;
