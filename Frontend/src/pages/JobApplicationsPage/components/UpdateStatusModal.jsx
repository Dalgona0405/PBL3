import React from 'react';
import { APPLICATION_STATUS, APPLICATION_STATUS_OPTIONS } from '../../../constants/applicationStatus';

const OFFER_TEMPLATE =
    'Chúc mừng bạn đã vượt qua vòng phỏng vấn! Chúng tôi rất ấn tượng với năng lực của bạn và trân trọng gửi lời mời nhận việc chính thức. Bộ phận Nhân sự sẽ liên hệ trao đổi chi tiết về gói đãi ngộ và ngày nhận việc.';
const REJECT_TEMPLATE =
    'Cảm ơn bạn đã dành thời gian ứng tuyển và trao đổi cùng chúng tôi. Tuy nhiên ở thời điểm hiện tại, hồ sơ của bạn chưa hoàn toàn phù hợp với định hướng của vị trí này. Chúng tôi xin phép lưu hồ sơ vào Talent Pool cho các cơ hội phù hợp hơn.';

function UpdateStatusModal({ candidateName, statusForm, isUpdating, onChange, onClose, onConfirm }) {
    const currentStatus = parseInt(statusForm.status, 10);
    const isInterview = currentStatus === APPLICATION_STATUS.INTERVIEW_SCHEDULED;
    const isOnline = (statusForm.interviewType || 'Online') === 'Online';

    const insertTemplate = (text) => onChange({ target: { name: 'message', value: text } });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in-up border-t-8 border-earth">
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-cream shrink-0">
                    <h3 className="text-2xl font-bold text-olive flex items-center gap-2">
                        {isInterview ? '📅 Đặt lịch Phỏng vấn & Gửi .ics' : '✉️ Phản hồi ứng viên'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl leading-none transition-colors">&times;</button>
                </div>

                <div className="p-6 md:p-8 space-y-5 overflow-y-auto flex-1">
                    <p className="text-gray-600">
                        Đang cập nhật trạng thái cho ứng viên <strong className="text-olive">{candidateName}</strong>
                    </p>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Trạng thái mới</label>
                        <select
                            name="status"
                            value={statusForm.status}
                            onChange={onChange}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-bold outline-none"
                        >
                            {APPLICATION_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {isInterview && (
                        <div className="space-y-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1.5">📅 Ngày phỏng vấn</label>
                                    <input
                                        type="date"
                                        name="interviewDate"
                                        value={statusForm.interviewDate || ''}
                                        onChange={onChange}
                                        className="w-full px-3 py-2 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1.5">⏰ Giờ bắt đầu</label>
                                    <input
                                        type="time"
                                        name="interviewStartTime"
                                        value={statusForm.interviewStartTime || ''}
                                        onChange={onChange}
                                        className="w-full px-3 py-2 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1.5">⌛ Giờ kết thúc</label>
                                    <input
                                        type="time"
                                        name="interviewEndTime"
                                        value={statusForm.interviewEndTime || ''}
                                        onChange={onChange}
                                        className="w-full px-3 py-2 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1.5">🌐 Hình thức</label>
                                    <select
                                        name="interviewType"
                                        value={statusForm.interviewType || 'Online'}
                                        onChange={onChange}
                                        className="w-full px-3 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white text-sm font-medium"
                                    >
                                        <option value="Online">Online (Google Meet / Zoom)</option>
                                        <option value="Offline">Trực tiếp tại văn phòng</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1.5">
                                        {isOnline ? '🔗 Đường dẫn phòng họp' : '📍 Địa chỉ văn phòng'}
                                    </label>
                                    <input
                                        type="text"
                                        name={isOnline ? 'meetingLink' : 'interviewLocation'}
                                        placeholder={isOnline ? 'https://meet.google.com/...' : 'Số nhà, Đường, Quận/Thành phố...'}
                                        value={isOnline ? (statusForm.meetingLink || '') : (statusForm.interviewLocation || '')}
                                        onChange={onChange}
                                        className="w-full px-3 py-2 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white text-sm"
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-blue-700 font-medium">
                                📩 Hệ thống sẽ tự động gửi Email HTML kèm tệp lịch chuẩn <strong>invite.ics</strong> cho ứng viên.
                            </p>
                        </div>
                    )}

                    {(currentStatus === APPLICATION_STATUS.OFFERED || currentStatus === APPLICATION_STATUS.REJECTED) && (
                        <div className="bg-cream p-3.5 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="text-olive font-medium">📧 Tự động gửi email thông báo kết quả đến ứng viên.</span>
                            <button
                                type="button"
                                onClick={() => insertTemplate(currentStatus === APPLICATION_STATUS.OFFERED ? OFFER_TEMPLATE : REJECT_TEMPLATE)}
                                className="px-3 py-1 rounded-lg bg-white border border-gray-300 text-olive font-bold hover:bg-gray-50"
                            >
                                ➕ {currentStatus === APPLICATION_STATUS.OFFERED ? 'Chèn mẫu thư Offer' : 'Chèn mẫu thư cảm ơn'}
                            </button>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">💬 Lời nhắn cho ứng viên (Tùy chọn)</label>
                        <textarea
                            name="message"
                            rows="3"
                            placeholder={currentStatus === APPLICATION_STATUS.REJECTED ? 'Cảm ơn bạn đã quan tâm, nhưng hiện tại...' : 'Nhập lời nhắn hoặc dặn dò chuẩn bị trước buổi phỏng vấn...'}
                            value={statusForm.message}
                            onChange={onChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white resize-none"
                        ></textarea>
                    </div>
                </div>

                <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">Hủy bỏ</button>
                    <button
                        onClick={onConfirm}
                        disabled={isUpdating}
                        className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-md transition-all ${isUpdating ? 'bg-gray-400 cursor-not-allowed' : 'bg-earth hover:bg-olive hover:-translate-y-0.5'}`}
                    >
                        {isUpdating ? 'Đang gửi...' : 'Xác nhận & Gửi'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UpdateStatusModal;
