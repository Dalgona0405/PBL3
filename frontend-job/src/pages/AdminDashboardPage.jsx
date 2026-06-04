import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast'; // Import thêm thư viện thông báo

function AdminDashboardPage() {
    const navigate = useNavigate();

    const [summary, setSummary] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🌟 STATE MỚI: Quản lý trạng thái lúc AI đang đi học
    const [isRetraining, setIsRetraining] = useState(false);

    // Bảng màu Soft Autumn cho biểu đồ Pie
    const PIE_COLORS = ['#8A9A86', '#C19A6B', '#D4C4B7'];

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                const [summaryRes, pendingRes] = await Promise.all([
                    axiosClient.get(`${API_URLS.REPORTS}/dashboard-summary`).catch(() => null),
                    axiosClient.get(`${API_URLS.COMPANY_REQUESTS}/pending`).catch(() => [])
                ]);

                setSummary(summaryRes?.data || summaryRes?.items || summaryRes || {});

                const pendingList = pendingRes?.items || pendingRes?.Items || pendingRes?.data || pendingRes;
                setPendingRequests(Array.isArray(pendingList) ? pendingList : []);

            } catch (err) {
                console.error("Lỗi lấy dữ liệu Admin:", err);
                setError("Không thể tải dữ liệu phòng điều hành. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // 🌟 HÀM MỚI: GỌI API BẮT AI ĐI HỌC LẠI
    const handleRetrainAI = async () => {
        if (!window.confirm("Bạn có muốn cập nhật lại mô hình AI không? Quá trình này có thể mất vài phút tùy thuộc vào lượng dữ liệu mới. 🌿")) {
            return;
        }

        setIsRetraining(true);
        const toastId = toast.loading("🤖 AI đang đọc sách và cập nhật kiến thức mới. Vui lòng đợi...");

        try {
            // Gọi API POST /api/AI/retrain
            await axiosClient.post('/AI/retrain');
            toast.success("🎉 Tuyệt vời! AI đã cập nhật xong kiến thức mới nhất!", { id: toastId });
        } catch (err) {
            console.error("Lỗi khi train AI:", err);
            toast.error("⚠️ Có lỗi xảy ra khi cập nhật AI. Vui lòng thử lại sau.", { id: toastId });
        } finally {
            setIsRetraining(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse font-medium">Đang đồng bộ dữ liệu từ máy chủ... 🌿</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    const overview = summary?.overview || {};
    const charts = summary?.charts || {};
    const forms = summary?.formsAndStatus || {};
    const apps = forms?.applications || {};
    const jobStatus = forms?.jobsByStatus || {};
    const salaryData = charts.salaryRanges || [];

    return (
        <div className="max-w-7xl mx-auto w-full pb-12">

            {/* HEADER */}
            <div className="mb-8 border-b-2 border-olive pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-textmain mb-2">👑 Phòng Điều Hành (Control Room)</h2>
                    <p className="text-gray-500">
                        Cập nhật lần cuối: {summary?.lastUpdated || summary?.LastUpdated ? new Date(summary.lastUpdated || summary.LastUpdated).toLocaleString('vi-VN') : 'Vừa xong'}
                    </p>
                </div>

                {/* 🌟 NÚT RETRAIN AI NẰM Ở ĐÂY */}
                <button
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

            {/* 🚨 KHU VỰC NHẮC VIỆC (ACTION CENTER) */}
            {pendingRequests.length > 0 && (
                <div className="bg-orange-50 border-l-8 border-orange-400 p-6 rounded-2xl shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in-up">
                    <div>
                        <h3 className="text-xl font-bold text-orange-700 flex items-center gap-2 mb-1">⚠️ Cần xử lý gấp!</h3>
                        <p className="text-orange-600 font-medium">
                            Đang có <strong className="text-2xl mx-1">{pendingRequests.length}</strong> công ty mới đang chờ bạn kiểm duyệt.
                        </p>
                    </div>
                    <button onClick={() => navigate('/admin/company-requests')} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-1 whitespace-nowrap">
                        Đi duyệt ngay 🚀
                    </button>
                </div>
            )}

            {/* TẦNG 1: KHỐI THỐNG KÊ TỔNG QUAN (OVERVIEW) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-olive flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center text-2xl shrink-0">👥</div>
                    <div>
                        <p className="text-gray-500 font-medium text-sm mb-1">Tổng Người Dùng</p>
                        <h3 className="text-3xl font-bold text-textmain">
                            {(overview.totalCandidates || overview.TotalCandidates || 0) + (overview.totalRecruiters || overview.TotalRecruiters || 0)}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-2xl shrink-0">🏢</div>
                    <div>
                        <p className="text-gray-500 font-medium text-sm mb-1">Doanh Nghiệp</p>
                        <h3 className="text-3xl font-bold text-textmain">{overview.totalCompanies || overview.TotalCompanies || 0}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-olive flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center text-2xl shrink-0">💼</div>
                    <div>
                        <p className="text-gray-500 font-medium text-sm mb-1">Việc Làm Đang Mở</p>
                        <h3 className="text-3xl font-bold text-textmain">{jobStatus.active || jobStatus.Active || 0}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-earth flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-2xl shrink-0">📤</div>
                    <div>
                        <p className="text-gray-500 font-medium text-sm mb-1">Tổng Lượt Nộp CV</p>
                        <h3 className="text-3xl font-bold text-textmain">{apps.total || apps.Total || 0}</h3>
                    </div>
                </div>
            </div>

            {/* TẦNG 2: TỐC ĐỘ TĂNG TRƯỞNG & BIỂU ĐỒ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

                {/* Cột trái: Tốc độ nộp CV (Application Velocity) */}
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

                {/* Cột giữa: Biểu đồ phân bổ mức lương */}
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

            {/* TẦNG 3: LỐI TẮT QUẢN TRỊ */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border-t-8 border-olive">
                <h3 className="text-xl font-bold text-olive mb-6 flex items-center gap-2">📌 Lối tắt quản trị</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div onClick={() => navigate('/admin/companies')} className="p-5 bg-gray-50 hover:bg-cream rounded-2xl border border-gray-100 shadow-sm cursor-pointer transition-colors group">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🏢</div>
                        <h4 className="font-bold text-textmain mb-1">Quản lý Công ty</h4>
                        <p className="text-xs text-gray-500">Xem danh sách, xóa công ty vi phạm.</p>
                    </div>
                    <div onClick={() => navigate('/admin/users')} className="p-5 bg-gray-50 hover:bg-cream rounded-2xl border border-gray-100 shadow-sm cursor-pointer transition-colors group">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">👥</div>
                        <h4 className="font-bold text-textmain mb-1">Quản lý Người dùng</h4>
                        <p className="text-xs text-gray-500">Tra cứu tài khoản, phân quyền hệ thống.</p>
                    </div>
                    <div onClick={() => navigate('/admin/tags')} className="p-5 bg-gray-50 hover:bg-cream rounded-2xl border border-gray-100 shadow-sm cursor-pointer transition-colors group">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🏷️</div>
                        <h4 className="font-bold text-textmain mb-1">Quản lý Kỹ năng</h4>
                        <p className="text-xs text-gray-500">Thêm/sửa các Tags công nghệ mới.</p>
                    </div>
                    <div onClick={() => navigate('/admin/company-requests')} className="p-5 bg-gray-50 hover:bg-orange-50 rounded-2xl border border-gray-100 shadow-sm cursor-pointer transition-colors group">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🛡️</div>
                        <h4 className="font-bold text-textmain mb-1">Duyệt yêu cầu</h4>
                        <p className="text-xs text-gray-500">Cấp phép cho HR tạo công ty mới.</p>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default AdminDashboardPage;