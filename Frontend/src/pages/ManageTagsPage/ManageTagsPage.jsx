import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import TagForm from './components/TagForm';
import TagListSection from './components/TagListSection';

function ManageTagsPage() {
    const [tags, setTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');

    const [formData, setFormData] = useState({ tagName: '', type: 'Skill' });
    const [editingId, setEditingId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchTags = useCallback(async (keyword = '') => {
        try {
            setIsLoading(true);
            const url = keyword
                ? `${API_URLS.TAGS}/search?keyword=${encodeURIComponent(keyword)}`
                : API_URLS.TAGS;

            const data = await axiosClient.get(url);
            setTags(Array.isArray(data) ? data : (data.items || []));
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Lỗi kết nối máy chủ. Vui lòng thử lại sau!';
            toast.error(`Lỗi lấy tags: ${errorMessage}`);
            setTags([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    const handleSearchTag = (e) => {
        e.preventDefault();
        fetchTags(searchKeyword);
    };

    const handleResetSearch = () => {
        setSearchKeyword('');
        fetchTags('');
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ tagName: '', type: 'Skill' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.tagName.trim()) return;

        setIsSaving(true);
        const toastId = toast.loading(editingId ? 'Đang cập nhật...' : 'Đang thêm mới...');

        try {
            if (editingId) {
                await axiosClient.patch(`${API_URLS.TAGS}/${editingId}`, formData);
                toast.success('Cập nhật thành công!', { id: toastId });
            } else {
                await axiosClient.post(API_URLS.TAGS, formData);
                toast.success('Thêm mới thành công!', { id: toastId });
            }

            handleCancelEdit();
            fetchTags(searchKeyword);
        } catch (error) {
            toast.error('Có lỗi xảy ra: ' + (error.response?.data?.message || 'Vui lòng thử lại'), { id: toastId });
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

        const toastId = toast.loading('Đang xóa...');
        try {
            await axiosClient.delete(`${API_URLS.TAGS}/${id}`);
            setTags(prev => prev.filter(t => t.tagId !== id));
            toast.success(`Đã xóa kỹ năng "${name}" thành công!`, { id: toastId });
        } catch {
            toast.error('Không thể xóa! Có thể kỹ năng này đang được ứng viên sử dụng.', { id: toastId });
        }
    };

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            <div className="mb-8 border-b-2 border-olive pb-4">
                <h2 className="text-3xl font-bold text-textmain mb-2">🏷️ Quản lý Tags</h2>
                <p className="text-gray-500">Thêm, sửa, xóa và tìm kiếm các từ khóa kỹ năng IT.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <TagForm
                    formData={formData}
                    editingId={editingId}
                    isSaving={isSaving}
                    onChange={handleChange}
                    onSave={handleSave}
                    onCancelEdit={handleCancelEdit}
                />
                <TagListSection
                    tags={tags}
                    isLoading={isLoading}
                    searchKeyword={searchKeyword}
                    onSearchKeywordChange={setSearchKeyword}
                    onSearchSubmit={handleSearchTag}
                    onResetSearch={handleResetSearch}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
}

export default ManageTagsPage;
