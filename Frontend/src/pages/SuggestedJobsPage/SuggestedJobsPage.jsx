import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import SuggestedJobGrid from './components/SuggestedJobGrid';

function SuggestedJobsPage() {
    const { user } = useAuth();
    const isCandidate = user?.role === 'Candidate';

    const { data: suggestedJobs = [], isLoading } = useQuery({
        queryKey: ['suggestedJobs', user?.id],
        queryFn: async () => {
            const jobsData = await axiosClient.get(`${API_URLS.JOBS}/suggested?topN=6`);
            const jobs = jobsData.items || jobsData.Items || jobsData.data || jobsData;
            return Array.isArray(jobs) ? jobs : [];
        },
        enabled: isCandidate,
        staleTime: 5 * 60 * 1000
    });

    if (!isCandidate) return null;
    if (isLoading) return <div className="animate-pulse bg-cream p-8 rounded-3xl mb-10 text-olive font-medium">Hệ thống đang phân tích hồ sơ để tìm việc phù hợp nhất với bạn... 🌿</div>;
    if (suggestedJobs.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-50">
                <p className="text-gray-500 text-lg">Chưa có gợi ý việc làm phù hợp. Hãy cập nhật thêm kỹ năng trong Hồ sơ cá nhân! 🌿</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-cream to-white p-8 rounded-3xl shadow-sm border border-gray-50 mb-10 transform transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-olive flex items-center gap-2">
                        🎯 Việc làm phù hợp với {user.name || user.fullName || 'bạn'}
                    </h2>
                    <p className="text-gray-500 mt-1">
                        Được hệ thống phân tích và gợi ý dựa trên hồ sơ năng lực của bạn.
                    </p>
                </div>
            </div>

            <SuggestedJobGrid jobs={suggestedJobs} />
        </div>
    );
}

export default SuggestedJobsPage;
