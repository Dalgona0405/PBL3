import React, { useEffect, useState, useCallback } from 'react';
import { API_URLS } from '../../api/api';
import axiosClient, { HUB_BASE_URL } from '../../api/axiosClient';

const resolveAbsoluteUrl = (rawUrl) => (!rawUrl ? '' : rawUrl.startsWith('/') ? `${HUB_BASE_URL}${rawUrl}` : rawUrl);

function ResumePdfPreviewer({ cvPath }) {
    const [previewUrl, setPreviewUrl] = useState('');
    const [expiresInSeconds, setExpiresInSeconds] = useState(900);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const loadSignedUrl = useCallback(async () => {
        if (!cvPath) { setPreviewUrl(''); setErrorMsg(''); return; }
        setIsLoading(true);
        setErrorMsg('');
        try {
            const res = await axiosClient.get(API_URLS.FILES_CV_SIGNED_URL, { params: { cvPath } });
            setPreviewUrl(resolveAbsoluteUrl(res?.signedUrl || res?.url || cvPath));
            setExpiresInSeconds(res?.expiresInSeconds || 900);
        } catch (err) {
            if (!cvPath.startsWith('supabase://')) {
                setPreviewUrl(resolveAbsoluteUrl(cvPath));
            } else {
                setPreviewUrl('');
                setErrorMsg(err.response?.data?.message || 'Không thể tạo liên kết bảo mật (Pre-signed URL) cho CV này.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [cvPath]);

    useEffect(() => { loadSignedUrl(); }, [loadSignedUrl]);

    if (!cvPath) {
        return <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 text-gray-400">📭 Ứng viên chưa đính kèm tệp CV PDF.</div>;
    }
    if (isLoading) {
        return <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 text-olive animate-pulse font-medium">Đang xác thực Pre-signed URL &amp; tải bản xem trước CV PDF... 🔐</div>;
    }
    if (errorMsg) {
        return (
            <div className="bg-red-50 rounded-2xl p-8 text-center border border-red-100">
                <p className="text-red-600 font-medium mb-4">{errorMsg}</p>
                <button type="button" onClick={loadSignedUrl} className="px-4 py-2 rounded-xl bg-olive text-white text-sm font-bold hover:bg-earth transition-colors">
                    🔄 Thử cấp lại liên kết
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="bg-white px-4 py-3 rounded-2xl border border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold text-olive">
                    🔐 Pre-signed URL bảo mật ({Math.max(1, Math.round(expiresInSeconds / 60))} phút)
                </span>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={loadSignedUrl} className="px-3 py-1.5 rounded-lg bg-cream text-olive hover:bg-gray-200 text-xs font-bold transition-colors">
                        🔄 Làm mới URL
                    </button>
                    {previewUrl && (
                        <a href={previewUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-earth text-white hover:bg-olive text-xs font-bold transition-colors">
                            🔗 Mở tab mới / Tải CV PDF
                        </a>
                    )}
                </div>
            </div>
            {previewUrl && <iframe src={previewUrl} title="Resume PDF Preview" className="w-full h-[62vh] rounded-2xl border border-gray-200 bg-white shadow-inner" />}
        </div>
    );
}

export default ResumePdfPreviewer;
