import React from 'react';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';

const LEVEL_OPTIONS = [
    { label: 'Thực tập sinh', value: 'Thực tập sinh' },
    { label: 'Nhân viên', value: 'Nhân viên' },
    { label: 'Senior', value: 'Senior' },
    { label: 'Trưởng nhóm / Quản lý', value: 'Trưởng nhóm / Quản lý' }
];

const EXP_YEAR_OPTIONS = [
    { label: 'Không yêu cầu', value: 'Không yêu cầu' },
    { label: 'Dưới 1 năm', value: 'Dưới 1 năm' },
    { label: '1 - 2 năm', value: '1 - 2 năm' },
    { label: '2 - 3 năm', value: '2 - 3 năm' },
    { label: '3 - 5 năm', value: '3 - 5 năm' },
    { label: 'Trên 5 năm', value: 'Trên 5 năm' }
];

function JobBasicInfoSection({ formData, locations, errors = {}, onChange }) {
    return (
        <div className="lg:col-span-1 space-y-6 bg-white p-8 rounded-3xl shadow-sm border-t-8 border-earth h-fit">
            <h3 className="text-xl font-bold text-olive border-b border-gray-100 pb-3">Thông tin cơ bản</h3>

            <InputField label="Tiêu đề công việc" name="title" placeholder="VD: Frontend Developer (ReactJS)" value={formData.title} onChange={onChange} error={errors.title} required />

            <SelectField
                label="Khu vực" name="locationId" value={formData.locationId} onChange={onChange} error={errors.locationId} required
                options={locations.map(loc => ({ label: loc.locationName, value: loc.locationId }))}
            />

            <InputField label="Địa chỉ làm việc cụ thể" name="address" placeholder="VD: Tầng 3, Tòa nhà ABC..." value={formData.address} onChange={onChange} />

            <div className="grid grid-cols-2 gap-4">
                <InputField label="Lương Min (Triệu)" name="salaryMin" type="number" placeholder="VD: 10" value={formData.salaryMin} onChange={onChange} error={errors.salaryMin} />
                <InputField label="Lương Max (Triệu)" name="salaryMax" type="number" placeholder="VD: 20" value={formData.salaryMax} onChange={onChange} error={errors.salaryMax} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <SelectField label="Cấp bậc" name="level" value={formData.level} onChange={onChange} options={LEVEL_OPTIONS} />
                <SelectField label="Kinh nghiệm" name="expYear" value={formData.expYear} onChange={onChange} options={EXP_YEAR_OPTIONS} />
            </div>

            <InputField label="Hạn chót nộp CV" name="deadline" type="date" value={formData.deadline} onChange={onChange} error={errors.deadline} />
        </div>
    );
}

export default JobBasicInfoSection;
