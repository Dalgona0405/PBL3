import React from 'react';
import Button from '../../../components/ui/Button';

function JobDetailAndTagsSection({
    formData,
    onChange,
    selectedTags,
    tagKeyword,
    onTagKeywordChange,
    tagSuggestions,
    isSuggesting,
    showTagDropdown,
    onSetShowTagDropdown,
    onSelectTag,
    onRemoveTag,
    isEditMode,
    isSaving
}) {
    return (
        <div className="lg:col-span-2 space-y-6 bg-white p-8 rounded-3xl shadow-sm border-t-8 border-olive">
            <h3 className="text-xl font-bold text-olive border-b border-gray-100 pb-3">Chi tiết công việc</h3>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả công việc</label>
                <textarea
                    name="description"
                    rows="5"
                    value={formData.description}
                    onChange={onChange}
                    placeholder="Mô tả các công việc ứng viên sẽ làm..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white resize-none"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Yêu cầu ứng viên</label>
                <textarea
                    name="requirement"
                    rows="5"
                    value={formData.requirement}
                    onChange={onChange}
                    placeholder="Các kỹ năng, bằng cấp yêu cầu..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white resize-none"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Quyền lợi</label>
                <textarea
                    name="benefits"
                    rows="4"
                    value={formData.benefits}
                    onChange={onChange}
                    placeholder="Bảo hiểm, du lịch, thưởng..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white resize-none"
                />
            </div>

            <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-bold text-gray-700 mb-3">Thẻ kỹ năng (Tags)</label>

                <div className="relative mb-4">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Gõ tên kỹ năng (VD: React, Java...)"
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all"
                            value={tagKeyword}
                            onChange={(e) => onTagKeywordChange(e.target.value)}
                            onFocus={() => tagSuggestions.length > 0 && onSetShowTagDropdown(true)}
                            onBlur={() => setTimeout(() => onSetShowTagDropdown(false), 200)}
                        />
                    </div>

                    {showTagDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                            {isSuggesting ? (
                                <div className="p-3 text-sm text-gray-500 text-center">Đang tìm... 🌿</div>
                            ) : tagSuggestions.length > 0 ? (
                                tagSuggestions.map(tag => (
                                    <div
                                        key={tag.tagId}
                                        className="px-4 py-3 hover:bg-cream cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            onSelectTag(tag);
                                        }}
                                    >
                                        <span className="font-bold text-olive">{tag.tagName}</span>
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{tag.type}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 text-sm text-gray-500 text-center">Không tìm thấy kỹ năng phù hợp.</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-3">
                    {selectedTags.length > 0 ? (
                        selectedTags.map((tag) => (
                            <span key={tag.tagId} className="inline-flex items-center bg-cream text-olive px-4 py-2 rounded-full text-sm font-medium border border-gray-200 shadow-sm">
                                {tag.tagName}
                                <button
                                    type="button"
                                    className="ml-2 text-red-400 hover:text-red-600 font-bold text-lg leading-none focus:outline-none transform hover:scale-110 transition-transform"
                                    onClick={() => onRemoveTag(tag.tagId)}
                                >
                                    &times;
                                </button>
                            </span>
                        ))
                    ) : (
                        <p className="text-gray-400 italic text-sm">Chưa chọn kỹ năng nào.</p>
                    )}
                </div>
            </div>

            <div className="pt-8 flex justify-end">
                <div className="w-full md:w-auto">
                    <Button type="submit" isLoading={isSaving}>
                        {isEditMode ? '💾 Lưu cập nhật' : '🚀 Đăng tin ngay'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default JobDetailAndTagsSection;
