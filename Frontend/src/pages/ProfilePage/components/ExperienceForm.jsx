import React from 'react';
import InputField from '../../../components/ui/InputField';
import Button from '../../../components/ui/Button';

function ExperienceForm({ formData, editId, onChange, onSave, onCancel }) {
    return (
        <form onSubmit={onSave} className="bg-cream p-6 rounded-2xl border border-gray-200 mb-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <InputField
                    label="Chức danh / Vị trí"
                    name="jobTitle"
                    placeholder="VD: Frontend Developer"
                    value={formData.jobTitle}
                    onChange={onChange}
                    required={true}
                />
                <InputField
                    label="Tên công ty"
                    name="companyName"
                    placeholder="VD: Vulcan Labs"
                    value={formData.companyName}
                    onChange={onChange}
                    required={true}
                />
                <InputField
                    label="Ngày bắt đầu"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={onChange}
                    required={true}
                />
                <InputField
                    label="Ngày kết thúc (Để trống nếu đang làm)"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={onChange}
                />
            </div>

            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả công việc</label>
                <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={onChange}
                    placeholder="Mô tả ngắn gọn những việc bạn đã làm và thành tựu đạt được..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth outline-none bg-white resize-none"
                ></textarea>
            </div>

            <div className="flex justify-end items-center gap-3">
                <button type="button" onClick={onCancel} className="px-5 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                    Hủy bỏ
                </button>
                <div className="w-auto">
                    <Button type="submit">
                        {editId ? '💾 Lưu cập nhật' : '✨ Thêm mới'}
                    </Button>
                </div>
            </div>
        </form>
    );
}

export default ExperienceForm;
