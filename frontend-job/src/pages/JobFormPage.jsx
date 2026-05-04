import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';

function JobFormPage() {
    const { jobId } = useParams(); // Nếu có jobId trên URL -> Chế độ Sửa. Nếu không có -> Chế độ Tạo mới.
    const navigate = useNavigate();
    const isEditMode = Boolean(jobId);

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
    const[selectedTagId, setSelectedTagId] = useState('');
    
    const [isLoading, setIsLoading] = useState(true);
    const[isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    // 1. LẤY DỮ LIỆU BAN ĐẦU (Locations, Tags, và thông tin Recruiter)
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (!token || !savedUser) { navigate('/login'); return; }
        const parsedUser = JSON.parse(savedUser);

        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                
                // Lấy danh sách Địa điểm, Kỹ năng và Thông tin HR (để lấy CompanyId)
                const [locRes, tagsRes, hrRes] = await Promise.all([
                    fetch(API_URLS.LOCATION),
                    fetch(API_URLS.TAGS),
                    fetch(`${API_URLS.RECRUITERS}/${parsedUser.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (locRes.ok) setLocations(await locRes.json());
                if (tagsRes.ok) setAllTags(await tagsRes.json());
                
                if (hrRes.ok) {
                    const hrData = await hrRes.json();
                    if (!hrData.company) {
                        setError("Bạn chưa gia nhập công ty nào. Vui lòng cập nhật hồ sơ trước khi đăng tin!");
                        return;
                    }
                    // Lưu companyId vào form
                    setFormData(prev => ({ ...prev, companyId: hrData.company.companyId }));
                }

                // NẾU LÀ CHẾ ĐỘ SỬA -> Gọi API lấy thông tin Job cũ đắp vào Form
                if (isEditMode) {
                    const jobRes = await fetch(`${API_URLS.JOBS}/${jobId}`);
                    if (jobRes.ok) {
                        const jobData = await jobRes.json();
                        setFormData(prev => ({
                            ...prev,
                            title: jobData.title || '',
                            locationId: jobData.location?.locationId || '',
                            address: jobData.address || '',
                            salaryMin: jobData.salaryMin || '',
                            salaryMax: jobData.salaryMax || '',
                            level: jobData.level || 'Nhân viên',
                            expYear: jobData.expYear || 'Không yêu cầu',
                            // Format ngày tháng chuẩn YYYY-MM-DD cho thẻ <input type="date">
                            deadline: jobData.deadline ? jobData.deadline.split('T')[0] : '',
                            description: jobData.description || '',
                            requirement: jobData.requirement || '',
                            benefits: jobData.benefits || ''
                        }));
                        // Đắp Tags cũ vào
                        if (jobData.tags) {
                            setSelectedTags(jobData.tags.map(t => ({ tagId: t.tagId, tagName: t.tagName })));
                        }
                    }
                }
            } catch (err) {
                setError("Lỗi tải dữ liệu. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [jobId, isEditMode, navigate]);

    // 2. XỬ LÝ THAY ĐỔI INPUT
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev,[name]: value }));
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
        const token = localStorage.getItem('token');

        try {
            // Chuẩn bị gói hàng (Payload)
            const payload = {
                ...formData,
                locationId: parseInt(formData.locationId),
                salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
                salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
                tagIds: selectedTags.map(t => t.tagId) // Chỉ lấy mảng các ID gửi xuống Backend
            };

            // Quyết định xem gọi API POST (Tạo mới) hay PUT (Cập nhật)
            const url = isEditMode ? `${API_URLS.JOBS}/${jobId}` : API_URLS.JOBS;
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(`🎉 Đã ${isEditMode ? 'cập nhật' : 'đăng'} tin tuyển dụng thành công! 🌿`);
                navigate('/recruiter-dashboard'); // Xong việc thì về lại phòng điều hành
            } else {
                const errData = await res.json();
                alert(`⚠️ Lỗi: ${errData.message || 'Vui lòng kiểm tra lại thông tin.'}`);
            }
        } catch (err) {
            alert("Lỗi kết nối máy chủ!");
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
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề công việc <span className="text-red-500">*</span></label>
                        <input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="VD: Frontend Developer (ReactJS)" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Khu vực <span className="text-red-500">*</span></label>
                        <select name="locationId" required value={formData.locationId} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white">
                            <option value="">-- Chọn khu vực --</option>
                            {locations.map(loc => (
                                <option key={loc.locationId} value={loc.locationId}>{loc.locationName}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ làm việc cụ thể</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="VD: Tầng 3, Tòa nhà ABC..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Lương Min (Triệu)</label>
                            <input type="number" name="salaryMin" value={formData.salaryMin} onChange={handleChange} placeholder="VD: 10" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Lương Max (Triệu)</label>
                            <input type="number" name="salaryMax" value={formData.salaryMax} onChange={handleChange} placeholder="VD: 20" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Cấp bậc</label>
                            <select name="level" value={formData.level} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white">
                                <option value="Thực tập sinh">Thực tập sinh</option>
                                <option value="Nhân viên">Nhân viên</option>
                                <option value="Trưởng nhóm">Trưởng nhóm</option>
                                <option value="Quản lý">Quản lý</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Kinh nghiệm</label>
                            <select name="expYear" value={formData.expYear} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white">
                                <option value="Không yêu cầu">Không yêu cầu</option>
                                <option value="Dưới 1 năm">Dưới 1 năm</option>
                                <option value="1 - 3 năm">1 - 3 năm</option>
                                <option value="Trên 3 năm">Trên 3 năm</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Hạn chót nộp CV</label>
                        <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth focus:ring-2 focus:ring-earth focus:ring-opacity-20 outline-none transition-all bg-gray-50 focus:bg-white" />
                    </div>
                </div>

                {/* CỘT PHẢI: CHI TIẾT & KỸ NĂNG */}
                <div className="lg:col-span-2 space-y-6 bg-white p-8 rounded-3xl shadow-sm border-t-8 border-olive">
                    <h3 className="text-xl font-bold text-olive border-b border-gray-100 pb-3">Chi tiết công việc</h3>
                    
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

                    {/* KHU VỰC CHỌN TAGS (KỸ NĂNG) */}
                    <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-3">Thẻ kỹ năng (Tags)</label>
                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <select 
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50"
                                value={selectedTagId}
                                onChange={(e) => setSelectedTagId(e.target.value)}
                            >
                                <option value="">-- Chọn kỹ năng yêu cầu --</option>
                                {allTags.map(tag => (
                                    <option key={tag.tagId} value={tag.tagId}>{tag.tagName}</option>
                                ))}
                            </select>
                            <button 
                                type="button"
                                className="bg-olive hover:bg-earth text-white font-bold py-2.5 px-6 rounded-xl transition-colors"
                                onClick={handleAddTag}
                            >
                                + Thêm Tag
                            </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                            {selectedTags.length > 0 ? (
                                selectedTags.map((tag) => (
                                    <span key={tag.tagId} className="inline-flex items-center bg-cream text-olive px-4 py-2 rounded-full text-sm font-medium border border-gray-200 shadow-sm">
                                        {tag.tagName}
                                        <button 
                                            type="button"
                                            className="ml-2 text-red-400 hover:text-red-600 font-bold text-lg leading-none focus:outline-none transform hover:scale-110 transition-transform"
                                            onClick={() => handleRemoveTag(tag.tagId)}
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

                    {/* NÚT LƯU */}
                    <div className="pt-8 text-right">
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className={`px-10 py-3.5 rounded-full text-white font-bold text-lg shadow-md transition-all transform hover:-translate-y-1 ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-earth hover:bg-olive hover:shadow-lg'}`}
                        >
                            {isSaving ? 'Đang lưu...' : (isEditMode ? '💾 Lưu cập nhật' : '🚀 Đăng tin ngay')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default JobFormPage;