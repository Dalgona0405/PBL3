import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ADMIN_SHORTCUTS = [
    { path: '/admin/companies', icon: '🏢', title: 'Quản lý Công ty', desc: 'Xem danh sách, xóa công ty vi phạm.', hoverClass: 'hover:bg-cream' },
    { path: '/admin/users', icon: '👥', title: 'Quản lý Người dùng', desc: 'Tra cứu tài khoản, phân quyền hệ thống.', hoverClass: 'hover:bg-cream' },
    { path: '/admin/tags', icon: '🏷️', title: 'Quản lý Kỹ năng', desc: 'Thêm/sửa các Tags công nghệ mới.', hoverClass: 'hover:bg-cream' },
    { path: '/admin/locations', icon: '📍', title: 'Quản lý Địa điểm', desc: 'Thêm/sửa các địa điểm làm việc mới.', hoverClass: 'hover:bg-orange-50' }
];

function AdminChartsAndShortcuts({ apps, salaryData, onNavigate }) {
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full">
                        <h3 className="text-xl font-bold text-olive mb-6 border-b border-gray-50 pb-3">📈 Tốc độ nộp CV</h3>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                                <span className="text-gray-600 font-medium">7 ngày qua</span>
                                <span className="text-2xl font-bold text-earth">+{apps.newLast7Days || 0}</span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                                <span className="text-gray-600 font-medium">30 ngày qua</span>
                                <span className="text-2xl font-bold text-olive">+{apps.newLastMonth || 0}</span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                                <span className="text-gray-600 font-medium">Năm nay</span>
                                <span className="text-2xl font-bold text-textmain">+{apps.newThisYear || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-olive mb-6 border-b border-gray-50 pb-3">💰 Phân bổ mức lương trên hệ thống</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="label" stroke="#8A9A86" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#8A9A86" tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f9f9f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="value" name="Số lượng Job" fill="#C19A6B" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border-t-8 border-olive">
                <h3 className="text-xl font-bold text-olive mb-6 flex items-center gap-2">📌 Lối tắt quản trị</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {ADMIN_SHORTCUTS.map((item) => (
                        <div
                            key={item.path}
                            onClick={() => onNavigate(item.path)}
                            className={`p-5 bg-gray-50 ${item.hoverClass} rounded-2xl border border-gray-100 shadow-sm cursor-pointer transition-colors group`}
                        >
                            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                            <h4 className="font-bold text-textmain mb-1">{item.title}</h4>
                            <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default AdminChartsAndShortcuts;
