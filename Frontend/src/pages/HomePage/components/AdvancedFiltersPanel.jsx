import React from 'react';

const LEVEL_OPTIONS = ['Thực tập sinh', 'Nhân viên', 'Senior', 'Trưởng nhóm / Quản lý'];
const EXP_OPTIONS = ['Không yêu cầu', 'Dưới 1 năm', '1 - 2 năm', '2 - 3 năm', '3 - 5 năm', 'Trên 5 năm'];
const SALARY_OPTIONS = [
    { value: '0-10', label: 'Dưới 10 triệu' },
    { value: '10-20', label: '10 - 20 triệu' },
    { value: '20-30', label: '20 - 30 triệu' },
    { value: '30-50', label: '30 - 50 triệu' },
    { value: '50+', label: 'Trên 50 triệu' }
];

function FilterSelect({ label, value, emptyLabel, onChange, options }) {
    return (
        <div>
            <label className="block text-xs font-bold text-olive mb-1.5">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 text-sm text-gray-700 cursor-pointer"
            >
                <option value="">{emptyLabel}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

function AdvancedFiltersPanel({
    locations,
    tags,
    locationId,
    tagId,
    salaryRange,
    level,
    expYear,
    onFilterChange,
    onReset
}) {
    return (
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-lg border border-gray-100 mt-4 p-6 animate-fade-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <FilterSelect
                    label="📍 Khu vực"
                    value={locationId}
                    emptyLabel="Tất cả địa điểm"
                    onChange={(val) => onFilterChange('locationId', val)}
                    options={locations.map((loc) => ({ value: loc.locationId, label: loc.locationName }))}
                />
                <FilterSelect
                    label="🧩 Kỹ năng (Tag)"
                    value={tagId}
                    emptyLabel="Tất cả kỹ năng"
                    onChange={(val) => onFilterChange('tagId', val)}
                    options={tags.map((tag) => ({ value: tag.tagId, label: tag.tagName }))}
                />
                <FilterSelect
                    label="💰 Mức lương"
                    value={salaryRange}
                    emptyLabel="Mọi mức lương"
                    onChange={(val) => onFilterChange('salaryRange', val)}
                    options={SALARY_OPTIONS}
                />
                <FilterSelect
                    label="🎓 Cấp bậc"
                    value={level}
                    emptyLabel="Tất cả cấp bậc"
                    onChange={(val) => onFilterChange('level', val)}
                    options={LEVEL_OPTIONS.map((v) => ({ value: v, label: v }))}
                />
                <FilterSelect
                    label="⏳ Kinh nghiệm"
                    value={expYear}
                    emptyLabel="Tất cả kinh nghiệm"
                    onChange={(val) => onFilterChange('expYear', val)}
                    options={EXP_OPTIONS.map((v) => ({ value: v, label: v }))}
                />
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
                <button type="button" onClick={onReset} className="text-gray-400 hover:text-red-500 font-medium text-sm transition-colors">
                    ❌ Xóa tất cả bộ lọc
                </button>
            </div>
        </div>
    );
}

export default AdvancedFiltersPanel;
