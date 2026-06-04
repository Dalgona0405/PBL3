import React, { useState, useEffect } from 'react';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import useDebounce from '../hooks/useDebounce';

function ManageLocationsPage() {
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // 🛠️ STATE: Dành cho thanh tìm kiếm
    const [searchKeyword, setSearchKeyword] = useState('');
    const debouncedSearch = useDebounce(searchKeyword, 500); // Chờ 500ms mới tìm

    // 🛠️ STATE: Dành cho Form Thêm/Sửa
    const [formData, setFormData] = useState({ locationName: '' });
    const [editingId, setEditingId] = useState(null); 
    const [isSaving, setIsSaving] = useState(false);

    // 🌟 HÀM FETCH DATA (Tự động gọi API Search nếu có từ khóa)
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setIsLoading(true);
                // Nếu có từ khóa -> Gọi API Search. Nếu không -> Gọi API lấy tất cả
                const url = debouncedSearch 
                    ? `${API_URLS.LOCATION}/search?keyword=${encodeURIComponent(debouncedSearch)}` 
                    : API_URLS.LOCATION;
                    
                const data = await axiosClient.get(url);
                // Tùy C# trả về mảng trực tiếp hay bọc trong items
                setLocations(Array.isArray(data) ? data : (data.items || []));
            } catch (error) {
                toast.error("Lỗi lấy danh sách địa điểm. Vui lòng thử lại sau! 🌿");
                setLocations([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLocations();
    }, [debouncedSearch]); // Tự động chạy lại khi debouncedSearch thay đổi

    // 🌟 XỬ LÝ NHẬP FORM
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 🌟 HÀM LƯU (THÊM MỚI HOẶC CẬP NHẬT)
    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.locationName.trim()) return;

        setIsSaving(true);
        const toastId = toast.loading(editingId ? 'Đang cập nhật...' : 'Đang thêm mới...');
        
        try {
            if (editingId) {
                // Gọi API PATCH để sửa
                await axiosClient.patch(`${API_URLS.LOCATION}/${editingId}`, formData);
                toast.success("Cập nhật thành công! 🌿", { id: toastId });
                
                // Cập nhật UI ngay lập tức
                setLocations(prev => prev.map(loc => loc.locationId === editingId ? { ...loc, locationName: formData.locationName } : loc));
            } else {
                // Gọi API POST để thêm mới
                const newLoc = await axiosClient.post(API_URLS.LOCATION, formData);
                toast.success("Thêm mới thành công! 🌿", { id: toastId });
                
                // Thêm vào UI (Giả sử C# trả về object vừa tạo)
                setLocations(prev => [...prev, newLoc]);
            }
            
            // Reset form
            setFormData({ locationName: '' });
            setEditingId(null);
        } catch (error) {
            toast.error("Có lỗi xảy ra: " + (error.response?.data?.message || "Vui lòng thử lại"), { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    // 🌟 BẤM NÚT SỬA
    const handleEdit = (loc) => {
        setFormData({ locationName: loc.locationName });
        setEditingId(loc.locationId);
    };

    // 🌟 BẤM NÚT XÓA
    const handleDelete = async (id, name) => {
        if (!window.confirm(`⚠️ Bạn có chắc muốn xóa địa điểm "${name}" không? Các công việc thuộc địa điểm này có thể bị ảnh hưởng!`)) return;
        
        const toastId = toast.loading("Đang xóa...");
        try {
            // Gọi API DELETE
            await axiosClient.delete(`${API_URLS.LOCATION}/${id}`);
            setLocations(prev => prev.filter(l => l.locationId !== id)); 
            toast.success("Đã xóa thành công! 🌿", { id: toastId });
        } catch (error) {
            toast.error("Không thể xóa! Có thể địa điểm này đang có công việc tuyển dụng. 🌿", { id: toastId });
        }
    };

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            <div className="mb-8 border-b-2 border-olive pb-4">
                <h2 className="text-3xl font-bold text-textmain mb-2">📍 Quản lý Địa điểm</h2>
                <p className="text-gray-500">Thêm, sửa, xóa và tìm kiếm các tỉnh thành / khu vực làm việc.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* CỘT TRÁI: FORM THÊM/SỬA */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth sticky top-8">
                        <h3 className="text-xl font-bold text-olive mb-4">
                            {editingId ? '✏️ Sửa Địa điểm' : '✨ Thêm Địa điểm mới'}
                        </h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tên tỉnh / thành phố</label>
                                <input 
                                    type="text" name="locationName" required
                                    value={formData.locationName} onChange={handleChange}
                                    placeholder="VD: Hà Nội, Hồ Chí Minh..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all"
                                />
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                                {editingId && (
                                    <button 
                                        type="button" 
                                        onClick={() => { setEditingId(null); setFormData({ locationName: '' }); }}
                                        className="flex-1 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                                    >
                                        Hủy
                                    </button>
                                )}
                                <button 
                                    type="submit" disabled={isSaving}
                                    className={`flex-1 py-2.5 rounded-xl font-bold text-white shadow-md transition-all ${isSaving ? 'bg-gray-400' : 'bg-earth hover:bg-olive hover:-translate-y-0.5'}`}
                                >
                                    {isSaving ? 'Đang lưu...' : 'Lưu lại'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* CỘT PHẢI: TÌM KIẾM & DANH SÁCH */}
                <div className="md:col-span-2 flex flex-col gap-4">
                    
                    {/* 🛠️ THANH TÌM KIẾM (Tự động tìm nhờ useDebounce) */}
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-2 relative">
                        <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Nhập tên địa điểm cần tìm..." 
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            className="flex-1 pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all"
                        />
                        {searchKeyword && (
                            <button 
                                type="button" 
                                onClick={() => setSearchKeyword('')}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold transition-colors"
                            >
                                Xóa lọc
                            </button>
                        )}
                    </div>

                    {/* DANH SÁCH ĐỊA ĐIỂM */}
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
                                            <button onClick={() => handleEdit(loc)} className="text-blue-500 hover:text-blue-700" title="Sửa">✏️</button>
                                            <button onClick={() => handleDelete(loc.locationId, loc.locationName)} className="text-red-400 hover:text-red-600" title="Xóa">❌</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default ManageLocationsPage;