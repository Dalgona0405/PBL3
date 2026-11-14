import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import AdminOverviewCards from './components/AdminOverviewCards';
import AdminChartsAndShortcuts from './components/AdminChartsAndShortcuts';

function AdminDashboardPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isRetraining, setIsRetraining] = useState(false);
    const [isTogglingScraped, setIsTogglingScraped] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['adminDashboard'],
        queryFn: async () => {
            const [summaryRes, scrapedRes] = await Promise.all([
                axiosClient.get(`${API_URLS.REPORTS}/dashboard-summary`),
                axiosClient.get(`${API_URLS.JOBS}/scraped-visibility`).catch(() => ({ showScrapedJobs: true }))
            ]);
            return {
                summary: summaryRes?.data || summaryRes?.items || summaryRes || {},
                showScrapedJobs: Boolean(scrapedRes?.showScrapedJobs)
            };
        }
    });

    const summary = data?.summary || null;
    const showScrapedJobs = data?.showScrapedJobs ?? true;

    const handleToggleScrapedJobs = async () => {
        setIsTogglingScraped(true);
        const nextValue = !showScrapedJobs;
        const toastId = toast.loading('Đang cập nhật chế độ hiển thị tin cào...');

        try {
            const res = await axiosClient.patch(`${API_URLS.JOBS}/scraped-visibility?show=${nextValue}`);
            const updatedValue = Boolean(res?.showScrapedJobs ?? nextValue);
            queryClient.setQueryData(['adminDashboard'], (prev) =>
                prev ? { ...prev, showScrapedJobs: updatedValue } : prev
            );
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            toast.success(res?.message || 'Đã cập nhật hiển thị tin tổng hợp thị trường!', { id: toastId });
        } catch {
            toast.error('Không thể thay đổi cài đặt hiển thị tin cào.', { id: toastId });
        } finally {
            setIsTogglingScraped(false);
        }
    };

    const handleRetrainAI = async () => {
        if (!window.confirm('Bạn có muốn cập nhật lại mô hình AI không? Quá trình này có thể mất vài phút tùy thuộc vào lượng dữ liệu mới.')) {
            return;
        }

        setIsRetraining(true);
        const toastId = toast.loading('AI đang đồng bộ và cập nhật kiến thức mới. Vui lòng đợi...');

        try {
            await axiosClient.post(`${API_URLS.AI}/retrain`);
            toast.success('AI đã cập nhật xong kiến thức mới nhất!', { id: toastId });
        } catch (err) {
            console.error('Lỗi khi train AI:', err);
            toast.error('Có lỗi xảy ra khi cập nhật AI. Vui lòng thử lại sau.', { id: toastId });
        } finally {
            setIsRetraining(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse font-medium">Đang đồng bộ dữ liệu từ máy chủ... 🌿</div>;
    if (isError) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">Không thể tải dữ liệu phòng điều hành. Vui lòng thử lại sau!</div>;

    const overview = summary?.overview || {};
    const charts = summary?.charts || {};
    const forms = summary?.formsAndStatus || {};
    const apps = forms?.applications || {};
    const jobStatus = forms?.jobsByStatus || {};
    const salaryData = charts.salaryRanges || [];
    const lastUpdated = summary?.lastUpdated || summary?.LastUpdated;

    return (
        <div className="max-w-7xl mx-auto w-full pb-12">
            <div className="mb-8 border-b-2 border-olive pb-4 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-textmain mb-2">👑 Phòng Điều Hành (Control Room)</h2>
                    <p className="text-gray-500">
                        Cập nhật lần cuối: {lastUpdated ? new Date(lastUpdated).toLocaleString('vi-VN') : 'Vừa xong'}
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={handleToggleScrapedJobs}
                        disabled={isTogglingScraped}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold shadow-sm border transition-all ${showScrapedJobs ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}
                    >
                        <span>🌐</span>
                        <span>Tin cào thị trường: {showScrapedJobs ? 'Đang BẬT' : 'Đang TẮT'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleRetrainAI}
                        disabled={isRetraining}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-md transition-all transform ${isRetraining ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-earth text-white hover:bg-olive hover:-translate-y-1'}`}
                    >
                        {isRetraining ? (
                            <><span className="animate-spin text-xl">⏳</span> Đang huấn luyện AI...</>
                        ) : (
                            <><span className="text-xl">🧠</span> Cập nhật dữ liệu AI</>
                        )}
                    </button>
                </div>
            </div>

            <AdminOverviewCards overview={overview} jobStatus={jobStatus} apps={apps} />
            <AdminChartsAndShortcuts apps={apps} salaryData={salaryData} onNavigate={navigate} />
        </div>
    );
}

export default AdminDashboardPage;
