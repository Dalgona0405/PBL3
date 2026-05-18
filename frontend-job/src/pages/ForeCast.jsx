import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';

function ForeCast() {
    // 1. STATE: Chuẩn bị các "cái mâm" để đựng dữ liệu từ 6 API khác nhau
    const [overview, setOverview] = useState(null);
    const [marketTrend, setMarketTrend] = useState([]);
    const [salaryLocation, setSalaryLocation] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [topCompanies, setTopCompanies] = useState([]);
    const [aiSalary, setAiSalary] = useState([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Bảng màu chuẩn "Soft Autumn" của Trúc
    const COLORS = ['#8A9A86', '#C19A6B', '#D4C4B7', '#A3B19B', '#E6D5C3', '#d9b382'];

    // 2. EFFECT: Tuyệt chiêu Promise.all - Gọi 6 anh bồi bàn chạy cùng lúc
    // 2. EFFECT: Tuyệt chiêu Promise.all - Gọi 6 anh bồi bàn chạy cùng lúc
    useEffect(() => {
        const fetchAllReports = async () => {
            try {
                setIsLoading(true);
                
                const [
                    dashRes,
                    trendRes,
                    salLocRes,
                    timeRes,
                    compRes,
                    aiRes
                ] = await Promise.all([
                    axiosClient.get(`${API_URLS.STATISTICS}/dashboard`).catch(() => null),
                    axiosClient.get(`${API_URLS.REPORTS}/market-trend?limit=10`).catch(() => null),
                    axiosClient.get(`${API_URLS.REPORTS}/salary-by-location`).catch(() => null),
                    axiosClient.get(`${API_URLS.REPORTS}/application-timeline?period=month&months=6`).catch(() => null),
                    axiosClient.get(`${API_URLS.REPORTS}/top-companies?limit=5`).catch(() => null),
                    axiosClient.get(`${API_URLS.STATISTICS}/salary-chart-from-ai`).catch(() => null)
                ]);

                // HÀM MẸO: Lục tìm cái Hộp (Array) bên trong cái Khay (Object) do Backend C# trả về
                const extractArray = (res) => {
                    if (!res) return []; // Nếu lỗi hoặc không có data thì trả về mảng rỗng
                    if (Array.isArray(res)) return res; // Nếu đã là mảng rồi thì lấy luôn
                    if (Array.isArray(res.items)) return res.items; // Nếu C# bọc trong chữ 'items'
                    if (Array.isArray(res.Items)) return res.Items; // Nếu C# bọc trong chữ 'Items'
                    if (Array.isArray(res.data)) return res.data;   // Nếu C# bọc trong chữ 'data'
                    return []; // Nếu tìm hoài không thấy mảng nào thì trả về mảng rỗng cho an toàn
                };

                // Đổ thức ăn vào đúng từng mâm (Đã qua màng lọc an toàn)
                setOverview(dashRes?.overview || dashRes || null);
                setMarketTrend(extractArray(trendRes));
                setSalaryLocation(extractArray(salLocRes));
                setTimeline(extractArray(timeRes));
                setTopCompanies(extractArray(compRes));
                setAiSalary(extractArray(aiRes));

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
            <div className="mb-8 border-b-2 border-olive pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-textmain mb-2">📊 Báo Cáo & Dự Báo Thị Trường IT</h2>
                    <p className="text-gray-500">Dữ liệu được tổng hợp và phân tích theo thời gian thực.</p>
                </div>
                <span className="bg-earth text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm flex items-center gap-2">
                    ✨ AI Powered
                </span>
            </div>

            {/* KHỐI 1: TỔNG QUAN (Từ API /Statistics/dashboard) */}
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

            {/* KHỐI 2: CÁC BIỂU ĐỒ CHI TIẾT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. XU HƯỚNG KỸ NĂNG (Từ API /Reports/market-trend) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-olive mb-6">🔥 Top Kỹ Năng Đang Hot (Market Trend)</h3>
                    <div className="h-80 min-h-[300px] w-full">
                        <ResponsiveContainer width="99%" height="100%">
                            <BarChart data={marketTrend} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                                <XAxis type="number" stroke="#8A9A86" />
                                <YAxis dataKey="skillName" type="category" stroke="#8A9A86" width={80} />
                                <Tooltip cursor={{ fill: '#f9f9f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="jobCount" name="Số lượng Job" fill="#8A9A86" radius={[0, 8, 8, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. MỨC LƯƠNG THEO KHU VỰC (Từ API /Reports/salary-by-location) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-olive mb-6">💰 Mức Lương Theo Khu Vực (Triệu VNĐ)</h3>
                    <div className="h-80 min-h-[300px] w-full">
                        <ResponsiveContainer width="99%" height="100%">
                            <BarChart data={salaryLocation}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="locationName" stroke="#8A9A86" />
                                <YAxis stroke="#8A9A86" />
                                <Tooltip cursor={{ fill: '#f9f9f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                <Bar dataKey="averageMinSalary" name="Lương Tối Thiểu (TB)" fill="#D4C4B7" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="averageMaxSalary" name="Lương Tối Đa (TB)" fill="#C19A6B" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. LƯỢNG ỨNG TUYỂN THEO THỜI GIAN (Từ API /Reports/application-timeline) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-xl font-bold text-olive mb-6">📈 Lưu Lượng Ứng Tuyển (Timeline)</h3>
                    <div className="h-80 min-h-[300px] w-full">
                        <ResponsiveContainer width="99%" height="100%">
                            <AreaChart data={timeline}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8A9A86" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8A9A86" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="period" stroke="#8A9A86" />
                                <YAxis stroke="#8A9A86" />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="count" name="Số lượt nộp CV" stroke="#8A9A86" fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. TOP CÔNG TY TUYỂN DỤNG (Từ API /Reports/top-companies) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-olive mb-6 text-center">🏢 Top Công Ty Tuyển Dụng</h3>
                    <div className="h-80 min-h-[300px] w-full">
                        <ResponsiveContainer width="99%" height="100%">
                            <PieChart>
                                <Pie
                                    data={topCompanies}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="jobCount"
                                    nameKey="companyName"
                                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                >
                                    {topCompanies.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. DỰ BÁO LƯƠNG TỪ AI (Từ API /Statistics/salary-chart-from-ai) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth">
                    <h3 className="text-xl font-bold text-earth mb-6 flex items-center gap-2">
                        ✨ Dự Báo Mức Lương (AI Forecast)
                    </h3>
                    <div className="h-80 min-h-[300px] w-full">
                        <ResponsiveContainer width="99%" height="100%">
                            <LineChart data={aiSalary}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="label" stroke="#C19A6B" />
                                <YAxis stroke="#C19A6B" />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                <Line type="monotone" dataKey="actual" name="Thực tế" stroke="#8A9A86" strokeWidth={3} />
                                <Line type="monotone" dataKey="predicted" name="AI Dự báo" stroke="#C19A6B" strokeWidth={3} strokeDasharray="5 5" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default ForeCast;