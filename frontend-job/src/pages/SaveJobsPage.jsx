import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import JobCard from '../components/JobCard';

function SavedJobsPage() {
    const navigate = useNavigate();
    const [savedJobs, setSavedJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSavedJobs = async () => {
            try {
                setIsLoading(true);
                // Gọi API lấy danh sách việc làm đã lưu của Candidate
                const data = await axiosClient.get('/Candidates/me/saved-jobs');
                const jobsList = data.items || data.Items || data.data || data;
                setSavedJobs(Array.isArray(jobsList) ? jobsList : []);
            } catch (error) {
                console.error("Lỗi lấy danh sách việc làm đã lưu:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSavedJobs();
    }, []);

    // Hàm này truyền xuống JobCard, để khi user bấm Bỏ lưu (trái tim vỡ), card sẽ biến mất khỏi màn hình
    const handleRemoveJob = (jobId) => {
        setSavedJobs(prev => prev.filter(job => job.jobId !== jobId));
    };

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải danh sách việc làm yêu thích... 🌿</div>;

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            <div className="flex justify-between items-end mb-8 border-b-2 border-olive pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-textmain mb-2">❤️ Việc làm đã lưu</h2>
                    <p className="text-gray-500">Danh sách các cơ hội nghề nghiệp bạn đang quan tâm.</p>
                </div>
                <span className="bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100 text-gray-500 font-medium">
                    Đã lưu: <strong className="text-earth">{savedJobs.length}</strong>
                </span>
            </div>

            {savedJobs.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-50">
                    <div className="text-5xl mb-4">📭</div>
                    <p className="text-gray-500 text-lg font-medium mb-6">Bạn chưa lưu công việc nào cả.</p>
                    <button 
                        onClick={() => navigate('/')} 
                        className="bg-earth hover:bg-olive text-white font-bold py-3 px-8 rounded-full shadow-md transition-all transform hover:-translate-y-1"
                    >
                        Khám phá việc làm ngay 🚀
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedJobs.map((item) => {
                        // Tùy thuộc vào C# trả về nguyên object Job hay bọc trong object SavedJob
                        const job = item.job || item.Job || item; 
                        return (
                            <JobCard
                                key={job.jobId}
                                jobId={job.jobId}
                                title={job.title}
                                company={job.company}
                                location={job.location}
                                salaryMin={job.salaryMin}
                                salaryMax={job.salaryMax}
                                isSaved={true} // Báo cho JobCard biết là job này đã lưu rồi (tim đỏ)
                                onRemove={handleRemoveJob} // Truyền hàm xóa xuống
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default SavedJobsPage;