import React from 'react';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import Button from '../../../components/ui/Button';

const TAG_TYPE_OPTIONS = [
    { label: 'Kỹ năng chuyên môn', value: 'Skill' },
    { label: 'Ngoại ngữ', value: 'Language' },
    { label: 'Phúc lợi', value: 'Benefit' },
    { label: 'Vai trò', value: 'Role' },
    { label: 'Kinh nghiệm', value: 'Experience' },
    { label: 'Lĩnh vực', value: 'Domain' },
    { label: 'Nhân khẩu học', value: 'Demographic' }
];

function TagForm({ formData, editingId, isSaving, onChange, onSave, onCancelEdit }) {
    return (
        <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth sticky top-8">
                <h3 className="text-xl font-bold text-olive mb-4">
                    {editingId ? '✏️ Sửa Kỹ năng' : '✨ Thêm Kỹ năng mới'}
                </h3>
                <form onSubmit={onSave} className="space-y-5">
                    <InputField
                        label="Tên kỹ năng"
                        name="tagName"
                        placeholder="VD: ReactJS, Java..."
                        value={formData.tagName}
                        onChange={onChange}
                        required={true}
                    />

                    <SelectField
                        label="Phân loại"
                        name="type"
                        value={formData.type}
                        onChange={onChange}
                        options={TAG_TYPE_OPTIONS}
                    />

                    <div className="flex gap-2 pt-2">
                        {editingId && (
                            <button
                                type="button"
                                onClick={onCancelEdit}
                                className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                            >
                                Hủy
                            </button>
                        )}

                        <div className="flex-1">
                            <Button type="submit" isLoading={isSaving}>
                                Lưu lại
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TagForm;
