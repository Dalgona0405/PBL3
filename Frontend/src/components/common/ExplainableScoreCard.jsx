import React from 'react';
import { parseAiScorePayload } from '../../utils/aiScoreUtils';

const CRITERIA_CONFIG = [
    { key: 'skillScore', label: 'Kỹ năng cốt lõi', weight: '40%', max: 40, color: 'bg-olive' },
    { key: 'experienceScore', label: 'Kinh nghiệm', weight: '30%', max: 30, color: 'bg-emerald-500' },
    { key: 'locationScore', label: 'Địa điểm', weight: '20%', max: 20, color: 'bg-sky-500' },
    { key: 'domainScore', label: 'Lĩnh vực GNN', weight: '10%', max: 10, color: 'bg-amber-500' }
];

function ExplainableScoreCard({ matchResult, compact = false }) {
    if (!matchResult || matchResult.matchScore === undefined || matchResult.matchScore === null) return null;

    const normalized = parseAiScorePayload(matchResult.matchScore, matchResult);
    const { matchScore, breakdown, missingSkills, advice } = normalized;

    return (
        <div className={compact
            ? 'bg-cream/60 rounded-2xl border border-olive/15 p-4 space-y-3 text-left'
            : 'bg-gradient-to-r from-cream to-white rounded-3xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md'}
        >
            <div className={`flex ${compact ? 'items-center justify-between gap-3' : 'flex-col md:flex-row items-center gap-6'}`}>
                {!compact && (
                    <div className="w-20 h-20 shrink-0 rounded-full flex items-center justify-center border-4 border-olive bg-white shadow-inner">
                        <span className="text-2xl font-bold text-olive">{matchScore}%</span>
                    </div>
                )}
                <div className={`flex-1 ${compact ? '' : 'text-center md:text-left'}`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h3 className={compact ? 'text-sm font-bold text-olive' : 'text-xl font-bold text-olive'}>
                            {compact ? 'Phân tích điểm phù hợp AI' : 'Độ phù hợp của bạn (Explainable AI)'}
                        </h3>
                        {compact && <span className="text-sm font-extrabold text-olive">{matchScore}%</span>}
                    </div>
                    <p className={`text-gray-700 font-medium ${compact ? 'text-xs' : 'text-sm mb-3'}`}>
                        {advice || 'Hệ thống đang phân tích hồ sơ của bạn...'}
                    </p>
                </div>
            </div>

            <div className={`grid ${compact ? 'grid-cols-1 gap-2' : 'grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100'}`}>
                {CRITERIA_CONFIG.map(({ key, label, weight, max, color }) => {
                    const value = breakdown[key] || 0;
                    const percent = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
                    return (
                        <div key={key} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-gray-600">
                                <span>{label} ({weight})</span>
                                <span className="text-olive">{value}/{max}đ</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {missingSkills?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 border-dashed">
                    <span className="text-xs text-red-500 font-bold">⚠️ Cần bổ sung:</span>
                    {missingSkills.map((skill, idx) => (
                        <span key={idx} className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-lg text-xs font-bold border border-red-100">
                            {skill}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ExplainableScoreCard;
