import React, { useState } from 'react';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import Button from '../ui/Button';

function EditCompanyForm({ company, setFormData }) {
    // State lưu trữ thông tin công ty đang sửa
    const [companyData, setCompanyData] = useState({
        companyName: company?.companyName || '',
        website: company?.website || '',
        size: company?.size || '',
        logoImg: company?.logoImg || ''
    });
    const [isSaving, setIsSaving] = useState(false);

    // Hàm xử lý khi HR gõ chữ vào ô input
    const handleChange = (e) => {
        setCompanyData({ ...companyData, [e.target.name]: e.target.value });
    };

    // Hàm xử lý khi HR chọn ảnh Logo mới
    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Kiểm tra xem có đúng là file ảnh không
        if (!file.type.startsWith('image/')) {
            toast.error("Chỉ được tải lên file ảnh (JPG, PNG) thôi nha HR ơi! 🌿");
            e.target.value = null;
            return;
        }

        const toastId = toast.loading("Đang tải logo lên... 🌿");
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            
            // Gọi API Upload file của C#
            const uploadRes = await axiosClient.post('/files/upload', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Tùy Backend C# trả về tên biến là gì (url, fileUrl, hay data), mình hứng lấy
            const newLogoUrl = uploadRes.url || uploadRes.fileUrl || uploadRes.data || uploadRes.file || uploadRes;
            
            // Cập nhật lại State để hiển thị ảnh mới ngay lập tức
            setCompanyData({ ...companyData, logoImg: newLogoUrl });
            toast.success("Tải logo thành công! Nhớ bấm Lưu thay đổi nha.", { id: toastId });
        } catch (err) {
            toast.error("⚠️ Lỗi khi tải ảnh lên. Vui lòng thử lại!", { id: toastId });
        }
    };

    // Hàm gửi yêu cầu cập nhật xuống Backend C#
    const handleSaveCompany = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading("Đang cập nhật thông tin công ty... 🏢");

        try {
            // Gọi API PUT /api/Companies/{id}
            await axiosClient.put(`${API_URLS.COMPANIES}/${company.companyId}`, companyData);
            
            // Cập nhật lại State tổng của trang Profile để giao diện đồng bộ
            setFormData(prev => ({
                ...prev,
                recruiter: {
                    ...prev.recruiter,
                    company: { ...prev.recruiter.company, ...companyData }
                }
            }));
            
            toast.success("🎉 Cập nhật thông tin công ty thành công!", { id: toastId });
        } catch (error) {
            const msg = error.response?.data?.message || "Có lỗi xảy ra khi cập nhật.";
            toast.error(`⚠️ Lỗi: ${msg}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm p-8 mt-8 border-t-8 border-earth">
            <h3 className="text-xl font-bold text-olive mb-6 pb-3 border-b border-gray-100 flex items-center gap-2">
                🏢 Thông tin Doanh nghiệp
            </h3>
            
            <form onSubmit={handleSaveCompany} className="space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                    <div className="w-24 h-24 rounded-2xl bg-cream border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner p-1">
                        {companyData.logoImg ? (
                            <img src={companyData.logoImg} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-3xl">🏢</span>
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <p className="text-sm font-bold text-gray-700 mb-2">Logo Công ty</p>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cream file:text-olive hover:file:bg-olive hover:file:text-white transition-all cursor-pointer"
                        />
                        <p className="text-xs text-gray-400 mt-2">Định dạng: JPG, PNG. Tối đa 5MB.</p>
                    </div>
                </div>

                {/* Các ô nhập liệu */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                        label="Tên công ty"
                        name="companyName"
                        value={companyData.companyName}
                        onChange={handleChange}
                        required={true}
                    />

                    <InputField 
                        label="Website"
                        name="website"
                        placeholder="https://..."
                        value={companyData.website}
                        onChange={handleChange}
                    />

                    <div className="md:col-span-2">
                        <SelectField 
                            label="Quy mô nhân sự"
                            name="size"
                            value={companyData.size}
                            onChange={handleChange}
                            options={[
                                { label: '1 - 50 nhân viên', value: '1 - 50 nhân viên' },
                                { label: '51 - 200 nhân viên', value: '51 - 200 nhân viên' },
                                { label: '201 - 1000 nhân viên', value: '201 - 1000 nhân viên' },
                                { label: '1000+ nhân viên', value: '1000+ nhân viên' }
                            ]}
                        />
                    </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                    <div className="w-full md:w-auto">
                        <Button type="submit" isLoading={isSaving}>
                            💾 Cập nhật Công ty
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default EditCompanyForm;