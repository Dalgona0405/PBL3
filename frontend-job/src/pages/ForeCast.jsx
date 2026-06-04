// File: src/pages/ForeCast.jsx
import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';

const CustomYAxisTick = ({ x, y, payload }) => {
    return (
        <text x={x - 10} y={y} dy={4} textAnchor="end" fill="#666" fontSize={13}>
            {payload.value}
        </text>
    );
};

function ForeCast() {
    // 1. STATE: 
    const [overview, setOverview] = useState({});
    const [marketTrend, setMarketTrend] = useState([]);
    const [salaryLocation, setSalaryLocation] = useState([]);
    const [topCompanies, setTopCompanies] = useState([]);
    const [aiSalary, setAiSalary] = useState([]);
    
    // 🌟 STATE MỚI: Chứa dữ liệu Phân bổ lương thay cho Timeline
    const [salaryDistribution, setSalaryDistribution] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const COLORS = ['#8A9A86', '#C19A6B', '#D4C4B7', '#A3B19B', '#E6D5C3', '#d9b382'];

    useEffect(() => {
        const fetchAllReports = async () => {
            try {
                setIsLoading(true);

                // Gọi các API (Đã bỏ API timeline đi cho nhẹ máy)
                const [dashRes, trendRes, salLocRes, compRes, aiRes] = await Promise.all([
                    axiosClient.get(`${API_URLS.REPORTS}/dashboard-summary`).catch(() => null),
                    axiosClient.get(`${API_URLS.REPORTS}/market-trend?limit=10`).catch(() => []),
                    axiosClient.get(`${API_URLS.REPORTS}/salary-by-location`).catch(() => []),
                    axiosClient.get(`${API_URLS.REPORTS}/top-companies?limit=5`).catch(() => []),
                    axiosClient.get(`${API_URLS.REPORTS}/salary-forecast-ai`).catch(() => ({}))
                ]);

                const summaryData = dashRes || {};
                setOverview(summaryData.overview || {});
                
                const charts = summaryData.charts || {};
                setSalaryDistribution(charts.salaryRanges || []);
                setMarketTrend(Array.isArray(trendRes) ? trendRes : []); 
                setSalaryLocation(Array.isArray(salLocRes) ? salLocRes : []); 
                setTopCompanies(Array.isArray(compRes) ? compRes : []); 
                setAiSalary(aiRes?.forecast || []); 

            } catch (err) {
                console.error("Lỗi tổng:", err);
                setError("Hệ thống đang thu thập dữ liệu. Trúc vui lòng quay lại sau nha! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllReports();
    }, []);

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse font-medium">Đang tổng hợp dữ liệu từ AI và Thị trường... 🌿</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    return (
        <div className="max-w-7xl mx-auto w-full pb-12">

            {/* HEADER */}
            <div className="mb-10 border-b-2 border-olive pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-textmain mb-2">📊 Báo Cáo & Dự Báo Thị Trường IT</h2>
                    <p className="text-gray-500">Dữ liệu được tổng hợp và phân tích theo thời gian thực.</p>
                </div>
                <span className="bg-olive text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm flex items-center gap-2">
                    ✨ AI Powered
                </span>
            </div>

            {/* KHỐI 1: 4 THẺ TỔNG QUAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-olive transform transition-transform hover:-translate-y-1">
                    <p className="text-gray-500 font-medium mb-1">Tổng Việc Làm</p>
                    <h3 className="text-4xl font-bold text-textmain">{overview.totalJobs || overview.TotalJobs || 0}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth transform transition-transform hover:-translate-y-1">
                    <p className="text-gray-500 font-medium mb-1">Ứng Viên Đăng Ký</p>
                    <h3 className="text-4xl font-bold text-textmain">{overview.totalCandidates || overview.TotalCandidates || 0}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-olive transform transition-transform hover:-translate-y-1">
                    <p className="text-gray-500 font-medium mb-1">Công Ty Đối Tác</p>
                    <h3 className="text-4xl font-bold text-textmain">{overview.totalCompanies || overview.TotalCompanies || 0}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth transform transition-transform hover:-translate-y-1">
                    <p className="text-gray-500 font-medium mb-1">Tỉ Lệ Ứng Tuyển</p>
                    <h3 className="text-4xl font-bold text-textmain">
                        {overview.applicationRate || overview.ApplicationRate || 0}%
                    </h3>
                </div>
            </div>

            {/* KHỐI 2: KHU VỰC BIỂU ĐỒ */}
            <div className="flex flex-col gap-12">
                
                {/* 1. XU HƯỚNG KỸ NĂNG */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-olive mb-6">🔥 Top Kỹ Năng Đang Hot (Market Trend)</h3>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="99%" height="100%">
                            <BarChart data={marketTrend} layout="vertical" margin={{ left: 20, right: 80, top: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                                <XAxis type="number" stroke="#8A9A86" allowDecimals={false} />
                                <YAxis dataKey="skillName" type="category" stroke="#8A9A86" width={160} tick={<CustomYAxisTick />} />
                                <Tooltip cursor={{ fill: '#f9f9f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="jobCount" name="Số lượng Job" fill="#8A9A86" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. MỨC LƯƠNG THEO KHU VỰC */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-olive mb-6">💰 Mức Lương Theo Khu Vực (Triệu VNĐ)</h3>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="99%" height="100%">
                            <BarChart data={salaryLocation} margin={{ bottom: 20, top: 20, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="locationName" stroke="#8A9A86" angle={-45} textAnchor="end" tick={{ fontSize: 12, fill: '#666' }} height={60} />
                                <YAxis stroke="#8A9A86" tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f9f9f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                                <Bar dataKey="averageMinSalary" name="Lương Tối Thiểu (TB)" fill="#D4C4B7" radius={[4, 4, 0, 0]} barSize={24} />
                                <Bar dataKey="averageMaxSalary" name="Lương Tối Đa (TB)" fill="#C19A6B" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 🌟 3. PHÂN BỔ MỨC LƯƠNG TRÊN HỆ THỐNG (Thay thế cho Timeline) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-xl font-bold text-olive mb-6">📊 Phân Bổ Mức Lương Trên Hệ Thống</h3>
                    <div className="h-80 min-h-[300px] w-full">
                        <ResponsiveContainer width="99%" height="100%">
                            <BarChart data={salaryDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="label" stroke="#8A9A86" tick={{ fontSize: 12 }} />
                                {/* Thêm allowDecimals={false} để trục Y không bị lẻ 0.5 job */}
                                <YAxis stroke="#8A9A86" tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip cursor={{ fill: '#f9f9f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="value" name="Số lượng Job" fill="#C19A6B" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

{/* 🌟 4. TOP CÔNG TY TUYỂN DỤNG (Đã dàn lại Layout: Bánh bên trái, Chữ bên phải) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-olive mb-6 text-center">🏢 Top Công Ty Tuyển Dụng</h3>
                    <div className="h-80 min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={topCompanies}
                                    cx="60%" /* Đẩy cái bánh lệch sang trái 35% */
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="jobCount"
                                    nameKey="companyName"
                                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                >
                                    {topCompanies.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                {/* Xếp danh sách công ty thành cột dọc bên phải */}
                                <Legend 
                                    layout="vertical" 
                                    verticalAlign="middle" 
                                    align="right" 
                                    wrapperStyle={{ width: '55%', fontSize: '16px', lineHeight: '24px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 🌟 5. DỰ BÁO LƯƠNG TỪ AI (Đã bẻ nghiêng chữ và đưa Legend lên top) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth">
                    <h3 className="text-xl font-bold text-earth mb-6 flex items-center gap-2">
                        ✨ Dự Báo Mức Lương (AI Forecast)
                    </h3>
                    <div className="h-96 min-h-[350px] w-full"> {/* Tăng chiều cao lên chút để chứa chữ nghiêng */}
                        {aiSalary.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                {/* Thêm margin bottom để chữ không bị cắt mất */}
                                <LineChart data={aiSalary} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    
                                    {/* Bẻ nghiêng chữ 45 độ và neo ở đuôi chữ (textAnchor="end") */}
                                    <XAxis 
                                        dataKey="skill_name" 
                                        stroke="#8A9A86" 
                                        angle={-45} 
                                        textAnchor="end" 
                                        tick={{ fontSize: 12 }} 
                                        height={60} 
                                    />
                                    
                                    <YAxis stroke="#8A9A86" tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                    
                                    {/* Đưa chú thích lên trên cùng */}
                                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                                    
                                    <Line type="monotone" dataKey="current_salary" name="Lương hiện tại" stroke="#C19A6B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                    <Line type="monotone" dataKey="forecasted_salary" name="AI Dự báo" stroke="#8A9A86" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 italic">
                                Hệ thống AI đang thu thập thêm dữ liệu để đưa ra dự báo chính xác nhất... 🌿
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForeCast;