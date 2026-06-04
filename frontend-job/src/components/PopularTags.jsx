import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

function PopularTags({ onSelectTag }) {
    const [popularTags, setPopularTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPopularTags = async () => {
            try {
                // Gọi API lấy 5 kỹ năng hot nhất hệ thống
                const data = await axiosClient.get('/Tags/popular?count=5');
                setPopularTags(Array.isArray(data) ? data : (data.items || []));
            } catch (error) {
                console.error("Lỗi lấy tag phổ biến:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPopularTags();
    }, []);

    if (isLoading || popularTags.length === 0) return null;

    return (
        <div className="mb-8 animate-fade-in-up">
            <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="text-sm font-bold text-gray-500 mr-2">🔥 Xu hướng tìm kiếm:</span>
                {popularTags.map(tag => (
                    <button
                        key={tag.tagId}
                        onClick={() => onSelectTag(tag.tagId, tag.tagName)}
                        className="bg-white border border-gray-200 text-olive hover:bg-olive hover:text-white hover:border-olive px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow-sm transform hover:-translate-y-0.5"
                    >
                        {tag.tagName}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default PopularTags;