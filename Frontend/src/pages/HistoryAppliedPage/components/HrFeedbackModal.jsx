import React from 'react';
import { APPLICATION_STATUS, getApplicationStatusInfo } from '../../../constants/applicationStatus';
import { downloadInterviewIcs } from '../../../utils/icsHelper';

function HrFeedbackModal({ data, onClose }) {
    const statusInfo = getApplicationStatusInfo(data.status);
    const locationOrLink = data.meetingLink || data.interviewLocation || '';

    const handleDownloadIcs = () => {
        downloadInterviewIcs({
            applicationId: data.applicationId,
            jobTitle: data.job?.title,
            companyName: data.job?.companyName,
            startTime: data.interviewTime,
            endTime: data.interviewEndTime,
            interviewType: data.interviewType || 'Online',
            locationOrLink,
            notes: data.message,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border-t-8 border-earth">
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-cream">
                    <h3 className="text-xl font-bold text-olive flex items-center gap-2">💌 Thư từ Nhà tuyển dụng</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl leading-none transition-colors">&times;</button>
                </div>

                <div className="p-8 space-y-5">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-gray-600 text-sm">
                            Vị trí: <strong className="text-textmain text-base">{data.job?.title}</strong>
                        </p>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.style}`}>
                            {statusInfo.text}
                        </span>
                    </div>

                    {data.status === APPLICATION_STATUS.INTERVIEW_SCHEDULED && (
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">🌐 Hình thức</span>
                                <span className="px-2.5 py-0.5 rounded-full bg-white text-blue-700 border border-blue-200 text-xs font-bold">
                                    {data.interviewType === 'Offline' ? '🏢 Trực tiếp' : '💻 Online'}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">⏰ Thời gian phỏng vấn</p>
                                <p className="text-blue-900 font-medium text-sm">
                                    {data.interviewTime ? new Date(data.interviewTime).toLocaleString('vi-VN') : 'Chưa cập nhật'}
                                    {data.interviewEndTime && ` - ${new Date(data.interviewEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">📍 Địa điểm / Link tham gia</p>
                                {locationOrLink.startsWith('http') ? (
                                    <a href={locationOrLink} target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium text-sm break-all">
                                        {locationOrLink}
                                    </a>
                                ) : (
                                    <p className="text-blue-900 font-medium text-sm break-words">{locationOrLink || 'Chưa cập nhật'}</p>
                                )}
                            </div>
                            {data.interviewTime && (
                                <button
                                    type="button"
                                    onClick={handleDownloadIcs}
                                    className="w-full py-2 rounded-xl bg-white hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors"
                                >
                                    📅 Đồng bộ lịch (.ics)
                                </button>
                            )}
                        </div>
                    )}

                    {data.message && (
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">💬 Lời nhắn từ HR</p>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-gray-700 whitespace-pre-line italic text-sm">
                                "{data.message}"
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-white bg-earth hover:bg-olive transition-colors shadow-sm">
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HrFeedbackModal;
