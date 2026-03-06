import React, { useState } from 'react';

function SearchBar({ onSearch }) {
    const [inputValue, setInputValue] = useState('');

    const handleSearch = () => {
        if (onSearch) {
            onSearch(inputValue);
        }
    };

    return (
        <div className="search-bar-container">
            <input 
                type="text"
                placeholder="Nhập từ khóa tìm kiếm (Java, React, BA...)"
                className="search-input"
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '300px' }}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="search-button" onClick={handleSearch} style={{ marginLeft: '10px' }}>
                Tìm kiếm
            </button>
        </div>
    );
}

export default SearchBar;