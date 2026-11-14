import React from 'react';
import ExplainableScoreCard from '../../../components/common/ExplainableScoreCard';

const formatJDText = (text) => {
    if (!text) return null;
    let formatted = text.replace(/([.;:)])([A-ZĐ])/g, '$1\n$2');
    formatted = formatted.replace(/(\p{Ll})([A-ZĐ])/gu, '$1\n$2');

    return (
        <ul className="list-disc pl-5 space-y-2 text-gray-700 leading-relaxed">
            {formatted.split('\n').map((sentence, index) => {
                const cleanSentence = sentence.trim();
                return cleanSentence.length > 2 ? <li key={index}>{cleanSentence}</li> : null;
            })}
        </ul>
    );
};

const getDisplaySalary = (salaryMin, salaryMax) => {
    if (salaryMin && salaryMax) {
        return salaryMin === salaryMax ? `${salaryMin} triệu` : `${salaryMin} - ${salaryMax} triệu`;
    }
    if (salaryMin && !salaryMax) return `Từ ${salaryMin} triệu`;
    if (!salaryMin && salaryMax) return `Lên đến ${salaryMax} triệu`;
    return 'Thỏa thuận';
};

function JobContentSection({ jobDetail, matchResult, user, onOpenApplyModal, onChatWithHr, isOpeningChat }) {
    const displaySalary = getDisplaySalary(jobDetail.salaryMin, jobDetail.salaryMax);
    const isScraped = Boolean(jobDetail.isScraped || jobDetail.originalId);
    const canCandidateAct = !user || user.role === 'Candidate';

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3 space-y-8">
                {matchResult && matchResult.matchScore !== undefined && (
                    <ExplainableScoreCard matchResult={matchResult} />
                )}

                {jobDetail.tags?.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <h3 className="text-xl font-bold text-olive mb-4 flex items-center gap-2">🏷️ Thẻ từ khóa (Tags)</h3>
                        <div className="flex flex-wrap gap-2">
                            {jobDetail.tags.map((tag) => (
                                <span key={tag.tagId} className="bg-cream text-olive px-4 py-1.5 rounded-xl text-sm font-medium border border-gray-200">
                                    {tag.tagName}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
                    <div>
                        <h3 className="text-xl font-bold text-olive mb-4 pl-3 border-l-4 border-earth">Mô tả công việc</h3>
                        {formatJDText(jobDetail.description)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-olive mb-4 pl-3 border-l-4 border-earth">Yêu cầu ứng viên</h3>
                        {formatJDText(jobDetail.requirement)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-olive mb-4 pl-3 border-l-4 border-earth">Quyền lợi</h3>
                        {formatJDText(jobDetail.benefits)}
                    </div>
                </div>
            </div>

            <div className="lg:w-1/3">
                <div className="bg-white rounded-3xl shadow-sm border-t-8 border-olive p-6 sticky top-8 space-y-6">
                    <h3 className="text-xl font-bold text-textmain border-b border-gray-100 pb-4">Tóm tắt công việc</h3>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-lg shrink-0">💰</div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Mức lương</p>
                                <p className="font-bold text-earth">{displaySalary}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-lg shrink-0">📍</div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Địa điểm</p>
                                <p className="font-bold text-textmain">{jobDetail.location?.locationName || 'Chưa cập nhật'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-lg shrink-0">⏳</div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Kinh nghiệm</p>
                                <p className="font-bold text-textmain">{jobDetail.expYear || 'Không yêu cầu'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-lg shrink-0">🎓</div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Cấp bậc</p>
                                <p className="font-bold text-textmain">{jobDetail.level || 'Nhân viên'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-lg shrink-0">⏰</div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Hạn nộp hồ sơ</p>
                                <p className="font-bold text-red-500">
                                    {jobDetail.deadline ? new Date(jobDetail.deadline).toLocaleDateString('vi-VN') : 'Không thời hạn'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-sm font-bold text-olive mb-1">Địa chỉ cụ thể:</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{jobDetail.address || 'Chưa cập nhật'}</p>
                    </div>

                    {isScraped && (
                        <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-700 leading-relaxed">
                            🌐 Đây là tin tổng hợp từ thị trường{jobDetail.originalId ? ` (Mã nguồn #${jobDetail.originalId})` : ''}.
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            type="button"
                            className="w-full bg-olive hover:bg-earth text-white text-lg font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                            onClick={onOpenApplyModal}
                        >
                            {user ? (user.role === 'Candidate' ? '🚀 Ứng tuyển ngay' : 'Bạn là nhà tuyển dụng') : 'Đăng nhập để ứng tuyển'}
                        </button>

                        {canCandidateAct && onChatWithHr && (
                            <button
                                type="button"
                                disabled={isOpeningChat}
                                onClick={onChatWithHr}
                                className="w-full bg-cream hover:bg-earth hover:text-white text-olive border border-olive/30 font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                💬 {isOpeningChat ? 'Đang kết nối HR...' : 'Nhắn tin với HR'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JobContentSection;
