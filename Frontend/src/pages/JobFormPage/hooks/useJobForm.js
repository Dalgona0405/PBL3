import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_URLS } from '../../../api/api';
import axiosClient from '../../../api/axiosClient';
import { useAuth } from '../../../contexts/AuthContext';
import useDebounce from '../../../hooks/useDebounce';
import { validateJobForm } from '../../../utils/formValidators';

const INITIAL_FORM_DATA = {
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
    companyId: null
};

export function useJobForm(jobId) {
    const navigate = useNavigate();
    const isEditMode = Boolean(jobId);
    const { user } = useAuth();

    const [locations, setLocations] = useState([]);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [selectedTags, setSelectedTags] = useState([]);
    const [tagKeyword, setTagKeyword] = useState('');
    const debouncedTagKeyword = useDebounce(tagKeyword, 300);
    const [tagSuggestions, setTagSuggestions] = useState([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                const [locRes, hrRes] = await Promise.all([
                    axiosClient.get(API_URLS.LOCATION),
                    axiosClient.get(`${API_URLS.RECRUITERS}/${user.id}`)
                ]);

                setLocations(Array.isArray(locRes) ? locRes : []);
                setFormData(prev => ({ ...prev, companyId: hrRes?.company?.companyId || null }));

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
            } catch {
                const msg = 'Lỗi tải dữ liệu. Vui lòng thử lại sau!';
                setError(msg);
                toast.error(msg);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [jobId, isEditMode, navigate, user]);

    useEffect(() => {
        const fetchTagSuggestions = async () => {
            if (debouncedTagKeyword.trim().length < 1) {
                setTagSuggestions([]);
                setShowTagDropdown(false);
                return;
            }

            setIsSuggesting(true);
            try {
                const data = await axiosClient.get(`${API_URLS.TAGS}/suggest?keyword=${encodeURIComponent(debouncedTagKeyword)}&limit=5`);
                setTagSuggestions(Array.isArray(data) ? data : (data.items || []));
                setShowTagDropdown(true);
            } catch (err) {
                console.error('Lỗi gợi ý tag:', err);
            } finally {
                setIsSuggesting(false);
            }
        };

        fetchTagSuggestions();
    }, [debouncedTagKeyword]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleSelectTag = (tag) => {
        if (!selectedTags.some(t => t.tagId === tag.tagId)) {
            setSelectedTags(prev => [...prev, { tagId: tag.tagId, tagName: tag.tagName }]);
        }
        setTagKeyword('');
        setShowTagDropdown(false);
    };

    const handleRemoveTag = (tagId) => {
        setSelectedTags(prev => prev.filter(t => t.tagId !== tagId));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const { isValid, errors } = validateJobForm(formData);
        if (!isValid) {
            setFieldErrors(errors);
            toast.error('Vui lòng kiểm tra lại thông tin tin tuyển dụng.');
            return;
        }
        setIsSaving(true);
        const toastId = toast.loading(isEditMode ? 'Đang cập nhật tin...' : 'Đang đăng tin...');

        try {
            const payload = {
                ...formData,
                locationId: parseInt(formData.locationId, 10),
                salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
                salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
                tagIds: selectedTags.map(t => t.tagId)
            };

            const url = isEditMode ? `${API_URLS.JOBS}/${jobId}` : API_URLS.JOBS;
            if (isEditMode) {
                await axiosClient.put(url, payload);
            } else {
                await axiosClient.post(url, payload);
            }

            toast.success(`Đã ${isEditMode ? 'cập nhật' : 'đăng'} tin tuyển dụng thành công!`, { id: toastId });
            navigate('/recruiter-dashboard');
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Vui lòng kiểm tra lại thông tin.';
            toast.error(`Lỗi: ${errorMsg}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return {
        isEditMode, locations, formData, fieldErrors, selectedTags,
        tagKeyword, setTagKeyword, tagSuggestions, isSuggesting,
        showTagDropdown, setShowTagDropdown, isLoading, isSaving, error,
        handleChange, handleSelectTag, handleRemoveTag, handleSave,
        goBack: () => navigate('/recruiter-dashboard')
    };
}
