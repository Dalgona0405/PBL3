import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_URLS } from '../../api/api';
import axiosClient from '../../api/axiosClient';
import ForecastOverviewCards from './components/ForecastOverviewCards';
import ForecastChartsSection from './components/ForecastChartsSection';

function ForeCastPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['marketForecast'],
        queryFn: async () => {
            const [dashRes, trendRes, salLocRes, compRes, aiRes] = await Promise.all([
                axiosClient.get(`${API_URLS.REPORTS}/dashboard-summary`).catch(() => null),
                axiosClient.get(`${API_URLS.REPORTS}/market-trend?limit=10`).catch(() => []),
                axiosClient.get(`${API_URLS.REPORTS}/salary-by-location`).catch(() => []),
                axiosClient.get(`${API_URLS.REPORTS}/top-companies?limit=5`).catch(() => []),
                axiosClient.get(`${API_URLS.REPORTS}/salary-forecast-ai`).catch(() => ({}))
            ]);

            const summaryData = dashRes || {};
            const charts = summaryData.charts || {};
            return {
                overview: summaryData.overview || {},
                salaryDistribution: charts.salaryRanges || [],
                marketTrend: Array.isArray(trendRes) ? trendRes : [],
                salaryLocation: Array.isArray(salLocRes) ? salLocRes : [],
                topCompanies: Array.isArray(compRes) ? compRes : [],
                aiSalary: aiRes?.forecast || []
            };
        },
        staleTime: 5 * 60 * 1000
    });

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse font-medium">Đang tổng hợp dữ liệu từ AI và Thị trường... 🌿</div>;
    if (isError) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">Hệ thống đang thu thập dữ liệu. Vui lòng quay lại sau! 🌿</div>;

    const {
        overview = {},
        marketTrend = [],
        salaryLocation = [],
        topCompanies = [],
        aiSalary = [],
        salaryDistribution = []
    } = data || {};

    return (
        <div className="max-w-7xl mx-auto w-full pb-12">
            <div className="mb-10 border-b-2 border-olive pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-textmain mb-2">📊 Báo Cáo & Dự Báo Thị Trường IT</h2>
                    <p className="text-gray-500">Dữ liệu được tổng hợp và phân tích theo thời gian thực.</p>
                </div>
                <span className="bg-olive text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm flex items-center gap-2">
                    ✨ AI Powered
                </span>
            </div>

            <ForecastOverviewCards overview={overview} />

            <ForecastChartsSection
                marketTrend={marketTrend}
                salaryLocation={salaryLocation}
                salaryDistribution={salaryDistribution}
                topCompanies={topCompanies}
                aiSalary={aiSalary}
            />
        </div>
    );
}

export default ForeCastPage;
