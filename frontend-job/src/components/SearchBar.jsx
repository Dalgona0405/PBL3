import React, { useState } from 'react';

function SearchBar({ onSearch }) {
    const [inputValue, setInputValue] = useState('');

    const handleSearch = () => {
        if (onSearch) {
            onSearch(inputValue);
        }
    };

    return (
        // Khung bao ngoài thanh search, căn giữa, có đổ bóng nhẹ
        <div className="flex justify-center w-full mb-8">
            <div className="flex items-center bg-white rounded-full shadow-md p-2 w-full max-w-3xl border border-gray-100">
                
                {/* Icon kính lúp cho sinh động */}
                <span className="pl-4 pr-2 text-gray-400 text-xl">🔍</span>
                
                {/* Ô nhập liệu */}
                <input 
                    type="text"
                    placeholder="Nhập từ khóa tìm kiếm (Java, React, BA...)"
                    className="flex-1 py-2 px-2 outline-none text-textmain bg-transparent"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                
                {/* Nút tìm kiếm */}
                <button 
                    className="bg-earth hover:bg-olive text-white font-medium py-2 px-6 rounded-full transition-colors duration-300"
                    onClick={handleSearch}
                >
                    Tìm kiếm
                </button>
            </div>
        </div>
    );
}

export default SearchBar;