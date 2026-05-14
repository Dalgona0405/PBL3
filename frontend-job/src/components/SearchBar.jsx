import React, { useState, useEffect } from 'react';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';

function SearchBar({ onSearch }) {
    // 1. STATE LƯU TRỮ DỮ LIỆU TỪ BACKEND
    const [locations, setLocations] = useState([]);
    const [tags, setTags] = useState([]);

    // 2. STATE LƯU TRỮ ĐIỀU KIỆN NGƯỜI DÙNG CHỌN
    const [keyword, setKeyword] = useState('');
    const [locationId, setLocationId] = useState('');
    const [tagId, setTagId] = useState('');
    const [salaryRange, setSalaryRange] = useState(''); // VD: "10-20"
    
    // State để đóng/mở khung Lọc nâng cao
    const [showAdvanced, setShowAdvanced] = useState(false);

    // 3. LẤY DATA CHO DROPDOWN KHI VỪA VÀO TRANG
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const [locData, tagData] = await Promise.all([
                    axiosClient.get(API_URLS.LOCATION),
                    axiosClient.get(API_URLS.TAGS)
                ]);
                setLocations(locData ||[]);
                setTags(tagData ||[]);
            } catch (error) {
                console.error("Lỗi tải dữ liệu bộ lọc:", error);
            }
        };
        fetchDropdownData();
    },[]);

    // 4. HÀM XỬ LÝ KHI BẤM NÚT "TÌM KIẾM"
    const handleSearch = () => {
        let minSalary = '';
        let maxSalary = '';

        // Tách chuỗi lương (VD: "10-20" -> min: 10, max: 20)
        if (salaryRange) {
            if (salaryRange === '20+') {
                minSalary = '20';
            } else {
                const parts = salaryRange.split('-');
                minSalary = parts[0];
                maxSalary = parts[1];
            }
        }

        // Đóng gói tất cả vào 1 giỏ và gửi ra ngoài cho HomePage
        if (onSearch) {
            onSearch({
                keyword,
                locationId,
                tagId,
                minSalary,
                maxSalary
            });
        }
    };

    // Xóa bộ lọc
    const handleClearFilters = () => {
        setKeyword('');
        setLocationId('');
        setTagId('');
        setSalaryRange('');
        if (onSearch) {
            onSearch({ keyword: '', locationId: '', tagId: '', minSalary: '', maxSalary: '' });
        }
    };

    return (
        <div className="flex flex-col items-center w-full mb-10">
            
            {/* THANH TÌM KIẾM CHÍNH */}
            <div className="flex items-center bg-white rounded-full shadow-md p-2 w-full max-w-4xl border border-gray-100 relative z-10">
                <span className="pl-4 pr-2 text-gray-400 text-xl">🔍</span>
                <input 
                    type="text"
                    placeholder="Nhập từ khóa (Java, React, BA...)"
                    className="flex-1 py-2 px-2 outline-none text-textmain bg-transparent"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                
                {/* Nút bật/tắt Lọc nâng cao */}
                <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-1 border-l border-gray-200 ${showAdvanced ? 'text-earth' : 'text-gray-400 hover:text-olive'}`}
                >
                    ⚙️ Lọc {showAdvanced ? '▲' : '▼'}
                </button>

                <button 
                    className="bg-earth hover:bg-olive text-white font-medium py-2.5 px-8 rounded-full transition-colors duration-300 ml-2 shadow-sm"
                    onClick={handleSearch}
                >
                    Tìm kiếm
                </button>
            </div>

            {/* KHUNG LỌC NÂNG CAO (Chỉ hiện khi showAdvanced = true) */}
            {showAdvanced && (
                <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg border border-gray-100 mt-4 p-6 animate-fade-in-up">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Lọc theo Khu vực */}
                        <div>
                            <label className="block text-sm font-bold text-olive mb-2">📍 Khu vực</label>
                            <select 
                                value={locationId} onChange={(e) => setLocationId(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 text-gray-600 cursor-pointer"
                            >
                                <option value="">Tất cả địa điểm</option>
                                {locations.map(loc => (
                                    <option key={loc.locationId} value={loc.locationId}>{loc.locationName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Lọc theo Kỹ năng */}
                        <div>
                            <label className="block text-sm font-bold text-olive mb-2">🧩 Kỹ năng (Tag)</label>
                            <select 
                                value={tagId} onChange={(e) => setTagId(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 text-gray-600 cursor-pointer"
                            >
                                <option value="">Tất cả kỹ năng</option>
                                {tags.map(tag => (
                                    <option key={tag.tagId} value={tag.tagId}>{tag.tagName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Lọc theo Mức lương */}
                        <div>
                            <label className="block text-sm font-bold text-olive mb-2">💰 Mức lương</label>
                            <select 
                                value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 text-gray-600 cursor-pointer"
                            >
                                <option value="">Mọi mức lương</option>
                                <option value="0-10">Dưới 10 triệu</option>
                                <option value="10-20">10 - 20 triệu</option>
                                <option value="20-30">20 - 30 triệu</option>
                                <option value="30-50">30 - 50 triệu</option>
                                <option value="50+">Trên 50 triệu</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                        <button 
                            onClick={handleClearFilters}
                            className="text-gray-400 hover:text-red-500 font-medium text-sm transition-colors"
                        >
                            ❌ Xóa bộ lọc
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchBar;