import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#8A9A86', '#C19A6B', '#D4C4B7', '#A3B19B', '#E6D5C3', '#d9b382'];

const CustomYAxisTick = ({ x, y, payload }) => (
    <text x={x - 10} y={y} dy={4} textAnchor="end" fill="#666" fontSize={13}>
        {payload.value}
    </text>
);

function ForecastChartsSection({ marketTrend, salaryLocation, salaryDistribution, topCompanies, aiSalary }) {
    return (
        <div className="flex flex-col gap-12">
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

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
                <h3 className="text-xl font-bold text-olive mb-6">📊 Phân Bổ Mức Lương Trên Hệ Thống</h3>
                <div className="h-80 min-h-[300px] w-full">
                    <ResponsiveContainer width="99%" height="100%">
                        <BarChart data={salaryDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="label" stroke="#8A9A86" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#8A9A86" tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip cursor={{ fill: '#f9f9f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="value" name="Số lượng Job" fill="#C19A6B" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-olive mb-6 text-center">🏢 Top Công Ty Tuyển Dụng</h3>
                <div className="h-80 min-h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={topCompanies}
                                cx="60%"
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
                            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ width: '55%', fontSize: '16px', lineHeight: '24px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth">
                <h3 className="text-xl font-bold text-earth mb-6 flex items-center gap-2">✨ Dự Báo Mức Lương (AI Forecast)</h3>
                <div className="h-96 min-h-[350px] w-full">
                    {aiSalary.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={aiSalary} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="skill_name" stroke="#8A9A86" angle={-45} textAnchor="end" tick={{ fontSize: 12 }} height={60} />
                                <YAxis stroke="#8A9A86" tick={{ fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
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
    );
}

export default ForecastChartsSection;
