import React from 'react';

function ApplyJobModal({
    jobTitle,
    candidateProfile,
    cvOption,
    isSubmitting,
    onChangeOption,
    onFileChange,
    onClose,
    onConfirm
}) {
    const defaultCv = candidateProfile?.cvUrl || candidateProfile?.cVUrl || candidateProfile?.CVUrl;
    const hasDefaultCv = Boolean(defaultCv);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border-t-8 border-olive">
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-cream">
                    <h3 className="text-2xl font-bold text-olive flex items-center gap-2">🚀 Xác nhận ứng tuyển</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl leading-none transition-colors">&times;</button>
                </div>

                <div className="p-8">
                    <p className="text-gray-600 mb-6 text-lg">
                        Bạn đang ứng tuyển vào vị trí <strong className="text-olive">{jobTitle}</strong>. Vui lòng chọn CV:
                    </p>

                    <label className={`flex items-center p-5 border-2 rounded-2xl mb-4 transition-all ${!hasDefaultCv ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : (cvOption === 'default' ? 'border-earth bg-cream cursor-pointer' : 'border-gray-100 hover:bg-gray-50 cursor-pointer')}`}>
                        <input
                            type="radio"
                            name="cvOption"
                            value="default"
                            disabled={!hasDefaultCv}
                            checked={cvOption === 'default'}
                            onChange={() => onChangeOption('default')}
                            className="w-5 h-5 text-earth focus:ring-earth disabled:bg-gray-300"
                        />
                        <div className="ml-4">
                            <span className="block font-bold text-textmain text-lg">Dùng CV mặc định</span>
                            {hasDefaultCv ? (
                                <span className="text-sm text-gray-500">Hệ thống sẽ lấy CV bạn đã lưu trong Hồ sơ.</span>
                            ) : (
                                <span className="text-sm text-red-500 font-medium">⚠️ Bạn chưa có CV trong Hồ sơ. Vui lòng tải file mới lên.</span>
                            )}
                        </div>
                    </label>

                    <label className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${cvOption === 'new' ? 'border-earth bg-cream' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <input
                            type="radio"
                            name="cvOption"
                            value="new"
                            checked={cvOption === 'new'}
                            onChange={() => onChangeOption('new')}
                            className="w-5 h-5 text-earth focus:ring-earth"
                        />
                        <div className="ml-4 w-full">
                            <span className="block font-bold text-textmain text-lg mb-1">Tải CV mới lên (PDF)</span>
                            {cvOption === 'new' && (
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={onFileChange}
                                    className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-olive hover:file:bg-olive hover:file:text-white transition-all border border-gray-200"
                                />
                            )}
                        </div>
                    </label>
                </div>

                <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">Hủy bỏ</button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-md transition-all ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-earth hover:bg-olive hover:-translate-y-0.5'}`}
                    >
                        {isSubmitting ? 'Đang gửi...' : 'Xác nhận nộp CV'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ApplyJobModal;
