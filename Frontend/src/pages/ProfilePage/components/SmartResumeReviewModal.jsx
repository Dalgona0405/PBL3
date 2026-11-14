import React, { useState } from 'react';

const toDateInput = (value) => (value ? String(value).split('T')[0] : '');

function SmartResumeReviewModal({ parsedData, existingProfile, isApplying, onClose, onApplyParsed }) {
    const [applyPersonal, setApplyPersonal] = useState(true);
    const [personal, setPersonal] = useState({
        fullName: parsedData.fullName || existingProfile?.fullName || '',
        phone: parsedData.phone || existingProfile?.candidate?.phone || '',
        birthday: toDateInput(parsedData.birthday) || toDateInput(existingProfile?.candidate?.birthday),
        gender: parsedData.gender || existingProfile?.candidate?.gender || '',
        address: parsedData.address || existingProfile?.candidate?.address || ''
    });

    const [skills, setSkills] = useState(() =>
        (parsedData.matchedSkills || []).map((s) => ({
            tagId: s.tagId,
            tagName: s.tagName,
            type: s.type,
            proficiency: 'Khá',
            selected: true
        }))
    );

    const [experiences, setExperiences] = useState(() =>
        (parsedData.extractedExperiences || []).map((exp) => ({
            jobTitle: exp.jobTitle || '',
            companyName: exp.companyName || '',
            startDate: toDateInput(exp.startDate) || '2023-01-01',
            endDate: toDateInput(exp.endDate),
            description: exp.description || '',
            selected: true
        }))
    );

    const updatePersonal = (field, val) => setPersonal((prev) => ({ ...prev, [field]: val }));
    const toggleSkill = (idx) => setSkills((prev) => prev.map((s, i) => (i === idx ? { ...s, selected: !s.selected } : s)));
    const changeSkillProf = (idx, prof) => setSkills((prev) => prev.map((s, i) => (i === idx ? { ...s, proficiency: prof } : s)));
    const toggleExp = (idx) => setExperiences((prev) => prev.map((e, i) => (i === idx ? { ...e, selected: !e.selected } : e)));
    const updateExp = (idx, field, val) => setExperiences((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: val } : e)));

    const handleConfirm = () => {
        onApplyParsed({
            applyPersonal,
            personal,
            skills: skills.filter((s) => s.selected),
            experiences: experiences.filter((e) => e.selected && e.jobTitle.trim() && e.companyName.trim())
        });
    };

    const currentCandidate = existingProfile?.candidate || {};
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border-t-8 border-olive">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-cream/40">
                    <div>
                        <h3 className="text-xl font-bold text-olive">✨ Rà soát thông tin AI bóc tách từ CV</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Kiểm tra, chỉnh sửa và chọn dữ liệu muốn đồng bộ vào hồ sơ</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl font-bold px-2">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {parsedData.education && (
                        <div className="bg-sky-50 border border-sky-200 text-sky-800 px-4 py-2.5 rounded-xl text-sm">
                            🎓 <strong>Học vấn trích xuất:</strong> {parsedData.education}
                        </div>
                    )}

                    <section className="space-y-3 border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                        <label className="flex items-center gap-2 font-bold text-olive cursor-pointer">
                            <input type="checkbox" checked={applyPersonal} onChange={(e) => setApplyPersonal(e.target.checked)} className="w-4 h-4 accent-olive" />
                            <span>📝 Thông tin cá nhân (So sánh & chỉnh sửa)</span>
                        </label>
                        {applyPersonal && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {[
                                    ['fullName', 'Họ tên', existingProfile?.fullName],
                                    ['phone', 'Số điện thoại', currentCandidate.phone],
                                    ['birthday', 'Ngày sinh', toDateInput(currentCandidate.birthday), 'date'],
                                    ['gender', 'Giới tính', currentCandidate.gender],
                                    ['address', 'Địa chỉ', currentCandidate.address]
                                ].map(([field, label, prevVal, type = 'text']) => (
                                    <div key={field} className={field === 'address' ? 'md:col-span-2' : ''}>
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span className="font-semibold text-gray-700">{label}</span>
                                            {prevVal && <span className="truncate max-w-[180px]">Hiện tại: {prevVal}</span>}
                                        </div>
                                        <input
                                            type={type}
                                            value={personal[field]}
                                            onChange={(e) => updatePersonal(field, e.target.value)}
                                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white focus:border-olive outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="space-y-3 border border-gray-100 rounded-2xl p-4">
                        <h4 className="font-bold text-olive text-sm">🏷️ Kỹ năng khớp từ hệ thống ({skills.filter((s) => s.selected).length}/{skills.length})</h4>
                        {skills.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Không phát hiện kỹ năng trùng khớp trong danh mục.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {skills.map((skill, idx) => (
                                    <div key={skill.tagId} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs ${skill.selected ? 'bg-cream border-olive/40' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                                        <input type="checkbox" checked={skill.selected} onChange={() => toggleSkill(idx)} className="accent-olive" />
                                        <span className="font-bold text-gray-800">{skill.tagName}</span>
                                        {skill.selected && (
                                            <select value={skill.proficiency} onChange={(e) => changeSkillProf(idx, e.target.value)} className="bg-white border border-gray-200 rounded px-1 py-0.5 text-[11px]">
                                                <option value="Cơ bản">Cơ bản</option>
                                                <option value="Khá">Khá</option>
                                                <option value="Thành thạo">Thành thạo</option>
                                            </select>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="space-y-3 border border-gray-100 rounded-2xl p-4">
                        <h4 className="font-bold text-olive text-sm">💼 Kinh nghiệm làm việc ({experiences.filter((e) => e.selected).length}/{experiences.length})</h4>
                        {experiences.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Không trích xuất được mốc kinh nghiệm nào từ CV.</p>
                        ) : (
                            <div className="space-y-3">
                                {experiences.map((exp, idx) => (
                                    <div key={idx} className={`p-3 rounded-xl border space-y-2 text-xs ${exp.selected ? 'border-olive/30 bg-cream/20' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                                        <label className="flex items-center gap-2 font-bold text-olive cursor-pointer">
                                            <input type="checkbox" checked={exp.selected} onChange={() => toggleExp(idx)} className="accent-olive" />
                                            <span>Mốc kinh nghiệm #{idx + 1}</span>
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <input value={exp.jobTitle} onChange={(e) => updateExp(idx, 'jobTitle', e.target.value)} placeholder="Vị trí công việc" className="px-2.5 py-1.5 rounded border border-gray-200 bg-white" />
                                            <input value={exp.companyName} onChange={(e) => updateExp(idx, 'companyName', e.target.value)} placeholder="Tên công ty" className="px-2.5 py-1.5 rounded border border-gray-200 bg-white" />
                                            <input type="date" value={exp.startDate} onChange={(e) => updateExp(idx, 'startDate', e.target.value)} className="px-2.5 py-1.5 rounded border border-gray-200 bg-white" />
                                            <input type="date" value={exp.endDate} onChange={(e) => updateExp(idx, 'endDate', e.target.value)} className="px-2.5 py-1.5 rounded border border-gray-200 bg-white" />
                                        </div>
                                        <textarea rows={2} value={exp.description} onChange={(e) => updateExp(idx, 'description', e.target.value)} placeholder="Mô tả ngắn..." className="w-full px-2.5 py-1.5 rounded border border-gray-200 bg-white" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button type="button" onClick={onClose} disabled={isApplying} className="px-5 py-2 rounded-full border border-gray-300 text-gray-600 font-semibold hover:bg-white">Hủy</button>
                    <button type="button" onClick={handleConfirm} disabled={isApplying} className="px-6 py-2 rounded-full bg-olive text-white font-bold hover:bg-earth transition-all disabled:opacity-60">
                        {isApplying ? 'Đang đồng bộ...' : '✅ Lưu & Đồng bộ hồ sơ'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SmartResumeReviewModal;
