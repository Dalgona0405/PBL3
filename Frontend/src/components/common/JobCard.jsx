import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import axiosClient from '../../api/axiosClient';
import { API_URLS } from '../../api/api';
import { useSavedJobsStore } from '../../stores/useSavedJobsStore';
import ExplainableScoreCard from './ExplainableScoreCard';

const formatCardSalary = (salaryMin, salaryMax) => {
    if (salaryMin && salaryMax) {
        return salaryMin === salaryMax ? `${salaryMin} triệu` : `${salaryMin} - ${salaryMax} triệu`;
    }
    if (salaryMin && !salaryMax) return `Từ ${salaryMin} triệu`;
    if (!salaryMin && salaryMax) return `Lên đến ${salaryMax} triệu`;
    return 'Thỏa thuận';
};

function JobCard(props) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [imgError, setImgError] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const savedJobIds = useSavedJobsStore((s) => s.savedJobIds);
    const setJobSavedState = useSavedJobsStore((s) => s.setJobSavedState);

    useQuery({
        queryKey: ['savedJobs'],
        queryFn: async () => {
            const data = await axiosClient.get(`${API_URLS.CANDIDATE}/me/saved-jobs`);
            const jobsList = data?.items || data?.Items || data?.data || data;
            const list = Array.isArray(jobsList) ? jobsList : [];
            useSavedJobsStore.getState().setSavedJobIds(list);
            return list;
        },
        enabled: user?.role === 'Candidate',
        staleTime: 2 * 60 * 1000
    });

    const isSaved = props.isSaved !== undefined ? Boolean(props.isSaved) : savedJobIds.includes(props.jobId);

    const displaySalary = formatCardSalary(props.salaryMin, props.salaryMax);
    const isVerified = Boolean(props.company?.isVerified || props.isCompanyVerified);
    const isScraped = Boolean(props.isScraped || props.originalId);
    const isFreelance = Boolean(props.isFreelanceRecruiter || (!props.company?.companyId && !props.companyId));
    const hasAiScore = props.matchScore !== undefined && props.matchScore !== null;

    const handleToggleSave = async (e) => {
        e.stopPropagation();

        if (!user || user.role !== 'Candidate') {
            toast.error('Bạn cần đăng nhập với vai trò Ứng viên để lưu việc làm.');
            return;
        }

        setIsSaving(true);
        try {
            if (isSaved) {
                await axiosClient.delete(`${API_URLS.JOBS}/${props.jobId}/save`);
                setJobSavedState(props.jobId, false);
                queryClient.setQueryData(['savedJobs'], (prev) =>
                    Array.isArray(prev) ? prev.filter((j) => j.jobId !== props.jobId) : prev
                );
                toast.success('Đã bỏ lưu công việc!');
                if (props.onRemove) props.onRemove(props.jobId);
            } else {
                await axiosClient.post(`${API_URLS.JOBS}/${props.jobId}/save`);
                setJobSavedState(props.jobId, true);
                queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
                toast.success('Đã lưu công việc vào danh sách!');
            }
        } catch {
            toast.error('Có lỗi xảy ra, vui lòng thử lại sau.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform-gpu hover:-translate-y-1 border border-gray-100 flex flex-col h-full group relative cursor-pointer"
            onClick={() => navigate(`/detail-job/${props.jobId}`)}
        >
            {(!user || user.role === 'Candidate') && (
                <button
                    type="button"
                    onClick={handleToggleSave}
                    disabled={isSaving}
                    className="absolute top-6 right-6 text-2xl z-10 hover:scale-110 transition-transform focus:outline-none"
                    title={isSaved ? 'Bỏ lưu' : 'Lưu công việc'}
                >
                    {isSaved ? '❤️' : '🤍'}
                </button>
            )}

            <div className="flex items-start gap-4 mb-4 pr-8">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-2xl flex-shrink-0 border border-gray-100 shadow-sm overflow-hidden p-1">
                    {props.company?.logoImg && !imgError ? (
                        <img
                            src={props.company.logoImg}
                            alt={props.company.companyName}
                            className="w-full h-full object-contain"
                            loading={props.priority ? 'eager' : 'lazy'}
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <span className="text-gray-300">🏢</span>
                    )}
                </div>

                <div className="flex-1 pt-0.5 min-w-0">
                    <h3 className="text-lg font-bold text-textmain line-clamp-2 leading-tight mb-1 group-hover:text-olive transition-colors">
                        {props.title}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm text-gray-500 font-medium line-clamp-1">
                            {props.company?.companyName || props.companyName || (isFreelance ? 'Nhà tuyển dụng độc lập' : 'Công ty ẩn danh')}
                        </p>
                        {isVerified && (
                            <span className="inline-flex items-center text-[11px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded-full font-bold shrink-0" title="Doanh nghiệp đã xác minh">
                                ✔️ Đã xác minh
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
                {isFreelance && (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        ⚠️ Nhà tuyển dụng độc lập (Chưa xác minh doanh nghiệp)
                    </span>
                )}
                {hasAiScore && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowBreakdown((prev) => !prev); }}
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors"
                    >
                        🎯 {props.matchScore}% AI {showBreakdown ? '▲' : '▼'}
                    </button>
                )}
                {isScraped && <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">🌐 Tin tổng hợp</span>}
                {props.level && <span className="bg-cream text-olive text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-gray-200">🎓 {props.level}</span>}
                {props.expYear && <span className="bg-gray-50 text-gray-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-gray-200">⏳ {props.expYear}</span>}
            </div>

            {showBreakdown && hasAiScore && (
                <div onClick={(e) => e.stopPropagation()} className="mb-4">
                    <ExplainableScoreCard
                        matchResult={{ matchScore: props.matchScore, breakdown: props.breakdown, missingSkills: props.missingSkills, advice: props.advice }}
                        compact
                    />
                </div>
            )}

            <div className="flex-1 space-y-2 mb-4">
                <div className="flex items-center text-sm font-medium bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-100">
                    <span className="mr-2 opacity-80">💰</span>
                    <span className="text-earth">{displaySalary}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm px-1">
                    <span className="mr-2 opacity-80">📍</span>
                    {props.location?.locationName || 'Chưa cập nhật'}
                </div>
            </div>

            <button type="button" className="w-full py-3 bg-gray-50 text-olive font-bold rounded-xl border border-gray-100 group-hover:bg-olive group-hover:text-white group-hover:border-olive transition-all duration-300">
                Xem chi tiết
            </button>
        </div>
    );
}

export default memo(JobCard);
