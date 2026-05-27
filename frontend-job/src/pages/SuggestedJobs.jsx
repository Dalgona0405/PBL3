import React, { useState, useEffect } from 'react';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import JobCard from '../components/JobCard';

function SuggestedJobs() {
    const { user } = useAuth();
    const [suggestedJobs, setSuggestedJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'Candidate') {
            setIsLoading(false);
            return;
        }

        const fetchSuggestions = async () => {
            try {
                setIsLoading(true);
                const jobsData = await axiosClient.get(`${API_URLS.JOBS}/suggested?topN=6`);
                
                const jobs = jobsData.items || jobsData.Items || jobsData.data || jobsData;
                setSuggestedJobs(Array.isArray(jobs) ? jobs : []);
                
            } catch (error) {
                console.error("Lỗi lấy gợi ý việc làm từ AI:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
    }, [user]);

    // Ẩn khối này nếu không phải Candidate
    if (!user || user.role !== 'Candidate') return null;
    
    // Hiệu ứng loading nhẹ nhàng
    if (isLoading) return <div className="animate-pulse bg-cream p-8 rounded-3xl mb-10 text-olive font-medium">Hệ thống đang phân tích hồ sơ để tìm việc phù hợp nhất với bạn... 🌿</div>;
    
    // Nếu Backend không tìm ra việc nào match, ẩn luôn cho gọn Gamen
    if (suggestedJobs.length === 0) return null; 

    return (
        <div className="bg-gradient-to-r from-cream to-white p-8 rounded-3xl shadow-sm border border-gray-50 mb-10 transform transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-olive flex items-center gap-2">
                        🎯 Việc làm phù hợp với {user.name || 'bạn'}
                    </h2>
                    <p className="text-gray-500 mt-1">
                        Được hệ thống phân tích và gợi ý dựa trên hồ sơ năng lực của bạn.
                    </p>
                </div>
            </div>

            {/* Đổ danh sách việc làm ra các khối Lego JobCard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {suggestedJobs.map((job) => (
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
        </div>
    );
}

export default SuggestedJobs;