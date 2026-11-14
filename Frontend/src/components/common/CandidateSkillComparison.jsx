import React from 'react';

const toUniqueLabels = (items = []) => {
    const map = new Map();
    items.forEach((item) => {
        const label = (typeof item === 'string' ? item : item?.tagName || item?.name || '').trim();
        if (label && !map.has(label.toLowerCase())) {
            map.set(label.toLowerCase(), label);
        }
    });
    return Array.from(map.values());
};

const parseBreakdown = (raw) => {
    if (!raw) return null;
    try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
        return null;
    }
};

function CandidateSkillComparison({
    candidateSkills = [],
    jobRequiredSkills = [],
    aiMatchScore = null,
    aiScoreBreakdown = null,
}) {
    const candLabels = toUniqueLabels(candidateSkills);
    const reqLabels = toUniqueLabels(jobRequiredSkills);
    const candSet = new Set(candLabels.map((s) => s.toLowerCase()));
    const reqSet = new Set(reqLabels.map((s) => s.toLowerCase()));

    const matchedSkills = reqLabels.filter((s) => candSet.has(s.toLowerCase()));
    const missingSkills = reqLabels.filter((s) => !candSet.has(s.toLowerCase()));
    const extraSkills = candLabels.filter((s) => !reqSet.has(s.toLowerCase()));

    const parsed = parseBreakdown(aiScoreBreakdown);
    const bd = parsed?.Breakdown || parsed?.breakdown || parsed;
    const advice = parsed?.Advice || parsed?.advice || '';

    const metrics = bd
        ? [
            { label: 'Kỹ năng cốt lõi', max: 40, val: Number(bd.SkillScore ?? bd.skillScore ?? 0), bar: 'bg-emerald-500' },
            { label: 'Kinh nghiệm', max: 30, val: Number(bd.ExperienceScore ?? bd.experienceScore ?? 0), bar: 'bg-blue-500' },
            { label: 'Địa điểm', max: 20, val: Number(bd.LocationScore ?? bd.locationScore ?? 0), bar: 'bg-amber-500' },
            { label: 'Lĩnh vực GNN', max: 10, val: Number(bd.DomainScore ?? bd.domainScore ?? 0), bar: 'bg-purple-500' },
        ]
        : [];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <h4 className="text-lg font-bold text-olive">🧩 Đối soát Kỹ năng & Điểm AI Match</h4>
                {aiMatchScore !== null && aiMatchScore !== undefined && (
                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        🤖 AI Match: {Math.round(Number(aiMatchScore))}%
                    </span>
                )}
            </div>

            {metrics.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {metrics.map((m) => {
                        const pct = Math.min(100, Math.max(0, Math.round((m.val / m.max) * 100)));
                        return (
                            <div key={m.label}>
                                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                                    <span>{m.label}</span>
                                    <span>{m.val} / {m.max}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className={`h-full ${m.bar} rounded-full`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                    {advice && <p className="sm:col-span-2 text-xs text-gray-600 italic pt-1">💡 {advice}</p>}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-green-50/70 border border-green-100">
                    <p className="text-xs font-bold text-green-700 mb-2">✅ Kỹ năng đáp ứng ({matchedSkills.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                        {matchedSkills.length > 0 ? matchedSkills.map((s) => (
                            <span key={s} className="px-2.5 py-1 rounded-md bg-white text-green-700 border border-green-200 text-xs font-bold">{s}</span>
                        )) : <span className="text-xs text-gray-400 italic">Chưa khớp kỹ năng yêu cầu</span>}
                    </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100">
                    <p className="text-xs font-bold text-amber-700 mb-2">⚠️ Còn thiếu theo JD ({missingSkills.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                        {missingSkills.length > 0 ? missingSkills.map((s) => (
                            <span key={s} className="px-2.5 py-1 rounded-md bg-white text-amber-700 border border-amber-200 text-xs font-medium">{s}</span>
                        )) : <span className="text-xs text-green-600 font-medium">Đáp ứng đủ yêu cầu JD</span>}
                    </div>
                </div>

                <div className="p-3.5 rounded-xl bg-cream/60 border border-gray-200">
                    <p className="text-xs font-bold text-olive mb-2">➕ Kỹ năng khác của ứng viên ({extraSkills.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                        {extraSkills.length > 0 ? extraSkills.map((s) => (
                            <span key={s} className="px-2.5 py-1 rounded-md bg-white text-olive border border-gray-200 text-xs font-medium">{s}</span>
                        )) : <span className="text-xs text-gray-400 italic">Không có kỹ năng bổ sung</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CandidateSkillComparison;
