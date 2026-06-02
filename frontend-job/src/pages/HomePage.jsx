import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import JobList from '../components/JobList';
import PopularLocations from '../components/PopularLocations';
// 🗑️ Đã xóa import RecentJobs theo ý tưởng tuyệt vời của Trúc!

function HomePage() {
  // Giỏ chứa các điều kiện lọc
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

  return (
    <div className="max-w-7xl mx-auto w-full pb-12 px-4 md:px-0">
        
        {/* 1. Thanh tìm kiếm luôn nằm trên cùng */}
        <SearchBar onSearch={setFilters} />
        
        {/* 2. Kệ Địa điểm nổi bật: CHỈ HIỆN KHI CHƯA TÌM KIẾM GÌ CẢ */}
        {!isSearching && (
            <PopularLocations onSelectLocation={handleSelectLocation} />
        )}
        
        {/* 3. Danh sách công việc: LUÔN LUÔN HIỂN THỊ */}
        {/* - Nếu chưa tìm kiếm: Hiện tất cả việc làm (Backend đã sort mới nhất) */}
        {/* - Nếu đã tìm kiếm: Hiện kết quả tương ứng */}
        <div className="animate-fade-in-up mt-4">
            {/* Tui thêm cái tiêu đề nhỏ cho danh sách tổng khi chưa tìm kiếm */}
            {!isSearching && (
                <h2 className="text-2xl font-bold text-textmain mb-6 flex items-center gap-2">
                    🔥 Khám phá việc làm
                </h2>
            )}
            <JobList filters={filters} />
        </div>
        
    </div>
  );
}

export default HomePage;