import React from 'react';

function ApplicationFilterBar({
    filters,
    availableSkills,
    viewMode,
    onViewModeChange,
    onFilterChange,
    onResetFilters,
    totalCount,
    filteredCount,
}) {
    const hasFilter = Boolean(filters.keyword || filters.skill || filters.minExp || filters.minAiScore);

    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex bg-cream p-1 rounded-xl border border-gray-200">
                    <button
                        type="button"
                        onClick={() => onViewModeChange('kanban')}
                        className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-bold transition-colors ${viewMode === 'kanban' ? 'bg-olive text-white shadow-sm' : 'text-gray-600 hover:text-olive'}`}
                    >
                        📋 Bảng Kanban
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewModeChange('table')}
                        className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-bold transition-colors ${viewMode === 'table' ? 'bg-olive text-white shadow-sm' : 'text-gray-600 hover:text-olive'}`}
                    >
                        📊 Bảng dữ liệu
                    </button>
                </div>

                <span className="text-sm text-gray-500 font-medium bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-100">
                    Hiển thị <strong className="text-olive">{filteredCount}</strong> / {totalCount} hồ sơ
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <input
                    type="text"
                    placeholder="🔍 Tìm tên, email ứng viên..."
                    value={filters.keyword}
                    onChange={(e) => onFilterChange('keyword', e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white text-sm"
                />

                <select
                    value={filters.skill}
                    onChange={(e) => onFilterChange('skill', e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 text-sm text-gray-700 cursor-pointer"
                >
                    <option value="">🧩 Tất cả kỹ năng</option>
                    {availableSkills.map((skill) => (
                        <option key={skill} value={skill}>{skill}</option>
                    ))}
                </select>

                <select
                    value={filters.minExp}
                    onChange={(e) => onFilterChange('minExp', e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 text-sm text-gray-700 cursor-pointer"
                >
                    <option value="">💼 Mọi kinh nghiệm</option>
                    <option value="1">Từ 1 năm trở lên</option>
                    <option value="2">Từ 2 năm trở lên</option>
                    <option value="3">Từ 3 năm trở lên</option>
                    <option value="5">Từ 5 năm trở lên</option>
                </select>

                <select
                    value={filters.minAiScore}
                    onChange={(e) => onFilterChange('minAiScore', e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 text-sm text-gray-700 cursor-pointer"
                >
                    <option value="">🤖 Mọi điểm AI Match</option>
                    <option value="80">Rất phù hợp (&ge; 80%)</option>
                    <option value="60">Khá phù hợp (&ge; 60%)</option>
                    <option value="under60">Dưới 60%</option>
                </select>

                <button
                    type="button"
                    disabled={!hasFilter}
                    onClick={onResetFilters}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${hasFilter ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'}`}
                >
                    ❌ Xóa lọc
                </button>
            </div>
        </div>
    );
}

export default ApplicationFilterBar;
