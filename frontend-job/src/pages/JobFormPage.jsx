import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import useDebounce from '../hooks/useDebounce';
import InputField from '../components/ui/InputField';
import SelectField from '../components/ui/SelectField';
import Button from '../components/ui/Button';

function JobFormPage() {
    const { jobId } = useParams(); // Nếu có jobId trên URL -> Chế độ Sửa. Nếu không có -> Chế độ Tạo mới.
    const navigate = useNavigate();
    const isEditMode = Boolean(jobId);
    const { user } = useAuth();

    // Các State lưu trữ dữ liệu danh mục (Dropdown)
    const [locations, setLocations] = useState([]);
    const [allTags, setAllTags] = useState([]);

    // State lưu thông tin Form
    const [formData, setFormData] = useState({
        title: '',
        locationId: '',
        address: '',
        salaryMin: '',
        salaryMax: '',
        level: 'Nhân viên',
        expYear: 'Không yêu cầu',
        deadline: '',
        description: '',
        requirement: '',
        benefits: '',
        companyId: null // Bắt buộc phải có để đăng tin
    });

    const [selectedTags, setSelectedTags] = useState([]);
    const [tagKeyword, setTagKeyword] = useState('');
    const debouncedTagKeyword = useDebounce(tagKeyword, 300);
    const [tagSuggestions, setTagSuggestions] = useState([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [showTagDropdown, setShowTagDropdown] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    // 1. LẤY DỮ LIỆU BAN ĐẦU (Locations, Tags, và thông tin Recruiter)
    useEffect(() => {
        if (!user) { navigate('/login'); return; }

        const fetchInitialData = async () => {
            try {
                setIsLoading(true);

                // Lấy danh sách Địa điểm, Kỹ năng và Thông tin HR
                const [locRes, tagsRes, hrRes] = await Promise.all([
                    axiosClient.get(API_URLS.LOCATION),
                    axiosClient.get(API_URLS.TAGS),
                    axiosClient.get(`${API_URLS.RECRUITERS}/${user.id}`)
                ]);

                setLocations(locRes || []);
                setAllTags(tagsRes || []);

                if (!hrRes.company) {
                    toast.error("Bạn chưa gia nhập công ty nào. Vui lòng cập nhật hồ sơ trước khi đăng tin!");
                    return;
                }
                // Lưu companyId vào form
                setFormData(prev => ({ ...prev, companyId: hrRes.company.companyId }));

                // NẾU LÀ CHẾ ĐỘ SỬA -> Gọi API lấy thông tin Job cũ đắp vào Form
                if (isEditMode) {
                    const jobData = await axiosClient.get(`${API_URLS.JOBS}/${jobId}`);
                    setFormData(prev => ({
                        ...prev,
                        title: jobData.title || '',
                        locationId: jobData.location?.locationId || '',
                        address: jobData.address || '',
                        salaryMin: jobData.salaryMin || '',
                        salaryMax: jobData.salaryMax || '',
                        level: jobData.level || 'Nhân viên',
                        expYear: jobData.expYear || 'Không yêu cầu',
                        deadline: jobData.deadline ? jobData.deadline.split('T')[0] : '',
                        description: jobData.description || '',
                        requirement: jobData.requirement || '',
                        benefits: jobData.benefits || ''
                    }));
                    if (jobData.tags) {
                        setSelectedTags(jobData.tags.map(t => ({ tagId: t.tagId, tagName: t.tagName })));
                    }
                }
            } catch (err) {
                toast.error("Lỗi tải dữ liệu. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [jobId, isEditMode, navigate, user]);

    // 🌟 GỌI API GỢI Ý KHI HR GÕ CHỮ
    useEffect(() => {
        const fetchTagSuggestions = async () => {
            if (debouncedTagKeyword.trim().length < 1) {
                setTagSuggestions([]);
                setShowTagDropdown(false);
                return;
            }

            setIsSuggesting(true);
            try {
                // Gọi API suggest với limit = 5 để giao diện không bị rối
                const data = await axiosClient.get(`/Tags/suggest?keyword=${encodeURIComponent(debouncedTagKeyword)}&limit=5`);
                setTagSuggestions(Array.isArray(data) ? data : (data.items || []));
                setShowTagDropdown(true);
            } catch (error) {
                console.error("Lỗi gợi ý tag:", error);
            } finally {
                setIsSuggesting(false);
            }
        };

        fetchTagSuggestions();
    }, [debouncedTagKeyword]);

    // 2. XỬ LÝ THAY ĐỔI INPUT
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 3. XỬ LÝ THÊM/XÓA TAGS
    const handleAddTag = () => {
        if (!selectedTagId) return;
        if (selectedTags.some(t => t.tagId === parseInt(selectedTagId))) return; // Chống trùng

        const tagToAdd = allTags.find(t => t.tagId === parseInt(selectedTagId));
        if (tagToAdd) {
            setSelectedTags([...selectedTags, { tagId: tagToAdd.tagId, tagName: tagToAdd.tagName }]);
            setSelectedTagId('');
        }
    };

    const handleRemoveTag = (tagId) => {
        setSelectedTags(selectedTags.filter(t => t.tagId !== tagId));
    };

    // 4. LƯU DỮ LIỆU (CREATE HOẶC UPDATE)
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const payload = {
                ...formData,
                locationId: parseInt(formData.locationId),
                salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
                salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
                tagIds: selectedTags.map(t => t.tagId)
            };

            const toastId = toast.loading(isEditMode ? 'Đang cập nhật tin...' : 'Đang đăng tin...');
            const url = isEditMode ? `${API_URLS.JOBS}/${jobId}` : API_URLS.JOBS;

            if (isEditMode) {
                await axiosClient.put(url, payload);
            } else {
                await axiosClient.post(url, payload);
            }

            toast.success(`🎉 Đã ${isEditMode ? 'cập nhật' : 'đăng'} tin tuyển dụng thành công! 🌿`, { id: toastId });
            navigate('/recruiter-dashboard');

        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Vui lòng kiểm tra lại thông tin.';
            toast.error(`⚠️ Lỗi: ${errorMsg}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang chuẩn bị xưởng làm việc... 🌿</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">

            {/* HEADER */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/recruiter-dashboard')}
                    className="text-gray-500 hover:text-olive font-medium flex items-center gap-2 mb-4 transition-colors"
                >
                    ⬅ Quay lại Dashboard
                </button>
                <div className="border-b-2 border-olive pb-4">
                    <h2 className="text-3xl font-bold text-textmain mb-2">
                        {isEditMode ? '✏️ Cập nhật Tin tuyển dụng' : '✨ Đăng Tin tuyển dụng mới'}
                    </h2>
                    <p className="text-gray-500">Điền đầy đủ thông tin để thu hút những ứng viên tài năng nhất.</p>
                </div>
            </div>

            {/* FORM CHÍNH */}
            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* CỘT TRÁI: THÔNG TIN CƠ BẢN */}
                <div className="lg:col-span-1 space-y-6 bg-white p-8 rounded-3xl shadow-sm border-t-8 border-earth h-fit">
                    <h3 className="text-xl font-bold text-olive border-b border-gray-100 pb-3">Thông tin cơ bản</h3>

                    <InputField
                        label="Tiêu đề công việc"
                        name="title"
                        placeholder="VD: Frontend Developer (ReactJS)"
                        value={formData.title}
                        onChange={handleChange}
                        required={true}
                    />

                    <SelectField
                        label="Khu vực"
                        name="locationId"
                        value={formData.locationId}
                        onChange={handleChange}
                        required={true}
                        options={locations.map(loc => ({
                            label: loc.locationName,
                            value: loc.locationId
                        }))}
                    />

                    <InputField
                        label="Địa chỉ làm việc cụ thể"
                        name="address"
                        placeholder="VD: Tầng 3, Tòa nhà ABC..."
                        value={formData.address}
                        onChange={handleChange}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="Lương Min (Triệu)"
                            name="salaryMin"
                            type="number"
                            placeholder="VD: 10"
                            value={formData.salaryMin}
                            onChange={handleChange}
                        />
                        <InputField
                            label="Lương Max (Triệu)"
                            name="salaryMax"
                            type="number"
                            placeholder="VD: 20"
                            value={formData.salaryMax}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <SelectField
                            label="Cấp bậc"
                            name="level"
                            value={formData.level}
                            onChange={handleChange}
                            options={[
                                { label: 'Thực tập sinh', value: 'Thực tập sinh' },
                                { label: 'Nhân viên', value: 'Nhân viên' },
                                { label: 'Trưởng nhóm', value: 'Trưởng nhóm' },
                                { label: 'Quản lý', value: 'Quản lý' }
                            ]}
                        />
                        <SelectField
                            label="Kinh nghiệm"
                            name="expYear"
                            value={formData.expYear}
                            onChange={handleChange}
                            options={[
                                { label: 'Không yêu cầu', value: 'Không yêu cầu' },
                                { label: 'Dưới 1 năm', value: 'Dưới 1 năm' },
                                { label: '1 - 3 năm', value: '1 - 3 năm' },
                                { label: 'Trên 3 năm', value: 'Trên 3 năm' }
                            ]}
                        />
                    </div>

                    <InputField
                        label="Hạn chót nộp CV"
                        name="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={handleChange}
                    />
                </div>

                {/* CỘT PHẢI: CHI TIẾT & KỸ NĂNG */}
                <div className="lg:col-span-2 space-y-6 bg-white p-8 rounded-3xl shadow-sm border-t-8 border-olive">
                    <h3 className="text-xl font-bold text-olive border-b border-gray-100 pb-3">Chi tiết công việc</h3>

                    {/* TEXTAREA GIỮ NGUYÊN */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả công việc</label>
                        <textarea name="description" rows="5" value={formData.description} onChange={handleChange} placeholder="Mô tả các công việc ứng viên sẽ làm..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white resize-none"></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Yêu cầu ứng viên</label>
                        <textarea name="requirement" rows="5" value={formData.requirement} onChange={handleChange} placeholder="Các kỹ năng, bằng cấp yêu cầu..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white resize-none"></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Quyền lợi</label>
                        <textarea name="benefits" rows="4" value={formData.benefits} onChange={handleChange} placeholder="Bảo hiểm, du lịch, thưởng..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white resize-none"></textarea>
                    </div>

                    {/* KHU VỰC CHỌN TAGS (KỸ NĂNG) - ĐÃ NÂNG CẤP AUTOCOMPLETE */}
                    <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-3">Thẻ kỹ năng (Tags)</label>

                        <div className="relative mb-4">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Gõ tên kỹ năng (VD: React, Java...)"
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white transition-all"
                                    value={tagKeyword}
                                    onChange={(e) => setTagKeyword(e.target.value)}
                                    onFocus={() => tagSuggestions.length > 0 && setShowTagDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)} // Chờ 200ms để user kịp click vào gợi ý
                                />
                            </div>

                            {/* 🌟 HỘP THOẠI GỢI Ý (DROPDOWN) */}
                            {showTagDropdown && (
                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                    {isSuggesting ? (
                                        <div className="p-3 text-sm text-gray-500 text-center">Đang tìm... 🌿</div>
                                    ) : tagSuggestions.length > 0 ? (
                                        tagSuggestions.map(tag => (
                                            <div
                                                key={tag.tagId}
                                                className="px-4 py-3 hover:bg-cream cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center"
                                                onClick={() => {
                                                    // Nếu chưa có trong danh sách thì mới thêm vào
                                                    if (!selectedTags.some(t => t.tagId === tag.tagId)) {
                                                        setSelectedTags([...selectedTags, { tagId: tag.tagId, tagName: tag.tagName }]);
                                                    }
                                                    setTagKeyword(''); // Xóa trắng ô input
                                                    setShowTagDropdown(false); // Đóng dropdown
                                                }}
                                            >
                                                <span className="font-bold text-olive">{tag.tagName}</span>
                                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{tag.type}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-sm text-gray-500 text-center">Không tìm thấy kỹ năng phù hợp.</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {selectedTags.length > 0 ? (
                                selectedTags.map((tag) => (
                                    <span key={tag.tagId} className="inline-flex items-center bg-cream text-olive px-4 py-2 rounded-full text-sm font-medium border border-gray-200 shadow-sm">
                                        {tag.tagName}
                                        <button
                                            type="button"
                                            className="ml-2 text-red-400 hover:text-red-600 font-bold text-lg leading-none focus:outline-none transform hover:scale-110 transition-transform"
                                            onClick={() => setSelectedTags(selectedTags.filter(t => t.tagId !== tag.tagId))}
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))
                            ) : (
                                <p className="text-gray-400 italic text-sm">Chưa chọn kỹ năng nào.</p>
                            )}
                        </div>
                    </div>

                    {/* NÚT LƯU BẰNG LEGO */}
                    <div className="pt-8 flex justify-end">
                        <div className="w-full md:w-auto">
                            <Button type="submit" isLoading={isSaving}>
                                {isEditMode ? '💾 Lưu cập nhật' : '🚀 Đăng tin ngay'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default JobFormPage;