import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { API_URLS } from '../../../api/api';
import axiosClient from '../../../api/axiosClient';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import Button from '../../../components/ui/Button';
import { companySchema } from '../../../utils/formValidators';

const SIZE_OPTIONS = [
    { value: 'Dưới 10 nhân viên', label: 'Dưới 10 nhân viên' },
    { value: '10-24 nhân viên', label: '10 - 24 nhân viên' },
    { value: '25-99 nhân viên', label: '25 - 99 nhân viên' },
    { value: '100-499 nhân viên', label: '100 - 499 nhân viên' },
    { value: '500-1000 nhân viên', label: '500 - 1000 nhân viên' },
    { value: 'Trên 1000 nhân viên', label: 'Trên 1000 nhân viên' }
];

function EditCompanyForm({ company, setFormData }) {
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(companySchema),
        defaultValues: {
            companyName: company?.companyName || '',
            website: company?.website || '',
            size: company?.size || '',
            taxCode: company?.taxCode || '',
            logoImg: company?.logoImg || ''
        }
    });

    const logoImg = watch('logoImg');

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Chỉ được tải lên tệp ảnh (JPG, PNG, WEBP)!');
            e.target.value = null;
            return;
        }

        const toastId = toast.loading('Đang tải logo lên...');
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const uploadRes = await axiosClient.post(API_URLS.FILES_UPLOAD, formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const newLogoUrl = uploadRes.url || uploadRes.fileUrl || uploadRes.data || uploadRes.file || uploadRes;
            setValue('logoImg', newLogoUrl);
            toast.success('Tải logo thành công! Nhớ bấm Lưu thay đổi.', { id: toastId });
        } catch {
            toast.error('Lỗi khi tải ảnh lên. Vui lòng thử lại!', { id: toastId });
        }
    };

    const handleSaveCompany = async (companyData) => {
        setIsSaving(true);
        const toastId = toast.loading('Đang cập nhật thông tin công ty...');

        try {
            await axiosClient.put(`${API_URLS.COMPANIES}/${company.companyId}`, companyData);

            setFormData(prev => ({
                ...prev,
                recruiter: {
                    ...prev.recruiter,
                    company: { ...prev.recruiter.company, ...companyData }
                }
            }));

            toast.success('Cập nhật thông tin công ty thành công!', { id: toastId });
        } catch (error) {
            const msg = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.';
            toast.error(`Lỗi: ${msg}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm p-8 mt-8 border-t-8 border-earth">
            <h3 className="text-xl font-bold text-olive mb-6 pb-3 border-b border-gray-100 flex items-center gap-2">
                🏢 Thông tin Doanh nghiệp
            </h3>

            <form onSubmit={handleSubmit(handleSaveCompany)} noValidate className="space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                    <div className="w-24 h-24 rounded-2xl bg-cream border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner p-1">
                        {logoImg ? (
                            <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
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
                        <p className="text-xs text-gray-400 mt-2">Định dạng: JPG, PNG, WEBP. Tối đa 5MB.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Tên công ty"
                        error={errors.companyName?.message}
                        required={true}
                        {...register('companyName')}
                    />

                    <InputField
                        label="Website"
                        placeholder="https://..."
                        error={errors.website?.message}
                        {...register('website')}
                    />

                    <InputField
                        label="Mã số thuế (Tax Code)"
                        placeholder="VD: 0101234567"
                        error={errors.taxCode?.message}
                        {...register('taxCode')}
                    />

                    <div>
                        <SelectField
                            label="Quy mô nhân sự"
                            options={SIZE_OPTIONS}
                            error={errors.size?.message}
                            {...register('size')}
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
