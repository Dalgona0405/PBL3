import React, { useState } from 'react';
import { API_URLS } from '../../../api/api';
import axiosClient, { HUB_BASE_URL } from '../../../api/axiosClient';
import toast from 'react-hot-toast';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import RecruiterCompanyTransfer from './RecruiterCompanyTransfer';

function EditProfileForm({ formData, setFormData, errors = {}, onClearError, onParsedCv }) {
    const [isParsingCv, setIsParsingCv] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onClearError?.(name);
        if (name === 'fullName') {
            setFormData({ ...formData, [name]: value });
            return;
        }
        if (['gender', 'birthday', 'phone', 'address'].includes(name)) {
            setFormData({ ...formData, candidate: { ...formData.candidate, [name]: value } });
            return;
        }
        if (name === 'position') {
            setFormData({ ...formData, recruiter: { ...formData.recruiter, [name]: value } });
        }
    };

    const handleCvUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            toast.error("Chỉ chấp nhận tệp PDF!");
            e.target.value = null;
            return;
        }
        const toastId = toast.loading("Đang tải CV lên... 🌿");
        try {
            const fd = new FormData();
            fd.append('file', file);
            const uploadRes = await axiosClient.post(API_URLS.FILES_UPLOAD, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newCvUrl = uploadRes.url || uploadRes.fileUrl || uploadRes.data || uploadRes;
            await axiosClient.patch(`${API_URLS.CANDIDATE}/me/default-cv`, { cvUrl: newCvUrl });
            setFormData((prev) => ({ ...prev, candidate: { ...prev.candidate, cvUrl: newCvUrl } }));
            toast.success("🎉 Cập nhật CV mặc định thành công!", { id: toastId });
        } catch {
            toast.error("⚠️ Lỗi khi tải CV lên. Vui lòng thử lại!", { id: toastId });
        } finally {
            e.target.value = null;
        }
    };

    const handleAiParseCv = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            toast.error("Chỉ chấp nhận tệp PDF!");
            e.target.value = null;
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Tệp CV tối đa 5MB.");
            e.target.value = null;
            return;
        }
        setIsParsingCv(true);
        const toastId = toast.loading("AI đang đọc và bóc tách CV của bạn... ✨");
        try {
            const fd = new FormData();
            fd.append('file', file);
            const parsed = await axiosClient.post(`${API_URLS.CANDIDATE}/me/parse-cv`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const parsedCvUrl = parsed.cvUrl || parsed.CVUrl;
            if (parsedCvUrl) {
                setFormData((prev) => ({ ...prev, candidate: { ...prev.candidate, cvUrl: parsedCvUrl } }));
            }
            toast.success("✨ AI đã bóc tách xong! Hãy kiểm tra và lưu thông tin.", { id: toastId });
            onParsedCv?.(parsed);
        } catch (err) {
            const storedUrl = err.response?.data?.cvUrl;
            if (storedUrl) {
                setFormData((prev) => ({ ...prev, candidate: { ...prev.candidate, cvUrl: storedUrl } }));
            }
            toast.error(err.response?.data?.message || "⚠️ Không thể bóc tách CV lúc này.", { id: toastId });
        } finally {
            setIsParsingCv(false);
            e.target.value = null;
        }
    };

    const handleViewCurrentCv = async () => {
        const rawCvPath = formData.candidate?.cvUrl;
        if (!rawCvPath) return;
        const toastId = toast.loading("Đang mở CV...");
        try {
            const data = await axiosClient.get(`${API_URLS.FILES_CV_SIGNED_URL}?cvPath=${encodeURIComponent(rawCvPath)}`);
            const signedUrl = data?.signedUrl || rawCvPath;
            const finalUrl = signedUrl.startsWith('/') ? `${HUB_BASE_URL}${signedUrl}` : signedUrl;
            toast.dismiss(toastId);
            window.open(finalUrl, '_blank', 'noopener,noreferrer');
        } catch (err) {
            toast.error(err.response?.data?.message || "Không thể mở tệp CV lúc này.", { id: toastId });
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm p-8 mb-6 border-t-8 border-olive">
            <h3 className="text-xl font-bold text-olive mb-6 pb-3 border-b border-gray-100">
                📝 Thông tin cá nhân
            </h3>

            <div className="space-y-5">
                <InputField label="Họ và tên" name="fullName" value={formData.fullName || ''} onChange={handleInputChange} error={errors.fullName} required />

                {formData.role === 'Candidate' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <SelectField
                                label="Giới tính" name="gender" value={formData.candidate?.gender || ''} onChange={handleInputChange}
                                options={[{ label: 'Nam', value: 'Nam' }, { label: 'Nữ', value: 'Nữ' }, { label: 'Khác', value: 'Khác' }]}
                            />
                            <InputField label="Ngày sinh" name="birthday" type="date" value={formData.candidate?.birthday ? formData.candidate.birthday.split('T')[0] : ''} onChange={handleInputChange} error={errors.birthday} />
                            <InputField label="Điện thoại" name="phone" value={formData.candidate?.phone || ''} onChange={handleInputChange} error={errors.phone} />
                            <InputField label="Địa chỉ" name="address" value={formData.candidate?.address || ''} onChange={handleInputChange} error={errors.address} />
                        </div>

                        <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 mt-6 pt-6 border-t border-dashed border-gray-200">
                            <p className="w-32 font-medium text-olive mt-2">📄 CV Mặc định:</p>
                            <div className="flex-1 space-y-3">
                                {formData.candidate?.cvUrl ? (
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={handleViewCurrentCv} className="text-blue-500 hover:text-blue-700 font-medium underline cursor-pointer">Xem CV hiện tại</button>
                                        <span className="text-green-500 text-sm font-bold">✅ Đã tải lên</span>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm italic">Bạn chưa có CV mặc định.</p>
                                )}

                                <div className="flex flex-wrap gap-3">
                                    <label className={`px-4 py-2 rounded-full text-sm font-bold cursor-pointer transition-all inline-flex items-center gap-2 ${isParsingCv ? 'bg-gray-200 text-gray-500' : 'bg-olive text-white hover:bg-earth shadow-sm'}`}>
                                        ✨ {isParsingCv ? 'AI đang bóc tách CV...' : 'Tải CV & AI Tự động điền'}
                                        <input type="file" accept=".pdf" id="aiCvUpload" disabled={isParsingCv} className="hidden" onChange={handleAiParseCv} />
                                    </label>
                                    <label className="px-4 py-2 rounded-full text-sm font-semibold bg-cream text-olive hover:bg-olive hover:text-white transition-all cursor-pointer border border-olive/20">
                                        📄 Chỉ tải CV thường
                                        <input type="file" accept=".pdf" id="cvUpload" disabled={isParsingCv} className="hidden" onChange={handleCvUpload} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {formData.role === 'Recruiter' && (
                    <>
                        <InputField label="Chức vụ" name="position" value={formData.recruiter?.position || ''} onChange={handleInputChange} />
                        <RecruiterCompanyTransfer currentCompanyName={formData.recruiter?.company?.companyName} />
                    </>
                )}
            </div>
        </div>
    );
}

export default EditProfileForm;
