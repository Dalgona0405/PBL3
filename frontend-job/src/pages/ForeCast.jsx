import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';

function ForeCast() {
    // 1. STATE: Bộ nhớ của Component để lưu dữ liệu từ Backend
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const COLORS = ['#8A9A86', '#C19A6B', '#D4C4B7', '#A3B19B', '#E6D5C3'];

    // 2. EFFECT: Đi lấy dữ liệu khi vừa vào trang
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                // Gọi API lấy tổng hợp dữ liệu thống kê
                const data = await axiosClient.get(`${API_URLS.STATISTICS}/dashboard`);
                setDashboardData(data);
            } catch (err) {
                console.error("Lỗi lấy dữ liệu thống kê:", err);
                setError("Hệ thống đang thu thập dữ liệu. Vui lòng quay lại sau nha! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // 3. GIAO DIỆN KHI ĐANG TẢI HOẶC LỖI
    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse font-medium">Đang phân tích dữ liệu thị trường... 🌿</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;
    if (!dashboardData) return null;

    // Lấy dữ liệu từ mâm (response) ra để dễ dùng
    const { overview, charts } = dashboardData;

    return (
        <div className="max-w-7xl mx-auto w-full pb-12">
            
            {/* HEADER */}
            <div className="mb-8 border-b-2 border-olive pb-4">
                <h2 className="text-3xl font-bold text-textmain mb-2">📈 Bảng Phân Tích & Dự Báo (Dashboard)</h2>
                <p className="text-gray-500">Cái nhìn tổng quan về thị trường việc làm IT hiện tại.</p>
            </div>

            {/* KHỐI 1: CÁC THẺ SỐ LIỆU TỔNG QUAN (OVERVIEW CARDS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-olive transform transition-transform hover:-translate-y-1">
                    <p className="text-gray-500 font-medium mb-1">Tổng Việc Làm</p>
                    <h3 className="text-4xl font-bold text-textmain">{overview?.totalJobs || 0}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth transform transition-transform hover:-translate-y-1">
                    <p className="text-gray-500 font-medium mb-1">Ứng Viên Đăng Ký</p>
                    <h3 className="text-4xl font-bold text-textmain">{overview?.totalCandidates || 0}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-olive transform transition-transform hover:-translate-y-1">
                    <p className="text-gray-500 font-medium mb-1">Công Ty Đối Tác</p>
                    <h3 className="text-4xl font-bold text-textmain">{overview?.totalCompanies || 0}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth transform transition-transform hover:-translate-y-1">
                    <p className="text-gray-500 font-medium mb-1">Tỉ Lệ Ứng Tuyển</p>
                    <h3 className="text-4xl font-bold text-textmain">{overview?.applicationRate || 0}%</h3>
                </div>
            </div>

            {/* KHỐI 2: KHU VỰC BIỂU ĐỒ (CHARTS) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Biểu đồ 1: Xu hướng tuyển dụng (Line Chart) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-olive mb-6">📈 Xu hướng tuyển dụng (6 tháng qua)</h3>
                    {/* Thêm min-h-[300px] để đảm bảo hộp luôn có chiều cao */}
                    <div className="h-80 min-h-[300px] w-full">
                        <ResponsiveContainer width="99%" height="100%" minWidth={1}>
                            <LineChart data={charts?.hiringTrends || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="period" stroke="#8A9A86" />
                                <YAxis stroke="#8A9A86" />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                <Line type="monotone" dataKey="actual" name="Thực tế" stroke="#8A9A86" strokeWidth={3} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="forecast" name="Dự báo" stroke="#C19A6B" strokeWidth={3} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Biểu đồ 2: Phân bố mức lương (Bar Chart) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-olive mb-6">💰 Phân bố mức lương (Triệu VNĐ)</h3>
                    <div className="h-80 min-h-[300px] w-full">
                        <ResponsiveContainer width="99%" height="100%" minWidth={1}>
                            <BarChart data={charts?.salaryRanges || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="label" stroke="#8A9A86" />
                                <YAxis stroke="#8A9A86" />
                                <Tooltip cursor={{ fill: '#f9f9f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="value" name="Số lượng Job" fill="#C19A6B" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Biểu đồ 3: Kỹ năng được yêu cầu nhiều nhất (Pie Chart) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-xl font-bold text-olive mb-6 text-center">🧩 Top Kỹ năng IT đang hot</h3>
                    <div className="h-96 min-h-[350px] w-full">
                        <ResponsiveContainer width="99%" height="100%" minWidth={1}>
                            <PieChart>
                                <Pie
                                    data={charts?.skillDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={130}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {(charts?.skillDistribution || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default ForeCast;