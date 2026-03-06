import React, { useState, useEffect } from 'react';
import JobCard from './JobCard';
import { API_URLS } from '../api/api';

function JobList({ keyword }) {
    const [jobs, setJobs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [keyword]);

    useEffect(() => {
        const pageSize = 10;
        
        // Đường link cơ bản sẽ là: http://localhost:5000/api/Search/jobs?page=1&pageSize=10
        let url = `${API_URLS.SEARCH}?page=${currentPage}&pageSize=${pageSize}`;
        
        if (keyword) {
            url += `&keyword=${encodeURIComponent(keyword)}`;
        }

        fetch(url) 
            .then(response => response.json())
            .then(data => {
                console.log("Dữ liệu API (Phân trang):", data);
                setJobs(data.data || data.Data || []);
                setTotalPages(data.totalPages || data.TotalPages || 1);
            })
            .catch(error => console.error('Lỗi lấy dữ liệu:', error));
            
    }, [keyword, currentPage]);

    // --- HÀM XỬ LÝ LẬT TRANG ---
    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    return (
        <div className="job-list-container">
            <h2 className="job-list-title">
                {keyword ? `Kết quả tìm kiếm cho: "${keyword}"` : "Danh sách công việc"}
            </h2>

            {jobs.length === 0 ? (
                <p style={{ textAlign: 'center', marginTop: '30px', color: '#888' }}>
                    Không tìm thấy công việc nào phù hợp 🌿
                </p>
            ) : (
                <>
                    <div className="list-grid">
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

                    {/* --- GIAO DIỆN NÚT BẤM PHÂN TRANG --- */}
                    {totalPages > 1 && (
                        <div className="pagination-container" style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            marginTop: '40px', 
                            gap: '20px', 
                            alignItems: 'center' 
                        }}>
                            <button 
                                onClick={handlePrevPage} 
                                disabled={currentPage === 1} // Nếu đang ở trang 1 thì khóa nút lại
                                style={{ 
                                    background: currentPage === 1 ? '#e0e0e0' : '#8E9775',
                                    color: currentPage === 1 ? '#888' : 'white',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                ⬅ Trang trước
                            </button>
                            
                            <span style={{ fontWeight: 'bold', color: '#4A4A4A' }}>
                                Trang {currentPage} / {totalPages}
                            </span>

                            <button 
                                onClick={handleNextPage} 
                                disabled={currentPage === totalPages} // Nếu đang ở trang cuối thì khóa nút
                                style={{ 
                                    background: currentPage === totalPages ? '#e0e0e0' : '#8E9775',
                                    color: currentPage === totalPages ? '#888' : 'white',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Trang sau ➡
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default JobList;