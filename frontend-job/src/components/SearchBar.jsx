import React from 'react';

function SearchBar() {
    return (
        <div className = "search-bar-container">
            <input 
                type="text"
                placeholder="Nhập từ khóa tìm kiếm..."
                className="search-input"
                />
            <button className="search-button">Tìm kiếm</button>
        </div>
    );
}
export default SearchBar;