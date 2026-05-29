import React, { useState, useEffect } from 'react';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';

function ManageTagsPage() {
    const [tags, setTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // 🛠️ STATE: Dành cho thanh tìm kiếm
    const [searchKeyword, setSearchKeyword] = useState('');

    const [formData, setFormData] = useState({ tagName: '', type: 'Skill' });
    const [editingId, setEditingId] = useState(null); 
    const [isSaving, setIsSaving] = useState(false);
    const toastId = React.useRef(null);

    // 🛠️ CẬP NHẬT HÀM FETCH: Hỗ trợ tìm kiếm
    const fetchTags = async (keyword = '') => {
        try {
            setIsLoading(true);
            // Nếu có từ khóa thì gọi API Search, không thì gọi API lấy tất cả
            const url = keyword 
                ? `${API_URLS.TAGS}/search?keyword=${encodeURIComponent(keyword)}` 
                : API_URLS.TAGS;
                
            const data = await axiosClient.get(url);
            const tagList = data;

            setTags(Array.isArray(tagList) ? tagList :[]);
        } catch (error) {
            error_message = error.response?.data?.message || "Lỗi kết nối máy chủ. Vui lòng thử lại sau!";
            toast.error("Lỗi lấy tags:" + error_message);
            setTags([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    },[]);

    // Xử lý khi bấm nút Tìm kiếm Tag
    const handleSearchTag = (e) => {
        e.preventDefault();
        fetchTags(searchKeyword);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.tagName.trim()) return;

        setIsSaving(true);
        try {
            const toastId = toast.loading(editingId ? 'Đang cập nhật...' : 'Đang thêm mới...');
            if (editingId) {
                await axiosClient.put(`${API_URLS.TAGS}/${editingId}`, formData);
                toast.success("Cập nhật thành công! 🌿", { id: toastId });
            } else {
                await axiosClient.post(API_URLS.TAGS, formData);
                toast.success("Thêm mới thành công! 🌿", { id: toastId });
            }
            
            setFormData({ tagName: '', type: 'Skill' });
            setEditingId(null);
            fetchTags(searchKeyword); // Tải lại danh sách giữ nguyên từ khóa đang tìm
        } catch (error) {
            toast.error("Có lỗi xảy ra: " + (error.response?.data?.message || "Vui lòng thử lại"), { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (tag) => {
        setFormData({ tagName: tag.tagName, type: tag.type || 'Skill' });
        setEditingId(tag.tagId);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn có chắc muốn xóa kỹ năng "${name}" không?`)) return;
        
        try {
            await axiosClient.delete(`${API_URLS.TAGS}/${id}`);
            setTags(tags.filter(t => t.tagId !== id)); 
        } catch (error) {
            toast.error("Không thể xóa! Có thể kỹ năng này đang được ứng viên sử dụng. 🌿", { id: toastId });
        }
    };

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            <div className="mb-8 border-b-2 border-olive pb-4">
                <h2 className="text-3xl font-bold text-textmain mb-2">🏷️ Quản lý Tags</h2>
                <p className="text-gray-500">Thêm, sửa, xóa và tìm kiếm các từ khóa kỹ năng IT.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* CỘT TRÁI: FORM THÊM/SỬA */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth sticky top-8">
                        <h3 className="text-xl font-bold text-olive mb-4">
                            {editingId ? '✏️ Sửa Kỹ năng' : '✨ Thêm Kỹ năng mới'}
                        </h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tên kỹ năng</label>
                                <input 
                                    type="text" name="tagName" required
                                    value={formData.tagName} onChange={handleChange}
                                    placeholder="VD: ReactJS, Java..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Phân loại</label>
                                <select 
                                    name="type" value={formData.type} onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all"
                                >
                                    <option value="Skill">Kỹ năng chuyên môn</option>
                                    <option value="Language">Ngoại ngữ</option>
                                    <option value="Benefit">Phúc lợi</option>
                                    <option value="Role">Vai trò</option>
                                    <option value="Experience">Kinh nghiệm</option>
                                    <option value="Domain">Lĩnh vực</option>
                                    <option value="Demographic">Nhân khẩu học</option>
                                </select>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                                {editingId && (
                                    <button 
                                        type="button" 
                                        onClick={() => { setEditingId(null); setFormData({ tagName: '', type: 'Skill' }); }}
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

                {/* CỘT PHẢI: TÌM KIẾM & DANH SÁCH TAGS */}
                <div className="md:col-span-2 flex flex-col gap-4">
                    
                    {/* 🛠️ THANH TÌM KIẾM TAG */}
                    <form onSubmit={handleSearchTag} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Nhập tên kỹ năng cần tìm..." 
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white"
                        />
                        <button type="submit" className="bg-olive hover:bg-earth text-white px-6 py-2 rounded-xl font-bold transition-colors">
                            Tìm
                        </button>
                        {searchKeyword && (
                            <button 
                                type="button" 
                                onClick={() => { setSearchKeyword(''); fetchTags(''); }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold transition-colors"
                            >
                                Xóa lọc
                            </button>
                        )}
                    </form>

                    {/* DANH SÁCH TAGS */}
                    <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-50 flex-1">
                        {isLoading ? (
                            <div className="text-center text-olive animate-pulse py-10">Đang tải danh sách... 🌿</div>
                        ) : tags.length === 0 ? (
                            <div className="text-center text-gray-500 py-10">Không tìm thấy kỹ năng nào.</div>
                        ) : (
                            <div className="flex flex-wrap gap-3">
                                {tags.map(tag => (
                                    <div key={tag.tagId} className="group flex items-center bg-cream border border-gray-200 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-all">
                                        <span className="font-medium text-textmain mr-3">{tag.tagName}</span>
                                        
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(tag)} className="text-blue-500 hover:text-blue-700" title="Sửa">✏️</button>
                                            <button onClick={() => handleDelete(tag.tagId, tag.tagName)} className="text-red-400 hover:text-red-600" title="Xóa">❌</button>
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

export default ManageTagsPage;