import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import useDebounce from '../../hooks/useDebounce';
import LocationForm from './components/LocationForm';
import LocationListSection from './components/LocationListSection';

function ManageLocationsPage() {
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchKeyword, setSearchKeyword] = useState('');
    const debouncedSearch = useDebounce(searchKeyword, 500);

    const [formData, setFormData] = useState({ locationName: '' });
    const [editingId, setEditingId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setIsLoading(true);
                const url = debouncedSearch
                    ? `${API_URLS.LOCATION}/search?keyword=${encodeURIComponent(debouncedSearch)}`
                    : API_URLS.LOCATION;

                const data = await axiosClient.get(url);
                setLocations(Array.isArray(data) ? data : (data.items || []));
            } catch {
                toast.error('Lỗi lấy danh sách địa điểm. Vui lòng thử lại sau!');
                setLocations([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLocations();
    }, [debouncedSearch]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ locationName: '' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.locationName.trim()) return;

        setIsSaving(true);
        const toastId = toast.loading(editingId ? 'Đang cập nhật...' : 'Đang thêm mới...');

        try {
            if (editingId) {
                await axiosClient.patch(`${API_URLS.LOCATION}/${editingId}`, formData);
                toast.success('Cập nhật thành công!', { id: toastId });
                setLocations(prev => prev.map(loc => (
                    loc.locationId === editingId ? { ...loc, locationName: formData.locationName } : loc
                )));
            } else {
                const newLoc = await axiosClient.post(API_URLS.LOCATION, formData);
                toast.success('Thêm mới thành công!', { id: toastId });
                setLocations(prev => [...prev, newLoc]);
            }

            handleCancelEdit();
        } catch (error) {
            toast.error('Có lỗi xảy ra: ' + (error.response?.data?.message || 'Vui lòng thử lại'), { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (loc) => {
        setFormData({ locationName: loc.locationName });
        setEditingId(loc.locationId);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn có chắc muốn xóa địa điểm "${name}" không? Các công việc thuộc địa điểm này có thể bị ảnh hưởng!`)) return;

        const toastId = toast.loading('Đang xóa...');
        try {
            await axiosClient.delete(`${API_URLS.LOCATION}/${id}`);
            setLocations(prev => prev.filter(l => l.locationId !== id));
            toast.success('Đã xóa thành công!', { id: toastId });
        } catch {
            toast.error('Không thể xóa! Có thể địa điểm này đang có công việc tuyển dụng.', { id: toastId });
        }
    };

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            <div className="mb-8 border-b-2 border-olive pb-4">
                <h2 className="text-3xl font-bold text-textmain mb-2">📍 Quản lý Địa điểm</h2>
                <p className="text-gray-500">Thêm, sửa, xóa và tìm kiếm các tỉnh thành / khu vực làm việc.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <LocationForm
                    formData={formData}
                    editingId={editingId}
                    isSaving={isSaving}
                    onChange={handleChange}
                    onSave={handleSave}
                    onCancelEdit={handleCancelEdit}
                />
                <LocationListSection
                    locations={locations}
                    isLoading={isLoading}
                    searchKeyword={searchKeyword}
                    onSearchChange={setSearchKeyword}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
}

export default ManageLocationsPage;
