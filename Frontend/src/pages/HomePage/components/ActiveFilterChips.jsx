import React from 'react';

function ActiveFilterChips({ filters, locations, tags, onRemoveFilter, onReset }) {
    if (!filters) return null;

    const chips = [];
    if (filters.keyword) chips.push({ label: `Từ khóa: "${filters.keyword}"`, keys: ['keyword'] });

    if (filters.locationId) {
        const loc = locations.find((l) => String(l.locationId) === String(filters.locationId));
        chips.push({ label: `📍 ${loc?.locationName || `Khu vực #${filters.locationId}`}`, keys: ['locationId'] });
    }

    if (filters.tagId) {
        const tag = tags.find((t) => String(t.tagId) === String(filters.tagId));
        chips.push({ label: `🏷️ ${tag?.tagName || `Kỹ năng #${filters.tagId}`}`, keys: ['tagId'] });
    }

    if (filters.minSalary || filters.maxSalary) {
        const salaryLabel = filters.minSalary && !filters.maxSalary
            ? `Từ ${filters.minSalary} triệu`
            : `${filters.minSalary || 0} - ${filters.maxSalary} triệu`;
        chips.push({ label: `💰 ${salaryLabel}`, keys: ['minSalary', 'maxSalary'] });
    }

    if (filters.level) chips.push({ label: `🎓 ${filters.level}`, keys: ['level'] });
    if (filters.expYear) chips.push({ label: `⏳ ${filters.expYear}`, keys: ['expYear'] });

    if (chips.length === 0) return null;

    return (
        <div className="w-full max-w-5xl flex flex-wrap items-center gap-2 mt-4">
            <span className="text-xs font-bold text-gray-500">Đang lọc:</span>
            {chips.map((chip) => (
                <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 bg-cream text-olive px-3 py-1 rounded-full text-xs font-bold border border-gray-200"
                >
                    {chip.label}
                    <button
                        type="button"
                        onClick={() => onRemoveFilter(chip.keys)}
                        className="text-red-400 hover:text-red-600 font-bold ml-1"
                        title="Xóa bộ lọc này"
                    >
                        ×
                    </button>
                </span>
            ))}
            <button
                type="button"
                onClick={onReset}
                className="text-xs font-semibold text-gray-400 hover:text-red-500 ml-1 underline"
            >
                Xóa hết
            </button>
        </div>
    );
}

export default ActiveFilterChips;
