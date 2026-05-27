import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

// COMPONENT CON: FORM SỬA THÔNG TIN
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

// =================================================================
// COMPONENT CON: QUẢN LÝ KINH NGHIỆM LÀM VIỆC (Dành riêng cho Candidate)
// =================================================================
function ExperienceSection({ userId }) {
    const [experiences, setExperiences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // State cho Form (Thêm/Sửa)
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        jobTitle: '', companyName: '', startDate: '', endDate: '', description: ''
    });

    // 1. LẤY DANH SÁCH KINH NGHIỆM (READ)
    const fetchExperiences = async () => {
        try {
            setIsLoading(true);
            // Gọi API lấy kinh nghiệm của user hiện tại
            const data = await axiosClient.get(`${API_URLS.CANDIDATE}/${userId}/experiences`);
            setExperiences(data || []);
        } catch (error) {
            console.error("Lỗi lấy kinh nghiệm:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchExperiences();
    }, [userId]);

    // 2. XỬ LÝ NHẬP LIỆU FORM
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 3. LƯU KINH NGHIỆM (CREATE / UPDATE)
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Gói hàng gửi cho Backend (C# yêu cầu có userId)
            const payload = {
                userId: userId,
                jobTitle: formData.jobTitle,
                companyName: formData.companyName,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                description: formData.description
            };

            if (editId) {
                // Nếu có editId -> Gọi API Sửa (PUT)
                await axiosClient.put(`${API_URLS.CANDIDATE_EXP}/${editId}`, payload);
                toast.success("🎉 Đã cập nhật kinh nghiệm thành công!");
            } else {
                // Nếu không có editId -> Gọi API Thêm mới (POST)
                await axiosClient.post(API_URLS.CANDIDATE_EXP, payload);
                toast.success("🎉 Đã thêm kinh nghiệm mới!");
            }

            // Reset form và tải lại danh sách
            setShowForm(false);
            setEditId(null);
            setFormData({ jobTitle: '', companyName: '', startDate: '', endDate: '', description: '' });
            fetchExperiences();

        } catch (error) {
            toast.error("⚠️ Có lỗi xảy ra khi lưu. Vui lòng kiểm tra lại!");
        }
    };

    // 4. MỞ FORM ĐỂ SỬA
    const handleEdit = (exp) => {
        setFormData({
            jobTitle: exp.jobTitle || '',
            companyName: exp.companyName || '',
            // Cắt chuỗi ngày giờ của C# (VD: 2023-01-01T00:00:00 -> 2023-01-01) để bỏ vào thẻ <input type="date">
            startDate: exp.startDate ? exp.startDate.split('T')[0] : '',
            endDate: exp.endDate ? exp.endDate.split('T')[0] : '',
            description: exp.description || ''
        });
        setEditId(exp.id || exp.experienceId); // Tùy Backend trả về id hay experienceId
        setShowForm(true);
    };

    // 5. XÓA KINH NGHIỆM (DELETE)
    const handleDelete = async (expId) => {
        if (!window.confirm("Bạn có chắc muốn xóa kinh nghiệm này không? 🌿")) return;
        try {
            await axiosClient.delete(`${API_URLS.CANDIDATE_EXP}/${expId}`);
            toast.success("🎉 Đã xóa kinh nghiệm thành công!");
            setExperiences(experiences.filter(e => (e.id || e.experienceId) !== expId));
        } catch (error) {
            toast.error("⚠️ Không thể xóa. Vui lòng thử lại!");
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm p-8 mt-8">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
                <h3 className="text-xl font-bold text-olive">💼 Kinh nghiệm làm việc</h3>
                {!showForm && (
                    <button
                        onClick={() => {
                            setFormData({ jobTitle: '', companyName: '', startDate: '', endDate: '', description: '' });
                            setEditId(null);
                            setShowForm(true);
                        }}
                        className="bg-earth hover:bg-olive text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-sm"
                    >
                        + Thêm kinh nghiệm
                    </button>
                )}
            </div>

            {/* KHU VỰC HIỂN THỊ FORM (Chỉ hiện khi showForm = true) */}
            {showForm ? (
                <form onSubmit={handleSave} className="bg-cream p-6 rounded-2xl border border-gray-200 mb-6 animate-fade-in-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Chức danh / Vị trí <span className="text-red-500">*</span></label>
                            <input type="text" name="jobTitle" required value={formData.jobTitle} onChange={handleChange} placeholder="VD: Frontend Developer" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Tên công ty <span className="text-red-500">*</span></label>
                            <input type="text" name="companyName" required value={formData.companyName} onChange={handleChange} placeholder="VD: Vulcan Labs" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Ngày bắt đầu <span className="text-red-500">*</span></label>
                            <input type="date" name="startDate" required value={formData.startDate} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Ngày kết thúc (Để trống nếu đang làm)</label>
                            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-white" />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả công việc</label>
                        <textarea name="description" rows="3" value={formData.description} onChange={handleChange} placeholder="Mô tả ngắn gọn những việc bạn đã làm và thành tựu đạt được..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth outline-none bg-white resize-none"></textarea>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                            Hủy bỏ
                        </button>
                        <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-earth hover:bg-olive transition-colors shadow-md">
                            {editId ? '💾 Lưu cập nhật' : '✨ Thêm mới'}
                        </button>
                    </div>
                </form>
            ) : null}

            {/* KHU VỰC HIỂN THỊ DANH SÁCH KINH NGHIỆM */}
            {isLoading ? (
                <div className="text-center text-gray-400 animate-pulse py-4">Đang tải kinh nghiệm... 🌿</div>
            ) : experiences.length === 0 && !showForm ? (
                <div className="text-center text-gray-400 italic py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    Bạn chưa cập nhật kinh nghiệm làm việc nào.
                </div>
            ) : (
                <div className="space-y-4">
                    {experiences.map((exp) => {
                        const expId = exp.id || exp.experienceId;
                        return (
                            <div key={expId} className="group relative bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border-l-8 border-earth">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-lg font-bold text-textmain">{exp.jobTitle}</h4>
                                        <p className="text-olive font-medium mb-2">🏢 {exp.companyName}</p>
                                        <p className="text-sm text-gray-500 mb-3 bg-gray-50 inline-block px-3 py-1 rounded-lg border border-gray-100">
                                            📅 {exp.startDate ? new Date(exp.startDate).toLocaleDateString('vi-VN') : '...'} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString('vi-VN') : 'Hiện tại'}
                                        </p>
                                        {exp.description && (
                                            <p className="text-gray-600 text-sm whitespace-pre-line">{exp.description}</p>
                                        )}
                                    </div>

                                    {/* Nút Sửa/Xóa (Chỉ hiện khi hover chuột vào) */}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(exp)} className="bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white p-2 rounded-lg transition-colors" title="Sửa">
                                            ✏️
                                        </button>
                                        <button onClick={() => handleDelete(expId)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-colors" title="Xóa">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// COMPONENT CON: ĐỔI MẬT KHẨU (Dùng chung cho mọi Role)
function ChangePasswordForm({ userId }) {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 1. Validate Frontend (Đỡ tốn công anh bồi bàn chạy xuống bếp)
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("⚠️ Mật khẩu mới và xác nhận không khớp nhau nha Trúc ơi!");
            return;
        }
        if (formData.newPassword.length < 6) {
            toast.error("⚠️ Mật khẩu mới phải có ít nhất 6 ký tự cho an toàn nhé!");
            return;
        }

        // 2. Gọi API
        setIsLoading(true);
        try {
            await axiosClient.put(`${API_URLS.USERS}/${userId}/change-password`, {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            });
            
            toast.success("🎉 Đổi mật khẩu thành công! Lần đăng nhập sau nhớ dùng mật khẩu mới nha.");
            // Xóa trắng form sau khi đổi thành công
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            const msg = error.response?.data?.message || "Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra.";
            toast.error(`⚠️ Lỗi: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm p-8 mt-8 border-t-8 border-gray-200">
            <h3 className="text-xl font-bold text-gray-700 mb-6 pb-3 border-b border-gray-100 flex items-center gap-2">
                🔒 Đổi mật khẩu
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">Mật khẩu hiện tại <span className="text-red-500">*</span></label>
                    <input 
                        type="password" name="currentPassword" required 
                        value={formData.currentPassword} onChange={handleChange} 
                        placeholder="Nhập mật khẩu đang dùng..." 
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">Mật khẩu mới <span className="text-red-500">*</span></label>
                    <input 
                        type="password" name="newPassword" required 
                        value={formData.newPassword} onChange={handleChange} 
                        placeholder="Ít nhất 6 ký tự..." 
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">Xác nhận mật khẩu mới <span className="text-red-500">*</span></label>
                    <input 
                        type="password" name="confirmPassword" required 
                        value={formData.confirmPassword} onChange={handleChange} 
                        placeholder="Nhập lại mật khẩu mới..." 
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all" 
                    />
                </div>
                
                <div className="pt-2">
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-md transition-all ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-900 hover:-translate-y-0.5'}`}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// COMPONENT CHÍNH: PROFILE PAGE
function ProfilePage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);
    const [allTags, setAllTags] = useState([]);
    const [userTags, setUserTags] = useState([]);
    const [selectedTagId, setSelectedTagId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {

        if (!user) { navigate('/login'); return; }

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [profileRes, allTagsRes] = await Promise.all([
                    axiosClient.get(`${API_URLS.USERS}/profile`),
                    axiosClient.get(`${API_URLS.TAGS}`)
                ]);

                const profileData = profileRes;
                const allTagsData = allTagsRes || [];

                if (profileData.role === 'Candidate') {
                    const [userTagsRes, candidateRes] = await Promise.all([
                        axiosClient.get(`${API_URLS.CANDIDATE}/${user.id}/skills`),
                        axiosClient.get(`${API_URLS.CANDIDATE}/me`)
                    ]);

                    setUserTags(userTagsRes || []);
                    profileData.candidate = candidateRes;
                }
                else if (profileData.role === 'Recruiter') {
                    profileData.recruiter = await axiosClient.get(`${API_URLS.RECRUITERS}/${user.id}`);
                }

                setFormData(profileData);
                setAllTags(allTagsData);

            } catch (err) {
                setError("Hệ thống đang bảo trì. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handleAddSkill = () => {
        if (!selectedTagId) return;
        if (userTags.some(t => t.tagId === parseInt(selectedTagId))) {
            toast.error("Bạn đã có kỹ năng này rồi nhé!");
            return;
        }

        const tagToAdd = allTags.find(t => t.tagId === parseInt(selectedTagId));
        if (tagToAdd) {
            setUserTags([...userTags, { tagId: tagToAdd.tagId, tagName: tagToAdd.tagName, proficiency: "Beginner" }]);
            setSelectedTagId('');
        }
    };

    const handleRemoveSkill = (tagId) => {
        setUserTags(userTags.filter(t => t.tagId !== tagId));
        toast.success("Kỹ năng đã được xóa!");
    };

    const handleSave = async () => {
        try {
            const apiCalls = [];
            if (formData.role === 'Candidate') {
                const payloadCandidate = {
                    fullName: formData.fullName,
                    gender: formData.candidate?.gender,
                    birthday: formData.candidate?.birthday,
                    phone: formData.candidate?.phone,
                    address: formData.candidate?.address
                };
                const payloadSkills = userTags.map(t => ({
                    tagId: t.tagId,
                    proficiency: t.proficiency || "Beginner"
                }));

                apiCalls.push(
                    axiosClient.put(`${API_URLS.CANDIDATE}/me`, payloadCandidate),
                    axiosClient.put(`${API_URLS.CANDIDATE_TAGS}`, payloadSkills)
                );

            }

            else if (formData.role === 'Recruiter') {
                const payloadRecruiter = {
                    fullName: formData.fullName,
                    position: formData.recruiter?.position,
                    companyId: formData.recruiter?.companyId
                };

                apiCalls.push(
                    axiosClient.put(`${API_URLS.RECRUITERS}/${user.id}`, payloadRecruiter)
                );
            }

            const responses = await Promise.all(apiCalls);
            toast.success("🎉 Đã lưu thông tin thành công! 🌿");
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Có lỗi xảy ra khi lưu thông tin.";
            toast.error(errorMessage);
        }
    };
    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải hồ sơ của bạn... 🌿</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            <div className="flex justify-end mb-6">
                <button
                    className="bg-earth hover:bg-olive text-white font-bold py-2.5 px-6 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2"
                    onClick={handleSave}
                >
                    💾 Lưu thay đổi
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white rounded-3xl shadow-sm border-t-8 border-olive p-8 flex flex-col items-center text-center h-fit">
                    <div className="w-32 h-32 rounded-full bg-cream border-4 border-earth flex items-center justify-center overflow-hidden mb-6 shadow-inner">
                        {formData.avatar ? (
                            <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-5xl">👩‍💻</span>
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-textmain mb-3">
                        {formData.fullName || "Người dùng ẩn danh"}
                    </h2>
                    <span className="bg-earth text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                        {formData.role === 'Candidate' ? 'Ứng Viên' : 'Nhà Tuyển Dụng'}
                    </span>
                </div>

                <div className="lg:col-span-2">
                    <EditProfileForm formData={formData} setFormData={setFormData} />

                    {formData.role === 'Candidate' && (
                        <>
                            <div className="bg-white rounded-3xl shadow-sm p-8">
                                <h3 className="text-xl font-bold text-olive mb-6 pb-3 border-b border-gray-100">
                                    🧩 Kỹ năng chuyên môn
                                </h3>
                                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                    <select
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50"
                                        value={selectedTagId}
                                        onChange={(e) => setSelectedTagId(e.target.value)}
                                    >
                                        <option value="">-- Chọn kỹ năng muốn thêm --</option>
                                        {allTags.map(tag => (
                                            <option key={tag.tagId} value={tag.tagId}>{tag.tagName}</option>
                                        ))}
                                    </select>
                                    <button
                                        className="bg-olive hover:bg-earth text-white font-bold py-2.5 px-6 rounded-xl transition-colors"
                                        onClick={handleAddSkill}
                                    >
                                        + Thêm
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {userTags.length > 0 ? (
                                        userTags.map((tag) => (
                                            <span key={tag.tagId} className="inline-flex items-center bg-cream text-olive px-4 py-2 rounded-full text-sm font-medium border border-gray-200 shadow-sm">
                                                {tag.tagName}
                                                <button
                                                    className="ml-2 text-red-400 hover:text-red-600 font-bold text-lg leading-none focus:outline-none transform hover:scale-110 transition-transform"
                                                    onClick={() => handleRemoveSkill(tag.tagId)}
                                                    title="Xóa kỹ năng này"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-gray-400 italic w-full text-center py-4">
                                            Chưa cập nhật kỹ năng. Hãy thêm kỹ năng để tìm được công việc phù hợp nhé! 🌿
                                        </p>
                                    )}
                                </div>
                            </div>
                            <ExperienceSection userId={user.id} />
                        </>
                    )}
                    <ChangePasswordForm userId={user.id} />
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;