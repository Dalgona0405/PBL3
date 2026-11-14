import React, { useRef } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import JobCard from './JobCard';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import { useJobFilterStore } from '../../stores/useJobFilterStore';

const JobCardSkeleton = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 flex flex-col h-full animate-pulse">
        <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded-md w-1/2"></div>
            </div>
        </div>
        <div className="flex-1 space-y-3 mb-6 mt-2">
            <div className="h-4 bg-gray-100 rounded-md w-1/2"></div>
            <div className="h-4 bg-gray-100 rounded-md w-2/3"></div>
        </div>
        <div className="w-full h-10 bg-gray-100 rounded-xl"></div>
    </div>
);

const getPageNumbers = (currentPage, totalPages) => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i += 1) {
        pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
};

function JobList({ filters, companyId, companyInfo }) {
    const storePage = useJobFilterStore((state) => state.currentPage);
    const setStorePage = useJobFilterStore((state) => state.setCurrentPage);
    const currentPage = companyId ? 1 : storePage;
    const listTopRef = useRef(null);

    const keyword = filters?.keyword || '';
    const locationId = filters?.locationId || '';
    const tagId = filters?.tagId || '';
    const minSalary = filters?.minSalary || '';
    const maxSalary = filters?.maxSalary || '';
    const level = filters?.level || '';
    const expYear = filters?.expYear || '';

    const { data, isLoading, isFetching } = useQuery({
        queryKey: companyId
            ? ['companyJobs', companyId]
            : ['jobs', { keyword, locationId, tagId, minSalary, maxSalary, level, expYear, page: currentPage }],
        queryFn: async () => {
            if (companyId) {
                const res = await axiosClient.get(`${API_URLS.JOBS}/company/${companyId}`);
                const items = Array.isArray(res) ? res : (res.items || res.Items || res.data || []);
                return { items, totalPages: 1, totalCount: items.length };
            }
            const params = new URLSearchParams({ page: String(currentPage), pageSize: '9' });
            if (keyword) params.append('Keyword', keyword);
            if (locationId) params.append('LocationId', locationId);
            if (tagId) params.append('TagId', tagId);
            if (minSalary) params.append('MinSalary', minSalary);
            if (maxSalary) params.append('MaxSalary', maxSalary);
            if (level) params.append('Level', level);
            if (expYear) params.append('ExpYear', expYear);

            const res = await axiosClient.get(`${API_URLS.SEARCH}?${params.toString()}`);
            const items = res.items || (Array.isArray(res) ? res : []);
            return { items, totalPages: res.totalPages || 1, totalCount: res.totalCount ?? items.length };
        },
        placeholderData: keepPreviousData
    });

    const jobs = data?.items || [];
    const totalPages = data?.totalPages || 1;
    const totalCount = data?.totalCount ?? jobs.length;

    const handlePageChange = (page) => {
        if (companyId || page === currentPage || page < 1 || page > totalPages) return;
        setStorePage(page);
        listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="w-full" ref={listTopRef}>
            {!companyId && (
                <div className="flex flex-wrap justify-between items-end gap-2 mb-6">
                    <h2 className="text-2xl font-bold text-textmain">
                        {keyword ? `Kết quả cho: "${keyword}"` : 'Việc làm mới nhất'}
                    </h2>
                    <span className="text-gray-500 text-sm font-medium">
                        {isLoading ? 'Đang tải...' : `Tìm thấy ${totalCount} việc làm`}
                    </span>
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(companyId ? 3 : 9)].map((_, index) => <JobCardSkeleton key={index} />)}
                </div>
            ) : jobs.length === 0 ? (
                <div className="bg-floral rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-lg">Không tìm thấy công việc nào phù hợp với bộ lọc 🌿</p>
                </div>
            ) : (
                <>
                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity ${isFetching ? 'opacity-70' : 'opacity-100'}`}>
                        {jobs.map((job, index) => (
                            <JobCard
                                key={job.jobId}
                                jobId={job.jobId}
                                title={job.title}
                                company={job.company || companyInfo}
                                location={job.location}
                                salaryMin={job.salaryMin}
                                salaryMax={job.salaryMax}
                                level={job.level}
                                expYear={job.expYear}
                                isScraped={Boolean(job.isScraped || job.originalId)}
                                originalId={job.originalId}
                                isCompanyVerified={Boolean(job.company?.isVerified || companyInfo?.isVerified || job.isCompanyVerified)}
                                tags={job.tags}
                                priority={index < 6}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex flex-wrap justify-center items-center mt-10 gap-2">
                            <button
                                type="button"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || isFetching}
                                className={`px-3.5 py-2 rounded-xl font-semibold text-sm transition-colors ${currentPage === 1 || isFetching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-olive border border-gray-200 hover:bg-olive hover:text-white'}`}
                            >
                                ⬅ Trước
                            </button>

                            {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                                page === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 font-bold">...</span>
                                ) : (
                                    <button
                                        type="button"
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-colors ${page === currentPage ? 'bg-olive text-white shadow-md' : 'bg-white text-textmain border border-gray-200 hover:bg-cream hover:text-olive'}`}
                                    >
                                        {page}
                                    </button>
                                )
                            )}

                            <button
                                type="button"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || isFetching}
                                className={`px-3.5 py-2 rounded-xl font-semibold text-sm transition-colors ${currentPage === totalPages || isFetching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-olive border border-gray-200 hover:bg-olive hover:text-white'}`}
                            >
                                Sau ➡
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default JobList;
