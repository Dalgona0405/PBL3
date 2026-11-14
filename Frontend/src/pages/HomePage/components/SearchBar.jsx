import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_URLS } from '../../../api/api';
import axiosClient from '../../../api/axiosClient';
import ActiveFilterChips from './ActiveFilterChips';
import AdvancedFiltersPanel from './AdvancedFiltersPanel';

const toSalaryRangeValue = (minSalary, maxSalary) => {
    if (!minSalary && !maxSalary) return '';
    if (String(minSalary) === '50' && !maxSalary) return '50+';
    return `${minSalary || '0'}-${maxSalary || ''}`;
};

const parseSalaryRange = (range) => {
    if (!range) return { minSalary: '', maxSalary: '' };
    if (range.endsWith('+')) return { minSalary: range.replace('+', ''), maxSalary: '' };
    const [minSalary = '', maxSalary = ''] = range.split('-');
    return { minSalary, maxSalary };
};

function SearchBar({ filters, onSearch, onRemoveFilter, onReset }) {
    const [keyword, setKeyword] = useState(filters?.keyword || '');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const { data: locations = [] } = useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            const locData = await axiosClient.get(API_URLS.LOCATION);
            return Array.isArray(locData) ? locData : (locData?.items || []);
        },
        staleTime: 5 * 60 * 1000
    });

    const { data: tags = [] } = useQuery({
        queryKey: ['tags'],
        queryFn: async () => {
            const tagData = await axiosClient.get(API_URLS.TAGS);
            return Array.isArray(tagData) ? tagData : (tagData?.items || []);
        },
        staleTime: 5 * 60 * 1000
    });

    const locationId = filters?.locationId || '';
    const tagId = filters?.tagId || '';
    const salaryRange = toSalaryRangeValue(filters?.minSalary, filters?.maxSalary);
    const level = filters?.level || '';
    const expYear = filters?.expYear || '';

    const triggerSearch = (overrides = {}) => {
        const nextSalaryRange = overrides.salaryRange !== undefined ? overrides.salaryRange : salaryRange;
        const { minSalary, maxSalary } = parseSalaryRange(nextSalaryRange);

        onSearch?.({
            keyword: overrides.keyword !== undefined ? overrides.keyword : keyword.trim(),
            locationId: overrides.locationId !== undefined ? overrides.locationId : locationId,
            tagId: overrides.tagId !== undefined ? overrides.tagId : tagId,
            minSalary,
            maxSalary,
            level: overrides.level !== undefined ? overrides.level : level,
            expYear: overrides.expYear !== undefined ? overrides.expYear : expYear
        });
    };

    const handleAdvancedChange = (field, val) => {
        triggerSearch({ [field]: val });
    };

    const handleRemoveFilter = (keys) => {
        if (keys.includes('keyword')) {
            setKeyword('');
        }
        onRemoveFilter?.(keys);
    };

    const handleReset = () => {
        setKeyword('');
        onReset?.();
    };

    return (
        <div className="flex flex-col items-center w-full mb-8">
            <div className="flex items-center bg-white rounded-full shadow-md p-2 w-full max-w-5xl border border-gray-100 relative z-10">
                <span className="pl-4 pr-2 text-textmain text-xl">🔍</span>
                <input
                    type="text"
                    placeholder="Nhập từ khóa (Java, React, Công ty...)"
                    className="flex-1 py-2 px-2 outline-none text-textmain bg-transparent min-w-0"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
                />

                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-1 border-l border-gray-200 whitespace-nowrap ${showAdvanced ? 'text-earth' : 'text-gray-500 hover:text-olive'}`}
                >
                    ⚙️ Lọc nâng cao {showAdvanced ? '▲' : '▼'}
                </button>

                <button
                    type="button"
                    className="bg-olive hover:bg-earth text-white font-medium py-2.5 px-6 sm:px-8 rounded-full transition-colors duration-300 ml-2 shadow-sm whitespace-nowrap"
                    onClick={() => triggerSearch()}
                >
                    Tìm kiếm
                </button>
            </div>

            {showAdvanced && (
                <AdvancedFiltersPanel
                    locations={locations}
                    tags={tags}
                    locationId={locationId}
                    tagId={tagId}
                    salaryRange={salaryRange}
                    level={level}
                    expYear={expYear}
                    onFilterChange={handleAdvancedChange}
                    onReset={handleReset}
                />
            )}

            <ActiveFilterChips
                filters={filters}
                locations={locations}
                tags={tags}
                onRemoveFilter={handleRemoveFilter}
                onReset={handleReset}
            />
        </div>
    );
}

export default SearchBar;
