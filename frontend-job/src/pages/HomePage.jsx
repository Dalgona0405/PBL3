import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import JobList from '../components/JobList';
import PopularLocations from '../components/PopularLocations';
import PopularTags from '../components/PopularTags';

function HomePage() {
    const [filters, setFilters] = useState({
        keyword: '',
        locationId: '',
        tagId: '',
        minSalary: '',
        maxSalary: ''
    });

    // Kiểm tra xem user có đang dùng bộ lọc nào không
    const isSearching = filters.keyword || filters.locationId || filters.tagId || filters.minSalary || filters.maxSalary;

    // Hàm này truyền cho PopularLocations
    const handleSelectLocation = (locId) => {
        setFilters(prev => ({ ...prev, locationId: locId }));
    };

    // Hàm này truyền cho PopularTags
    const handleSelectPopularTag = (tagId, tagName) => {
        setFilters(prev => ({ ...prev, tagId: tagId }));
        window.scrollTo({ top: 400, behavior: 'smooth' });
    };

    return (
        <div className="max-w-7xl mx-auto w-full pb-12 px-4 md:px-0">

            {/* 1. Thanh tìm kiếm luôn nằm trên cùng */}
            <SearchBar onSearch={setFilters} />

            {/* 2. Kệ nổi bật: CHỈ HIỆN KHI CHƯA TÌM KIẾM GÌ CẢ */}
            {!isSearching && (
                <>
                    <PopularLocations onSelectLocation={handleSelectLocation} />
                    <PopularTags onSelectTag={handleSelectPopularTag} />
                </>
            )}

            {/* 3. Danh sách công việc: LUÔN LUÔN HIỂN THỊ */}
            {/* - Nếu chưa tìm kiếm: Hiện tất cả việc làm (Backend đã sort mới nhất) */}
            {/* - Nếu đã tìm kiếm: Hiện kết quả tương ứng */}
            <div className="animate-fade-in-up mt-4">
                <JobList filters={filters} />
            </div>

        </div>
    );
}

export default HomePage;