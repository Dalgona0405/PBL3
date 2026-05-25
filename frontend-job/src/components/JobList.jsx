// ==========================================
// File: src/components/JobList.jsx
// ==========================================

import React, { useState, useEffect } from 'react';
import JobCard from './JobCard';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';

const JobCardSkeleton = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 flex flex-col h-full animate-pulse">
        <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0"></div>
            <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-2"></div>
                <div className="h-5 bg-gray-200 rounded-md w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded-md w-1/3 mt-3"></div>
            </div>
        </div>
        <div className="flex-1 space-y-3 mb-6 mt-2">
            <div className="h-4 bg-gray-100 rounded-md w-1/2"></div>
            <div className="h-4 bg-gray-100 rounded-md w-2/3"></div>
        </div>
        <div className="w-full h-10 bg-gray-100 rounded-xl"></div>
    </div>
);

// 1. BỎ cái default = {} đi nha Trúc, chỉ để { filters, companyId } thôi
function JobList({ filters, companyId }) {
    const [jobs, setJobs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isFetching, setIsFetching] = useState(true); 

    // 2. Tách các giá trị nhỏ ra để React dễ so sánh (Tránh vòng lặp vô tận)
    // Dùng dấu chấm hỏi (?.) để lỡ filters không có thì nó không bị lỗi
    const keyword = filters?.keyword;
    const locationId = filters?.locationId;
    const tagId = filters?.tagId;
    const minSalary = filters?.minSalary;
    const maxSalary = filters?.maxSalary;

    // Reset về trang 1 nếu bộ lọc thay đổi
    useEffect(() => {
        setCurrentPage(1);
    // 3. Lắng nghe các giá trị nhỏ thay vì lắng nghe cả cục 'filters'
    }, [keyword, locationId, tagId, minSalary, maxSalary, companyId]);

    useEffect(() => {
        setIsFetching(true); 

        if (companyId) {
            axiosClient.get(`${API_URLS.JOBS}/company/${companyId}`)
                .then(response => {
                    const fetchedJobs = response.items || response.Items || response.data || response;
                    setJobs(Array.isArray(fetchedJobs) ? fetchedJobs : []);
                })
                .catch(error => console.error('Lỗi lấy dữ liệu công ty:', error))
                .finally(() => setIsFetching(false)); 
        } else {
            const params = new URLSearchParams();
            params.append('page', currentPage);
            params.append('pageSize', 9);

            if (keyword) params.append('Keyword', keyword);
            if (locationId) params.append('LocationId', locationId);
            if (tagId) params.append('TagId', tagId);
            if (minSalary) params.append('MinSalary', minSalary);
            if (maxSalary) params.append('MaxSalary', maxSalary);

            const url = `${API_URLS.SEARCH}?${params.toString()}`;

            axiosClient.get(url)
                .then(response => {
                    const fetchedJobs = response.items || response.Items || response.data || response;
                    setJobs(Array.isArray(fetchedJobs) ? fetchedJobs : []);
                    setTotalPages(response.totalPages || 1);
                })
                .catch(error => console.error('Lỗi lấy dữ liệu:', error))
                .finally(() => setIsFetching(false)); 
        }
    // 4. Lắng nghe các giá trị nhỏ ở đây luôn
    }, [keyword, locationId, tagId, minSalary, maxSalary, companyId, currentPage]);

    const handleNextPage = () => setCurrentPage(prev => prev + 1);
    const handlePrevPage = () => setCurrentPage(prev => prev - 1);

    return (
        <div className="w-full">
            {!companyId && (
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-textmain">
                        {filters.keyword ? `Kết quả cho: "${filters.keyword}"` : "Việc làm mới nhất"}
                    </h2>
                    <span className="text-gray-400 text-sm">
                        {isFetching ? "Đang tải..." : `Hiển thị ${jobs.length} kết quả`}
                    </span>
                </div>
            )}

            {isFetching ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(companyId ? 3 : 9)].map((_, index) => (
                        <JobCardSkeleton key={index} />
                    ))}
                </div>
            ) : jobs.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-50">
                    <p className="text-gray-500 text-lg">Không tìm thấy công việc nào phù hợp với bộ lọc 🌿</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.map((job, index) => (
                            <JobCard
                                key={job.jobId}
                                jobId={job.jobId}
                                title={job.title}
                                company={job.company}
                                location={job.location}
                                salaryMin={job.salaryMin}
                                salaryMax={job.salaryMax}
                                priority={index < 6} 
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-10 gap-4">
                            <button 
                                onClick={handlePrevPage} 
                                disabled={currentPage === 1 || isFetching}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 1 || isFetching ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-olive text-white hover:bg-opacity-90'}`}
                            >
                                ⬅ Trước
                            </button>
                            
                            <span className="font-medium text-textmain bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                                {currentPage} / {totalPages}
                            </span>

                            <button 
                                onClick={handleNextPage} 
                                disabled={currentPage === totalPages || isFetching}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === totalPages || isFetching ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-olive text-white hover:bg-opacity-90'}`}
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