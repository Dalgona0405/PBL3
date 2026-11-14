import React, { useState, useEffect, useCallback } from 'react';
import { API_URLS } from '../../../api/api';
import axiosClient from '../../../api/axiosClient';
import toast from 'react-hot-toast';
import ExperienceForm from './ExperienceForm';

const INITIAL_FORM = {
    jobTitle: '',
    companyName: '',
    startDate: '',
    endDate: '',
    description: ''
};

function ExperienceSection({ userId }) {
    const [experiences, setExperiences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM);

    const fetchExperiences = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await axiosClient.get(`${API_URLS.CANDIDATE}/${userId}/experiences`);
            setExperiences(data || []);
        } catch (error) {
            console.error("Lỗi lấy kinh nghiệm:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) fetchExperiences();
    }, [userId, fetchExperiences]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                userId,
                jobTitle: formData.jobTitle,
                companyName: formData.companyName,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                description: formData.description
            };

            if (editId) {
                await axiosClient.put(`${API_URLS.CANDIDATE_EXP}/${editId}`, payload);
                toast.success("🎉 Đã cập nhật kinh nghiệm thành công!");
            } else {
                await axiosClient.post(API_URLS.CANDIDATE_EXP, payload);
                toast.success("🎉 Đã thêm kinh nghiệm mới!");
            }

            setShowForm(false);
            setEditId(null);
            setFormData(INITIAL_FORM);
            fetchExperiences();
        } catch {
            toast.error("⚠️ Có lỗi xảy ra khi lưu. Vui lòng kiểm tra lại!");
        }
    };

    const handleEdit = (exp) => {
        setFormData({
            jobTitle: exp.jobTitle || '',
            companyName: exp.companyName || '',
            startDate: exp.startDate ? exp.startDate.split('T')[0] : '',
            endDate: exp.endDate ? exp.endDate.split('T')[0] : '',
            description: exp.description || ''
        });
        setEditId(exp.expId);
        setShowForm(true);
    };

    const handleDelete = async (expId) => {
        if (!window.confirm("Bạn có chắc muốn xóa kinh nghiệm này không?")) return;
        try {
            await axiosClient.delete(`${API_URLS.CANDIDATE_EXP}/${expId}`);
            toast.success("🎉 Đã xóa kinh nghiệm thành công!");
            setExperiences(experiences.filter((e) => e.expId !== expId));
        } catch {
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
                            setFormData(INITIAL_FORM);
                            setEditId(null);
                            setShowForm(true);
                        }}
                        className="bg-olive hover:bg-earth text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-sm"
                    >
                        + Thêm kinh nghiệm
                    </button>
                )}
            </div>

            {showForm && (
                <ExperienceForm
                    formData={formData}
                    editId={editId}
                    onChange={handleChange}
                    onSave={handleSave}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {isLoading ? (
                <div className="text-center text-gray-400 animate-pulse py-4">Đang tải kinh nghiệm... 🌿</div>
            ) : experiences.length === 0 && !showForm ? (
                <div className="text-center text-gray-400 italic py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    Bạn chưa cập nhật kinh nghiệm làm việc nào.
                </div>
            ) : (
                <div className="space-y-4">
                    {experiences.map((exp) => (
                        <div key={exp.expId} className="group relative bg-white border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border-l-8 border-olive">
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
                                    <button onClick={() => handleDelete(exp.expId)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-colors" title="Xóa">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ExperienceSection;
