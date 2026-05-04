import React, { useState, useEffect } from 'react';
import JobCard from './JobCard';
import { API_URLS } from '../api/api';

// ==========================================
// COMPONENT CON: SKELETON (Khung xám nhấp nháy)
// ==========================================
const JobCardSkeleton = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 flex flex-col h-full animate-pulse">
        <div className="flex items-start gap-4 mb-4">
            {/* Khung Logo */}
            <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0"></div>
            <div className="flex-1">
                {/* Khung Tiêu đề */}
                <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-2"></div>
                <div className="h-5 bg-gray-200 rounded-md w-1/2"></div>
                {/* Khung Tên công ty */}
                <div className="h-4 bg-gray-100 rounded-md w-1/3 mt-3"></div>
            </div>
        </div>
        <div className="flex-1 space-y-3 mb-6 mt-2">
            {/* Khung Lương & Địa điểm */}
            <div className="h-4 bg-gray-100 rounded-md w-1/2"></div>
            <div className="h-4 bg-gray-100 rounded-md w-2/3"></div>
        </div>
        {/* Khung Nút bấm */}
        <div className="w-full h-10 bg-gray-100 rounded-xl"></div>
    </div>
);

// ==========================================
// COMPONENT CHÍNH: JOB LIST
// ==========================================
function JobList({ keyword, companyId }) {
    const [jobs, setJobs] = useState([]);
    const[currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // THÊM STATE MỚI: Theo dõi xem có đang đi lấy dữ liệu không
    const[isFetching, setIsFetching] = useState(true); 

    useEffect(() => {
        setCurrentPage(1);
    }, [keyword, companyId]);

    useEffect(() => {
        // Bắt đầu đi lấy data -> Bật Skeleton lên
        setIsFetching(true); 

        if (companyId) {
            fetch(`${API_URLS.JOBS}/company/${companyId}`)
                .then(response => response.json())
                .then(data => {
                    setJobs(data ||[]);
                    setTotalPages(1);
                })
                .catch(error => console.error('Lỗi lấy dữ liệu công ty:', error))
                .finally(() => setIsFetching(false)); // Lấy xong (dù lỗi hay thành công) -> Tắt Skeleton
        } 
        else {
            const pageSize = 9;
            let url = `${API_URLS.SEARCH}?page=${currentPage}&pageSize=${pageSize}&pageNumber=${currentPage}`;
            
            if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

            fetch(url) 
                .then(response => response.json())
                .then(data => {
                    setJobs(data.data || data.Data ||[]);
                    setTotalPages(data.totalPages || data.TotalPages || 1);
                })
                .catch(error => console.error('Lỗi lấy dữ liệu:', error))
                .finally(() => setIsFetching(false)); // Lấy xong -> Tắt Skeleton
        }
    },[keyword, companyId, currentPage]);

    const handleNextPage = () => setCurrentPage(prev => prev + 1);
    const handlePrevPage = () => setCurrentPage(prev => prev - 1);

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-textmain">
                    {keyword ? `Kết quả cho: "${keyword}"` : "Việc làm mới nhất"}
                </h2>
                <span className="text-gray-400 text-sm">
                    {isFetching ? "Đang tải..." : `Hiển thị ${jobs.length} kết quả`}
                </span>
            </div>

            {/* NẾU ĐANG TẢI DATA -> HIỂN THỊ 9 CÁI SKELETON */}
            {isFetching ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(9)].map((_, index) => (
                        <JobCardSkeleton key={index} />
                    ))}
                </div>
            ) : jobs.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-50">
                    <p className="text-gray-500 text-lg">Không tìm thấy công việc nào phù hợp 🌿</p>
                </div>
            ) : (
                <>
                    {/* NẾU TẢI XONG -> HIỂN THỊ JOB CARD THẬT */}
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

                    {/* Phân trang */}
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