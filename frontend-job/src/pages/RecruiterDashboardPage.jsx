import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';

function RecruiterDashboardPage() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State quản lý việc mở/đóng danh sách ứng viên
    const [expandedJobId, setExpandedJobId] = useState(null);
    const [applications, setApplications] = useState({});
    const[loadingApps, setLoadingApps] = useState(false);

    // 1. LẤY DANH SÁCH CÔNG VIỆC CỦA HR
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!savedUser || !token) { navigate('/login'); return; }
        const parsedUser = JSON.parse(savedUser);
        
        if (parsedUser.role !== 'Recruiter') { navigate('/'); return; }

        const fetchJobs = async () => {
            try {
                setIsLoading(true);
                // Gọi API lấy thông tin Recruiter (kèm theo danh sách Jobs của họ)
                const res = await fetch(`${API_URLS.RECRUITERS}/${parsedUser.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!res.ok) throw new Error("Không thể tải dữ liệu.");
                
                const data = await res.json();
                setJobs(data.jobs ||[]); // Lấy mảng jobs từ kết quả trả về
                
            } catch (err) {
                setError("Lỗi kết nối máy chủ. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobs();
    }, [navigate]);

    // 2. HÀM MỞ/ĐÓNG DANH SÁCH ỨNG VIÊN CỦA 1 JOB
    const toggleJobApplications = async (jobId) => {
        if (expandedJobId === jobId) {
            setExpandedJobId(null); // Đang mở thì đóng lại
            return;
        }

        setExpandedJobId(jobId);
        const token = localStorage.getItem('token');
        
        // Nếu đã tải rồi thì không gọi API nữa (Tối ưu hiệu năng)
        if (applications[jobId]) return;

        try {
            setLoadingApps(true);
            const res = await fetch(`${API_URLS.APPLICATIONS}/jobs/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setApplications(prev => ({ ...prev,[jobId]: data }));
            }
        } catch (err) {
            alert("Không thể tải danh sách ứng viên!");
        } finally {
            setLoadingApps(false);
        }
    };

    // 3. HÀM CẬP NHẬT TRẠNG THÁI CV
    const handleUpdateStatus = async (appId, jobId, newStatus) => {
        const token = localStorage.getItem('token');
        try {
            // Backend C# của Trúc dùng PATCH cho API này
            const res = await fetch(`${API_URLS.APPLICATIONS}/${appId}/status`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                // Cập nhật UI ngay lập tức cho mượt
                setApplications(prev => {
                    const jobApps = prev[jobId].map(app => 
                        app.applicationId === appId ? { ...app, status: newStatus } : app
                    );
                    return { ...prev,[jobId]: jobApps };
                });
            } else {
                alert("Cập nhật thất bại! Bạn có quyền đổi trạng thái không?");
            }
        } catch (err) {
            alert("Lỗi mạng, không thể cập nhật trạng thái!");
        }
    };

    // Hàm tô màu Badge trạng thái
    const getStatusBadge = (status) => {
        switch (status) {
            case 1: return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">Chờ duyệt</span>;
            case 2: return <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">Đang xem xét</span>;
            case 3: return <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">Phỏng vấn</span>;
            case 4: return <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Trúng tuyển</span>;
            case 5: return <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-200">Từ chối</span>;
            default: return <span className="bg-gray-50 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">Chưa rõ</span>;
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải dữ liệu... 🌿</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            
            {/* HEADER */}
            <div className="mb-8 border-b-2 border-olive pb-4">
                <h2 className="text-3xl font-bold text-textmain mb-2">🏢 Quản lý Tuyển dụng</h2>
                <p className="text-gray-500">Theo dõi và quản lý các đơn ứng tuyển vào công ty của bạn.</p>
            </div>

            {jobs.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-50">
                    <p className="text-gray-500 text-lg">Công ty bạn chưa đăng tin tuyển dụng nào. 🌿</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {jobs.map(job => (
                        <div key={job.jobId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                            
                            {/* THANH TIÊU ĐỀ CỦA JOB */}
                            <div className="p-6 bg-cream border-l-8 border-earth flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 
                                        className="text-xl font-bold text-olive hover:text-earth cursor-pointer transition-colors mb-2"
                                        onClick={() => navigate(`/detail-job/${job.jobId}`)}
                                    >
                                        {job.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 font-medium">
                                        📍 {job.locationName || 'Chưa cập nhật'} | ⏳ Hạn chót: {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Không thời hạn'}
                                    </p>
                                </div>
                                <button 
                                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${expandedJobId === job.jobId ? 'bg-olive text-white' : 'bg-white text-olive border border-olive hover:bg-olive hover:text-white'}`}
                                    onClick={() => toggleJobApplications(job.jobId)}
                                >
                                    {expandedJobId === job.jobId ? 'Đóng lại 🔼' : 'Xem ứng viên 🔽'}
                                </button>
                            </div>

                            {/* KHU VỰC DANH SÁCH ỨNG VIÊN (Xổ xuống khi bấm nút) */}
                            {expandedJobId === job.jobId && (
                                <div className="p-6 bg-white border-t border-gray-100">
                                    {loadingApps ? (
                                        <p className="text-center text-olive animate-pulse py-4">Đang tải danh sách ứng viên...</p>
                                    ) : applications[job.jobId]?.length > 0 ? (
                                        
                                        /* BẢNG DANH SÁCH ỨNG VIÊN */
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b-2 border-gray-100 text-olive">
                                                        <th className="py-3 px-4 font-bold">Ứng viên</th>
                                                        <th className="py-3 px-4 font-bold">Ngày nộp</th>
                                                        <th className="py-3 px-4 font-bold">CV</th>
                                                        <th className="py-3 px-4 font-bold">Trạng thái</th>
                                                        <th className="py-3 px-4 font-bold">Hành động</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {applications[job.jobId].map(app => (
                                                        <tr key={app.applicationId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-cream border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                                                        {app.candidate?.avatar ? <img src={app.candidate.avatar} alt="avt" className="w-full h-full object-cover"/> : '👤'}
                                                                    </div>
                                                                    <div>
                                                                        <strong className="text-textmain block">{app.candidate?.fullName}</strong>
                                                                        <span className="text-xs text-gray-500">{app.candidate?.email}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4 text-sm text-gray-600">
                                                                {new Date(app.appliedDate).toLocaleDateString('vi-VN')}
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                {app.candidate?.cvUrl ? (
                                                                    <a href={app.candidate.cvUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 hover:underline font-medium text-sm">
                                                                        Xem CV 📄
                                                                    </a>
                                                                ) : <span className="text-gray-400 text-sm italic">Chưa có CV</span>}
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                {getStatusBadge(app.status)}
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                {/* DROPDOWN ĐỔI TRẠNG THÁI */}
                                                                <select 
                                                                    className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-earth focus:border-earth block w-full p-2 outline-none cursor-pointer shadow-sm"
                                                                    value={app.status}
                                                                    onChange={(e) => handleUpdateStatus(app.applicationId, job.jobId, parseInt(e.target.value))}
                                                                >
                                                                    <option value={1}>Chờ duyệt</option>
                                                                    <option value={2}>Đang xem xét</option>
                                                                    <option value={3}>Phỏng vấn</option>
                                                                    <option value={4}>Trúng tuyển</option>
                                                                    <option value={5}>Từ chối</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-500 italic py-8 bg-gray-50 rounded-xl">
                                            Chưa có ứng viên nào nộp CV vào vị trí này. 🌿
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default RecruiterDashboardPage;