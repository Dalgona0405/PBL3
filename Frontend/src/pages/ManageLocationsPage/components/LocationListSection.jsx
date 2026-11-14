import React from 'react';

function LocationListSection({ locations, isLoading, searchKeyword, onSearchChange, onEdit, onDelete }) {
    return (
        <div className="md:col-span-2 flex flex-col gap-4">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-2 relative">
                <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                    type="text"
                    placeholder="Nhập tên địa điểm cần tìm..."
                    value={searchKeyword}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="flex-1 pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all"
                />
                {searchKeyword && (
                    <button
                        type="button"
                        onClick={() => onSearchChange('')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold transition-colors"
                    >
                        Xóa lọc
                    </button>
                )}
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-50 flex-1">
                {isLoading ? (
                    <div className="text-center text-olive animate-pulse py-10">Đang tải danh sách... 🌿</div>
                ) : locations.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">Không tìm thấy địa điểm nào.</div>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {locations.map(loc => (
                            <div key={loc.locationId} className="group flex items-center bg-cream border border-gray-200 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-all">
                                <span className="font-medium text-textmain mr-3">📍 {loc.locationName}</span>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button type="button" onClick={() => onEdit(loc)} className="text-blue-500 hover:text-blue-700" title="Sửa">✏️</button>
                                    <button type="button" onClick={() => onDelete(loc.locationId, loc.locationName)} className="text-red-400 hover:text-red-600" title="Xóa">❌</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default LocationListSection;
