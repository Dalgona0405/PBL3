// src/pages/DetailJobPage/components/JobContentSection.jsx
import React from 'react';
import {
    Banknote,
    MapPin,
    Clock,
    Award,
    CalendarClock,
    Tag,
    Globe,
    Send,
    MessageSquare,
    Info
} from 'lucide-react';
import ExplainableScoreCard from '../../../components/common/ExplainableScoreCard';

const formatJDText = (text) => {
    if (!text) return <p className="text-gray-400 italic text-sm">Chưa có thông tin chi tiết.</p>;
    let formatted = text.replace(/([.;:)])([A-ZÀ-Ỹ])/g, '$1\n$2');
    formatted = formatted.replace(/(\p{Ll})([A-ZÀ-Ỹ])/gu, '$1\n$2');
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
                        <h3 className="text-xl font-bold text-olive mb-4 flex items-center gap-2">
                            <Tag className="w-5 h-5" />
                            <span>Từ khóa kỹ năng & Chuyên môn</span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {jobDetail.tags.map((tag) => (
                                <span
                                    key={tag.tagId}
                                    className="bg-cream text-olive px-4 py-1.5 rounded-xl text-sm font-medium border border-gray-200"
                                >
                                    {tag.tagName}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
                    <section>
                        <h3 className="text-xl font-bold text-olive mb-4 pl-3 border-l-4 border-earth">Mô tả công việc</h3>
                        {formatJDText(jobDetail.description)}
                    </section>
                    <section>
                        <h3 className="text-xl font-bold text-olive mb-4 pl-3 border-l-4 border-earth">Yêu cầu ứng viên</h3>
                        {formatJDText(jobDetail.requirement)}
                    </section>
                    <section>
                        <h3 className="text-xl font-bold text-olive mb-4 pl-3 border-l-4 border-earth">Quyền lợi được hưởng</h3>
                        {formatJDText(jobDetail.benefits)}
                    </section>
                </div>
            </div>

            <aside className="lg:w-1/3">
                <div className="bg-white rounded-3xl shadow-sm border-t-8 border-olive p-6 sticky top-8 space-y-6">
                    <h3 className="text-xl font-bold text-textmain border-b border-gray-100 pb-4">Tóm tắt công việc</h3>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-earth shrink-0">
                                <Banknote className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Mức lương</p>
                                <p className="font-bold text-earth">{displaySalary}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-olive shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Khu vực</p>
                                <p className="font-bold text-textmain">{jobDetail.location?.locationName || 'Chưa cập nhật'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-olive shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Kinh nghiệm</p>
                                <p className="font-bold text-textmain">{jobDetail.expYear || 'Không yêu cầu'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-olive shrink-0">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Cấp bậc</p>
                                <p className="font-bold text-textmain">{jobDetail.level || 'Nhân viên'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                                <CalendarClock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Hạn nộp hồ sơ</p>
                                <p className="font-bold text-red-500">
                                    {jobDetail.deadline ? new Date(jobDetail.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-xs font-bold text-olive uppercase tracking-wider mb-1">Địa chỉ làm việc</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{jobDetail.address || 'Chưa cập nhật địa chỉ cụ thể'}</p>
                    </div>

                    {/* PHÂN LUỒNG HYBRID JOB ENGINE ĐÚNG HỢP ĐỒNG BE (Mục 4 FE_API_HANDOFF) */}
                    {isScraped ? (
                        <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-2">
                            <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                                <Globe className="w-4 h-4 shrink-0" />
                                <span>Tin tổng hợp thị trường</span>
                            </div>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Tin tuyển dụng này được thu thập tự động từ thị trường {jobDetail.originalId ? `(Mã nguồn #${jobDetail.originalId})` : ''} nhằm phục vụ tham khảo mức lương và phân tích độ khớp kỹ năng bằng AI.
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium pt-1">
                                <Info className="w-3.5 h-3.5 shrink-0" />
                                <span>Không nhận hồ sơ ATS trực tiếp trên hệ thống.</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <button
                                type="button"
                                disabled={Boolean(user && user.role !== 'Candidate')}
                                className="w-full bg-olive hover:bg-earth disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-base font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                                onClick={onOpenApplyModal}
                            >
                                <Send className="w-4 h-4" />
                                <span>
                                    {user
                                        ? user.role === 'Candidate'
                                            ? 'Ứng tuyển ngay'
                                            : 'Chế độ xem Nhà tuyển dụng'
                                        : 'Đăng nhập để ứng tuyển'}
                                </span>
                            </button>

                            {canCandidateAct && onChatWithHr && (
                                <button
                                    type="button"
                                    disabled={isOpeningChat}
                                    onClick={onChatWithHr}
                                    className="w-full bg-cream hover:bg-earth hover:text-white text-olive border border-olive/30 font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>{isOpeningChat ? 'Đang kết nối HR...' : 'Nhắn tin trực tiếp với HR'}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}

export default JobContentSection;