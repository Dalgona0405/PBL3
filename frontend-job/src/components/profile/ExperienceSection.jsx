import React, { useState, useEffect } from 'react';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import InputField from '../ui/InputField';
import Button from '../ui/Button';

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
        setEditId(exp.expId);
        setShowForm(true);
    };

    // 5. XÓA KINH NGHIỆM (DELETE)
    const handleDelete = async (expId) => {
        if (!window.confirm("Bạn có chắc muốn xóa kinh nghiệm này không? 🌿")) return;
        try {
            await axiosClient.delete(`${API_URLS.CANDIDATE_EXP}/${expId}`);
            toast.success("🎉 Đã xóa kinh nghiệm thành công!");
            setExperiences(experiences.filter(e => e.expId !== expId));
        } catch (error) {
            toast.error("⚠️ Không thể xóa. Vui lòng thử lại!");
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm p-8 mt-8 border-t-8 border-olive">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
                <h3 className="text-xl font-bold text-olive">💼 Kinh nghiệm làm việc</h3>
                {!showForm && (
                    <button
                        onClick={() => {
                            setFormData({ jobTitle: '', companyName: '', startDate: '', endDate: '', description: '' });
                            setEditId(null);
                            setShowForm(true);
                        }}
                        className="bg-olive hover:bg-earth text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-sm"
                    >
                        + Thêm kinh nghiệm
                    </button>
                )}
            </div>

            {/* KHU VỰC HIỂN THỊ FORM (Chỉ hiện khi showForm = true) */}
            {showForm ? (
                <form onSubmit={handleSave} className="bg-cream p-6 rounded-2xl border border-gray-200 mb-6 animate-fade-in-up">
                    
                    {/* DÙNG LEGO CHO CÁC Ô INPUT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <InputField 
                            label="Chức danh / Vị trí"
                            name="jobTitle"
                            placeholder="VD: Frontend Developer"
                            value={formData.jobTitle}
                            onChange={handleChange}
                            required={true}
                        />
                        <InputField 
                            label="Tên công ty"
                            name="companyName"
                            placeholder="VD: Vulcan Labs"
                            value={formData.companyName}
                            onChange={handleChange}
                            required={true}
                        />
                        <InputField 
                            label="Ngày bắt đầu"
                            name="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={handleChange}
                            required={true}
                        />
                        <InputField 
                            label="Ngày kết thúc (Để trống nếu đang làm)"
                            name="endDate"
                            type="date"
                            value={formData.endDate}
                            onChange={handleChange}
                        />
                    </div>

                    {/* TEXTAREA GIỮ NGUYÊN */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả công việc</label>
                        <textarea name="description" rows="3" value={formData.description} onChange={handleChange} placeholder="Mô tả ngắn gọn những việc bạn đã làm và thành tựu đạt được..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth outline-none bg-white resize-none"></textarea>
                    </div>

                    {/* NÚT BẤM */}
                    <div className="flex justify-end items-center gap-3">
                        <button type="button" onClick={() => setShowForm(false)} className="px-5 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                            Hủy bỏ
                        </button>
                        <div className="w-auto">
                            <Button type="submit">
                                {editId ? '💾 Lưu cập nhật' : '✨ Thêm mới'}
                            </Button>
                        </div>
                    </div>
                </form>
            ) : null}

            {/* KHU VỰC HIỂN THỊ DANH SÁCH KINH NGHIỆM (Giữ nguyên) */}
            {isLoading ? (
                <div className="text-center text-gray-400 animate-pulse py-4">Đang tải kinh nghiệm... 🌿</div>
            ) : experiences.length === 0 && !showForm ? (
                <div className="text-center text-gray-400 italic py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    Bạn chưa cập nhật kinh nghiệm làm việc nào.
                </div>
            ) : (
                <div className="space-y-4">
                    {experiences.map((exp) => {
                        const expId = exp.expId;;
                        return (
                            <div key={expId} className="group relative bg-white border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border-l-8 border-olive">
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

export default ExperienceSection;