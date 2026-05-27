import React, { useState, useEffect, useRef } from "react";
import { API_URLS } from '../../api/api';
import axiosClient from "../../api/axiosClient";
import toast from "react-hot-toast";

function EditProfileForm({ formData, setFormData }) {
    // State cho Search Company
    const [searchTerm, setSearchTerm] = useState('');
    const [companyResults, setCompanyResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedNewCompany, setSelectedNewCompany] = useState(null); // Lưu công ty vừa chọn để gửi request
    const [isSendingRequest, setIsSendingRequest] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchCompany = async (keyword) => {
        setSearchTerm(keyword);
        setSelectedNewCompany(null); // Reset công ty đã chọn nếu user gõ lại
        if (keyword.length < 2) {
            setCompanyResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        setShowDropdown(true);
        try {
            const data = await axiosClient.get(`${API_URLS.COMPANIES}/search?keyword=${encodeURIComponent(keyword)}`);
            setCompanyResults(data.items || data.Items || []);
        } catch (err) {
            console.error("Lỗi tìm công ty:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectCompany = (company) => {
        setSearchTerm(company.companyName);
        setSelectedNewCompany(company); // Lưu lại để hiện nút "Gửi yêu cầu"
        setShowDropdown(false);
    };

    // HÀM MỚI: GỬI YÊU CẦU GIA NHẬP CÔNG TY
    const handleSendCompanyRequest = async () => {
        if (!selectedNewCompany) return;
        setIsSendingRequest(true);

        try {
            const payload = {
                companyId: selectedNewCompany.companyId,
            };

            const data = await axiosClient.post(API_URLS.COMPANY_REQUESTS, payload);
            setSelectedNewCompany(null);
            setSearchTerm('');
            toast.success("⚠️ " + data.message);
        } catch (err) {
            const errorMessage = err.response?.data?.message || "⚠️ Có lỗi xảy ra khi gửi yêu cầu.";
            toast.error(errorMessage);
        } finally {
            setIsSendingRequest(false);
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        if (id === 'fullName') {
            setFormData({ ...formData, [id]: value });
            return;
        }
        if (['gender', 'birthday', 'phone', 'address'].includes(id)) {
            setFormData({ ...formData, candidate: { ...formData.candidate, [id]: value } });
            return;
        }
        if (id === 'position') {
            setFormData({ ...formData, recruiter: { ...formData.recruiter, [id]: value } });
            return;
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm p-8 mb-6">
            <h3 className="text-xl font-bold text-olive mb-6 pb-3 border-b border-gray-100">
                📝 Thông tin cá nhân
            </h3>

            <div className="space-y-5">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <p className="w-32 font-medium text-gray-600">Họ và tên:</p>
                    <input type="text" id="fullName" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white"
                        value={formData.fullName || ''} onChange={handleInputChange} />
                </div>

                {/* FORM CHO CANDIDATE */}
                {formData.role === 'Candidate' && (
                    <>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <p className="w-32 font-medium text-gray-600">⚧️ Giới tính:</p>
                            <select id="gender" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white"
                                value={formData.candidate?.gender || ''} onChange={handleInputChange} >
                                <option value="">-- Chọn giới tính --</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <p className="w-32 font-medium text-gray-600">📞 Điện thoại:</p>
                            <input type="text" id="phone" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white"
                                value={formData.candidate?.phone || ''} onChange={handleInputChange} />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <p className="w-32 font-medium text-gray-600">🏠 Địa chỉ:</p>
                            <input type="text" id="address" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white"
                                value={formData.candidate?.address || ''} onChange={handleInputChange} />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <p className="w-32 font-medium text-gray-600">🎂 Sinh nhật:</p>
                            <input type="date" id="birthday" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white"
                                value={formData.candidate?.birthday ? formData.candidate.birthday.split('T')[0] : ''} onChange={handleInputChange} />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 mt-6 pt-6 border-t border-dashed border-gray-200">
                            <p className="w-32 font-medium text-olive mt-2">📄 CV Mặc định:</p>
                            <div className="flex-1">
                                {formData.candidate?.cvUrl ? (
                                    <div className="mb-3 flex items-center gap-3">
                                        <a href={formData.candidate.cvUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 font-medium underline">
                                            Xem CV hiện tại
                                        </a>
                                        <span className="text-green-500 text-sm font-bold">✅ Đã tải lên</span>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm mb-3 italic">Bạn chưa có CV mặc định.</p>
                                )}

                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        id="cvUpload"
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cream file:text-olive hover:file:bg-olive hover:file:text-white transition-all cursor-pointer"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            if (file.type !== 'application/pdf') {
                                                toast.error("Chỉ chấp nhận file PDF nha Trúc ơi! 🌿");
                                                e.target.value = null;
                                                return;
                                            }

                                            try {
                                                // 1. Upload file lấy URL
                                                const formDataUpload = new FormData();
                                                formDataUpload.append('file', file);
                                                const uploadRes = await axiosClient.post('/Files/upload', formDataUpload, {
                                                    headers: { 'Content-Type': 'multipart/form-data' }
                                                });
                                                const newCvUrl = uploadRes.url || uploadRes.fileUrl || uploadRes.data || uploadRes;

                                                // 2. Gọi API PATCH Trúc vừa viết để lưu CV mặc định
                                                await axiosClient.patch('/Candidates/me/default-cv', { cvUrl: newCvUrl });

                                                // 3. Cập nhật lại giao diện
                                                setFormData(prev => ({
                                                    ...prev,
                                                    candidate: { ...prev.candidate, cvUrl: newCvUrl }
                                                }));
                                                toast.success("🎉 Cập nhật CV mặc định thành công!");
                                            } catch (err) {
                                                toast.error("⚠️ Lỗi khi tải CV lên. Vui lòng thử lại!");
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* FORM CHO RECRUITER */}
                {formData.role === 'Recruiter' && (
                    <>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <p className="w-32 font-medium text-gray-600">💼 Chức vụ:</p>
                            <input type="text" id="position" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white"
                                value={formData.recruiter?.position || ''} onChange={handleInputChange} />
                        </div>

                        {/* HIỂN THỊ CÔNG TY HIỆN TẠI */}
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <p className="w-32 font-medium text-gray-600">🏢 Công ty hiện tại:</p>
                            <div className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 font-medium">
                                {formData.recruiter?.company?.companyName || "Chưa thuộc công ty nào"}
                            </div>
                        </div>

                        {/* Ô TÌM KIẾM ĐỂ XIN VÀO CÔNG TY MỚI */}
                        <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 relative mt-6 pt-6 border-t border-dashed border-gray-200" ref={dropdownRef}>
                            <p className="w-32 font-medium text-olive mt-3">🔄 Đổi công ty:</p>
                            <div className="flex-1 relative">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Gõ tên công ty muốn gia nhập..."
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white"
                                        value={searchTerm}
                                        onChange={(e) => handleSearchCompany(e.target.value)}
                                        onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
                                    />
                                    {/* Nút gửi yêu cầu chỉ hiện khi đã chọn 1 công ty từ dropdown */}
                                    {selectedNewCompany && (
                                        <button
                                            onClick={handleSendCompanyRequest}
                                            disabled={isSendingRequest}
                                            className="bg-earth hover:bg-olive text-white font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-sm"
                                        >
                                            {isSendingRequest ? 'Đang gửi...' : 'Gửi yêu cầu'}
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown kết quả tìm kiếm */}
                                {showDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        {isSearching ? (
                                            <div className="p-4 text-gray-500 text-center text-sm">Đang tìm kiếm... 🌿</div>
                                        ) : companyResults.length > 0 ? (
                                            companyResults.map(company => (
                                                <div
                                                    key={company.companyId}
                                                    className="p-3 hover:bg-cream cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                                    onClick={() => handleSelectCompany(company)}
                                                >
                                                    <p className="font-bold text-olive">{company.companyName}</p>
                                                    {company.website && <p className="text-xs text-gray-500">{company.website}</p>}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-gray-500 text-center text-sm">Không tìm thấy công ty nào.</div>
                                        )}
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 mt-2 italic">
                                    * Yêu cầu gia nhập sẽ được Admin phê duyệt. Trong lúc chờ, bạn vẫn thuộc công ty cũ.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default EditProfileForm;