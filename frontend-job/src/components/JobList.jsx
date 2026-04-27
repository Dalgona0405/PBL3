import React, { useState, useEffect } from 'react';
import JobCard from './JobCard';
import { API_URLS } from '../api/api';

function JobList({ keyword, companyId }) {
    const [jobs, setJobs] = useState([]);
    const[currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [keyword, companyId]);

    useEffect(() => {
        if (companyId) {
            fetch(API_URLS.JOBS)
                .then(response => response.json())
                .then(data => {
                    const companyJobs = data.filter(job => job.company?.companyId === parseInt(companyId));
                    setJobs(companyJobs);
                    setTotalPages(1);
                })
                .catch(error => console.error('Lỗi lấy dữ liệu công ty:', error));
        } else {
            const pageSize = 9; // Đổi thành 9 cho đẹp lưới 3 cột
            let url = `${API_URLS.SEARCH}?page=${currentPage}&pageSize=${pageSize}&pageNumber=${currentPage}`;
            if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

            fetch(url) 
                .then(response => response.json())
                .then(data => {
                    setJobs(data.data || data.Data ||[]);
                    setTotalPages(data.totalPages || data.TotalPages || 1);
                })
                .catch(error => console.error('Lỗi lấy dữ liệu:', error));
        }
    }, [keyword, companyId, currentPage]);

    const handleNextPage = () => setCurrentPage(prev => prev + 1);
    const handlePrevPage = () => setCurrentPage(prev => prev - 1);

    return (
        <div className="w-full">
            {/* Tiêu đề danh sách */}
            <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-textmain">
                    {keyword ? `Kết quả cho: "${keyword}"` : "Việc làm mới nhất"}
                </h2>
                <span className="text-gray-400 text-sm">Hiển thị {jobs.length} kết quả</span>
            </div>

            {jobs.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-50">
                    <p className="text-gray-500 text-lg">Không tìm thấy công việc nào phù hợp 🌿</p>
                    <p className="text-sm text-gray-400 mt-2">Trúc nhớ bật Backend C# lên nha!</p>
                </div>
            ) : (
                <>
                    {/* Lưới Grid: Điện thoại 1 cột, Tablet 2 cột, PC 3 cột */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.map((job) => (
                            <JobCard
                                key={job.jobId}
                                jobId={job.jobId}
                                title={job.title}
                                company={job.company}
                                location={job.location}
                                salaryMin={job.salaryMin}
                                salaryMax={job.salaryMax}
                            />
                        ))}
                    </div>

                    {/* Phân trang */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-10 gap-4">
                            <button 
                                onClick={handlePrevPage} 
                                disabled={currentPage === 1}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-olive text-white hover:bg-opacity-90'}`}
                            >
                                ⬅ Trước
                            </button>
                            
                            <span className="font-medium text-textmain bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                                {currentPage} / {totalPages}
                            </span>

                            <button 
                                onClick={handleNextPage} 
                                disabled={currentPage === totalPages}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-olive text-white hover:bg-opacity-90'}`}
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