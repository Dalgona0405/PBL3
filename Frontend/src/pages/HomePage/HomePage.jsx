import React from 'react';
import SearchBar from './components/SearchBar';
import PopularLocations from './components/PopularLocations';
import PopularTags from './components/PopularTags';
import JobList from '../../components/common/JobList';
import { useJobFilterStore } from '../../stores/useJobFilterStore';

function HomePage() {
    const { filters, setFilters, setFilterField, removeFilters, resetFilters } = useJobFilterStore();

    const isSearching = Boolean(
        filters.keyword ||
        filters.locationId ||
        filters.tagId ||
        filters.minSalary ||
        filters.maxSalary ||
        filters.level ||
        filters.expYear
    );

    const handleSelectLocation = (locId) => {
        setFilterField('locationId', String(locId));
        window.scrollTo({ top: 320, behavior: 'smooth' });
    };

    const handleSelectPopularTag = (tagId) => {
        setFilterField('tagId', String(tagId));
        window.scrollTo({ top: 320, behavior: 'smooth' });
    };

    return (
        <div className="max-w-7xl mx-auto w-full pb-12 px-4 md:px-0">
            <SearchBar
                filters={filters}
                onSearch={setFilters}
                onRemoveFilter={removeFilters}
                onReset={resetFilters}
            />

            {!isSearching && (
                <>
                    <PopularLocations onSelectLocation={handleSelectLocation} />
                    <PopularTags onSelectTag={handleSelectPopularTag} />
                </>
            )}

            <div className="animate-fade-in-up mt-4">
                <JobList filters={filters} />
            </div>
        </div>
    );
}

export default HomePage;
