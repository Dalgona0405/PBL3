import React from 'react';

function TagListSection({
    tags,
    isLoading,
    searchKeyword,
    onSearchKeywordChange,
    onSearchSubmit,
    onResetSearch,
    onEdit,
    onDelete
}) {
    return (
        <div className="md:col-span-2 flex flex-col gap-4">
            <form onSubmit={onSearchSubmit} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-2">
                <input
                    type="text"
                    placeholder="Nhập tên kỹ năng cần tìm..."
                    value={searchKeyword}
                    onChange={(e) => onSearchKeywordChange(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white"
                />
                <button type="submit" className="bg-olive hover:bg-earth text-white px-6 py-2 rounded-xl font-bold transition-colors">
                    Tìm
                </button>
                {searchKeyword && (
                    <button
                        type="button"
                        onClick={onResetSearch}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold transition-colors"
                    >
                        Xóa lọc
                    </button>
                )}
            </form>

            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-50 flex-1">
                {isLoading ? (
                    <div className="text-center text-olive animate-pulse py-10">Đang tải danh sách... 🌿</div>
                ) : tags.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">Không tìm thấy kỹ năng nào.</div>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {tags.map(tag => (
                            <div key={tag.tagId} className="group flex items-center bg-cream border border-gray-200 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-all">
                                <span className="font-medium text-textmain mr-3">{tag.tagName}</span>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button type="button" onClick={() => onEdit(tag)} className="text-blue-500 hover:text-blue-700" title="Sửa">✏️</button>
                                    <button type="button" onClick={() => onDelete(tag.tagId, tag.tagName)} className="text-red-400 hover:text-red-600" title="Xóa">❌</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TagListSection;
