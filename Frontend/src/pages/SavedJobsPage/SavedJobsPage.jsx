import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import { useSavedJobsStore } from '../../stores/useSavedJobsStore';
import SavedJobsList from './components/SavedJobsList';

function SavedJobsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const setJobSavedState = useSavedJobsStore((s) => s.setJobSavedState);

    const { data: savedJobs = [], isLoading } = useQuery({
        queryKey: ['savedJobs'],
        queryFn: async () => {
            const data = await axiosClient.get(`${API_URLS.CANDIDATE}/me/saved-jobs`);
            const jobsList = data?.items || data?.Items || data?.data || data;
            const list = Array.isArray(jobsList) ? jobsList : [];
            useSavedJobsStore.getState().setSavedJobIds(list);
            return list;
        }
    });

    const handleRemoveJob = (jobId) => {
        setJobSavedState(jobId, false);
        queryClient.setQueryData(['savedJobs'], (prev = []) =>
            Array.isArray(prev) ? prev.filter((job) => job.jobId !== jobId) : []
        );
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
                <SavedJobsList savedJobs={savedJobs} onRemoveJob={handleRemoveJob} />
            )}
        </div>
    );
}

export default SavedJobsPage;
