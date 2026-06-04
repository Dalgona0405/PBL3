import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import useDebounce from '../hooks/useDebounce';
import CandidateDetailModal from '../components/CandidateDetailModal';

function JobApplicationsPage() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [stats, setStats] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const debouncedSearch = useDebounce(searchKeyword, 300);

    // 🌟 STATE: Quản lý Hộp thoại (Modal) cập nhật trạng thái
    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        appId: null,
        candidateName: '',
    });

    // 🌟 STATE: Lưu dữ liệu HR nhập vào form
    const [statusForm, setStatusForm] = useState({
        status: 1,
        message: '',
        interviewTime: '',
        interviewLocation: ''
    });

    // 🌟 STATE: Quản lý Hộp thoại XEM LẠI phản hồi đã gửi
    const [viewFeedbackModal, setViewFeedbackModal] = useState({
        isOpen: false,
        data: null // Chứa toàn bộ thông tin của đơn ứng tuyển đó
    });
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }

        const fetchData = async () => {
            try {
                setIsLoading(true);
                // 🌟 GỌI SONG SONG 2 API CÙNG LÚC (Lấy danh sách & Lấy thống kê)
                const [appsData, statsData] = await Promise.all([
                    axiosClient.get(`${API_URLS.APPLICATIONS}/jobs/${jobId}`),
                    axiosClient.get(`${API_URLS.APPLICATIONS}/statistics/job/${jobId}`).catch(() => null)
                ]);

                setApplications(appsData);
                setStats(statsData); // Lưu thống kê vào State
            } catch (err) {
                setError("Lỗi kết nối máy chủ. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [jobId, navigate, user]);

    // 🌟 HÀM MỚI: Khi HR đổi Dropdown trong bảng -> Mở Modal lên thay vì gọi API ngay
    const handleOpenStatusModal = (app, newStatus) => {
        setStatusModal({
            isOpen: true,
            appId: app.applicationId,
            candidateName: app.candidate?.fullName || 'Ứng viên'
        });
        // Reset form và set trạng thái mới HR vừa chọn
        setStatusForm({
            status: newStatus,
            message: '',
            interviewTime: '',
            interviewLocation: ''
        });
    };

    // 🌟 HÀM MỚI: Xử lý khi HR gõ vào form trong Modal
    const handleStatusFormChange = (e) => {
        setStatusForm({ ...statusForm, [e.target.name]: e.target.value });
    };

    // 🌟 HÀM CẬP NHẬT (Đã sửa để gửi thêm message, time, location)
    const handleConfirmUpdateStatus = async () => {
        setIsUpdating(true);
        const toastId = toast.loading("Đang gửi phản hồi cho ứng viên... 🌿");

        try {
            const payload = {
                status: parseInt(statusForm.status),
                message: statusForm.message || null,
                interviewLocation: statusForm.interviewLocation || null,
            };

            if (statusForm.interviewTime) {
                payload.interviewTime = new Date(statusForm.interviewTime).toISOString();
            }

            await axiosClient.patch(`${API_URLS.APPLICATIONS}/${statusModal.appId}/status`, payload);

            setApplications(prev => prev.map(app =>
                app.applicationId === statusModal.appId ? {
                    ...app,
                    status: payload.status,
                    message: payload.message,
                    interviewTime: payload.interviewTime,
                    interviewLocation: payload.interviewLocation
                } : app
            ));

            toast.success("🎉 Đã cập nhật trạng thái và gửi phản hồi thành công!", { id: toastId });
            setStatusModal({ isOpen: false, appId: null, candidateName: '' });
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Cập nhật thất bại! Vui lòng kiểm tra lại.";
            toast.error(errorMsg, { id: toastId });
        } finally {
            setIsUpdating(false);
        }
    };

    // 🌟 LOGIC LỌC FRONTEND (CLIENT-SIDE FILTERING)
    const filteredApplications = applications.filter(app => {
        if (!debouncedSearch) return true; // Nếu không gõ gì thì hiện tất cả

        const keyword = debouncedSearch.toLowerCase();
        const name = app.candidate?.fullName?.toLowerCase() || '';
        const email = app.candidate?.email?.toLowerCase() || '';
        return name.includes(keyword) || email.includes(keyword);
    });

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

    if (isLoading) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải danh sách ứng viên... 🌿</div>;
    if (error) return <div className="text-center mt-20 text-red-500 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;

    const jobTitle = applications.length > 0 ? applications[0].job?.title : "Công việc này";

    return (
        <div className="max-w-6xl mx-auto w-full pb-12 relative">

            {/* NÚT QUAY LẠI & HEADER */}
            <div className="mb-8">
                <button onClick={() => navigate('/recruiter-dashboard')} className="text-gray-500 hover:text-olive font-medium flex items-center gap-2 mb-4 transition-colors">
                    ⬅ Quay lại Dashboard
                </button>
                <div className="border-b-2 border-olive pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-textmain mb-2">👥 Danh sách Ứng viên</h2>
                        <p className="text-gray-500">Đang xem hồ sơ cho vị trí: <strong className="text-earth">{jobTitle}</strong></p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {/* 🌟 Ô TÌM KIẾM CỤC BỘ */}
                        <div className="relative flex-1 md:w-64">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                            <input
                                type="text"
                                placeholder="Tìm tên, email ứng viên..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-earth outline-none bg-white shadow-sm"
                            />
                        </div>

                        <span className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-gray-500 font-medium whitespace-nowrap">
                            Tổng số CV: <strong className="text-olive">{applications.length}</strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* 🌟 KHỐI THỐNG KÊ */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 animate-fade-in-up">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border-t-4 border-gray-400 flex flex-col items-center justify-center text-center">
                        <span className="text-gray-500 text-sm font-bold mb-1">Chờ duyệt</span>
                        <span className="text-2xl font-bold text-gray-700">{stats.pending || 0}</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border-t-4 border-orange-400 flex flex-col items-center justify-center text-center">
                        <span className="text-orange-600 text-sm font-bold mb-1">Đang xem xét</span>
                        <span className="text-2xl font-bold text-orange-700">{stats.reviewed || 0}</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border-t-4 border-blue-400 flex flex-col items-center justify-center text-center">
                        <span className="text-blue-600 text-sm font-bold mb-1">Phỏng vấn</span>
                        <span className="text-2xl font-bold text-blue-700">{stats.interviewing || 0}</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border-t-4 border-green-400 flex flex-col items-center justify-center text-center">
                        <span className="text-green-600 text-sm font-bold mb-1">Trúng tuyển</span>
                        <span className="text-2xl font-bold text-green-700">{stats.accepted || 0}</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border-t-4 border-red-400 flex flex-col items-center justify-center text-center">
                        <span className="text-red-600 text-sm font-bold mb-1">Từ chối</span>
                        <span className="text-2xl font-bold text-red-700">{stats.rejected || 0}</span>
                    </div>
                </div>
            )}

            {/* BẢNG DANH SÁCH ỨNG VIÊN */}
            {filteredApplications.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-50">
                    <p className="text-gray-500 text-lg">
                        {searchKeyword ? "Không tìm thấy ứng viên nào khớp với từ khóa. 🌿" : "Chưa có ứng viên nào nộp CV vào vị trí này. 🌿"}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-cream text-olive border-b-2 border-gray-100">
                                    <th className="py-4 px-6 font-bold">Ứng viên</th>
                                    <th className="py-4 px-6 font-bold">Ngày nộp</th>
                                    <th className="py-4 px-6 font-bold">CV Đính kèm</th>
                                    <th className="py-4 px-6 font-bold">Trạng thái</th>
                                    <th className="py-4 px-6 font-bold">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApplications.map(app => (
                                    <tr key={app.applicationId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                                    {app.candidate?.avatar ? <img src={app.candidate.avatar} alt="avt" className="w-full h-full object-cover" /> : '👤'}
                                                </div>
                                                <div>
                                                    <strong className="text-textmain block text-lg">{app.candidate?.fullName}</strong>
                                                    <span className="text-sm text-gray-500">{app.candidate?.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 font-medium">
                                            {new Date(app.appliedDate).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => setSelectedCandidateId(app.candidate?.userId || app.candidate?.id)}
                                                className="inline-flex items-center gap-2 bg-earth text-white hover:bg-olive px-4 py-1.5 rounded-lg font-bold text-sm transition-colors shadow-sm mb-2"
                                            >
                                                👁️ Xem Hồ sơ
                                            </button>
                                            <br />
                                            {app.candidate?.cvUrl ? (
                                                <a href={app.candidate.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 font-medium text-sm transition-colors underline">
                                                    📄 Tải CV PDF
                                                </a>
                                            ) : <span className="text-gray-400 text-sm italic">Chưa có CV</span>}
                                        </td>
                                        <td className="py-4 px-6">
                                            {getStatusBadge(app.status)}
                                        </td>
                                        <td className="py-4 px-6">
                                            {/* 🌟 Thay vì gọi API ngay, giờ nó sẽ mở Modal */}
                                            <select
                                                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-earth focus:border-earth block w-full p-2.5 outline-none cursor-pointer shadow-sm font-medium"
                                                value={app.status}
                                                onChange={(e) => handleOpenStatusModal(app, parseInt(e.target.value))}
                                            >
                                                <option value={1}>Chờ duyệt</option>
                                                <option value={2}>Đang xem xét</option>
                                                <option value={3}>Phỏng vấn</option>
                                                <option value={4}>Trúng tuyển</option>
                                                <option value={5}>Từ chối</option>
                                            </select>

                                            {(app.message || app.interviewTime || app.interviewLocation) && (
                                                <button
                                                    onClick={() => setViewFeedbackModal({ isOpen: true, data: app })}
                                                    className="mt-3 w-full flex items-center justify-center gap-1 text-xs font-bold text-earth hover:text-olive transition-colors bg-cream py-1.5 rounded-lg border border-gray-200"
                                                >
                                                    💬 Xem phản hồi
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ======================================================= */}
            {/* 🌟 MODAL CẬP NHẬT TRẠNG THÁI & GỬI PHẢN HỒI */}
            {/* ======================================================= */}
            {statusModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border-t-8 border-earth">

                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-cream">
                            <h3 className="text-2xl font-bold text-olive flex items-center gap-2">
                                ✉️ Phản hồi ứng viên
                            </h3>
                            <button onClick={() => setStatusModal({ isOpen: false })} className="text-gray-400 hover:text-red-500 text-3xl leading-none transition-colors">&times;</button>
                        </div>

                        <div className="p-8 space-y-5">
                            <p className="text-gray-600">
                                Đang cập nhật trạng thái cho ứng viên <strong className="text-olive">{statusModal.candidateName}</strong>
                            </p>

                            {/* Trạng thái đang chọn */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Trạng thái mới</label>
                                <select
                                    name="status"
                                    value={statusForm.status}
                                    onChange={handleStatusFormChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-bold outline-none"
                                >
                                    <option value={1}>Chờ duyệt</option>
                                    <option value={2}>Đang xem xét</option>
                                    <option value={3}>Phỏng vấn</option>
                                    <option value={4}>Trúng tuyển</option>
                                    <option value={5}>Từ chối</option>
                                </select>
                            </div>

                            {/* 🌟 LOGIC THÔNG MINH: Chỉ hiện Ngày giờ & Địa điểm nếu chọn "Phỏng vấn" (status == 3) */}
                            {parseInt(statusForm.status) === 3 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <div>
                                        <label className="block text-sm font-bold text-blue-800 mb-2">⏰ Thời gian phỏng vấn</label>
                                        <input
                                            type="datetime-local"
                                            name="interviewTime"
                                            value={statusForm.interviewTime}
                                            onChange={handleStatusFormChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-blue-800 mb-2">📍 Địa điểm / Link Zoom</label>
                                        <input
                                            type="text"
                                            name="interviewLocation"
                                            placeholder="VD: meet.google.com/..."
                                            value={statusForm.interviewLocation}
                                            onChange={handleStatusFormChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Lời nhắn (Message) - Luôn hiện */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">💬 Lời nhắn cho ứng viên (Tùy chọn)</label>
                                <textarea
                                    name="message"
                                    rows="3"
                                    placeholder={parseInt(statusForm.status) === 5 ? "Cảm ơn bạn đã quan tâm, nhưng hiện tại..." : "Nhập lời nhắn..."}
                                    value={statusForm.message}
                                    onChange={handleStatusFormChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-earth outline-none bg-gray-50 focus:bg-white resize-none"
                                ></textarea>
                            </div>
                        </div>

                        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setStatusModal({ isOpen: false })} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">Hủy bỏ</button>
                            <button
                                onClick={handleConfirmUpdateStatus}
                                disabled={isUpdating}
                                className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-md transition-all ${isUpdating ? 'bg-gray-400 cursor-not-allowed' : 'bg-earth hover:bg-olive hover:-translate-y-0.5'}`}
                            >
                                {isUpdating ? 'Đang gửi...' : 'Xác nhận & Gửi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================= */}
            {/* 🌟 MODAL XEM LẠI PHẢN HỒI ĐÃ GỬI (CHỈ ĐỌC) */}
            {/* ======================================================= */}
            {viewFeedbackModal.isOpen && viewFeedbackModal.data && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border-t-8 border-olive">

                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-cream">
                            <h3 className="text-xl font-bold text-olive flex items-center gap-2">
                                📬 Phản hồi đã gửi
                            </h3>
                            <button onClick={() => setViewFeedbackModal({ isOpen: false, data: null })} className="text-gray-400 hover:text-red-500 text-3xl leading-none transition-colors">&times;</button>
                        </div>

                        <div className="p-8 space-y-5">
                            <p className="text-gray-600 text-sm">
                                Gửi đến ứng viên: <strong className="text-textmain text-base">{viewFeedbackModal.data.candidate?.fullName}</strong>
                            </p>

                            {/* Nếu là Phỏng vấn thì hiện giờ giấc */}
                            {viewFeedbackModal.data.status === 3 && (
                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-3">
                                    <div>
                                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">⏰ Thời gian</p>
                                        <p className="text-blue-900 font-medium">
                                            {viewFeedbackModal.data.interviewTime
                                                ? new Date(viewFeedbackModal.data.interviewTime).toLocaleString('vi-VN')
                                                : "Chưa cập nhật"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">📍 Địa điểm / Link</p>
                                        <p className="text-blue-900 font-medium break-words">
                                            {viewFeedbackModal.data.interviewLocation || "Chưa cập nhật"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Lời nhắn */}
                            {viewFeedbackModal.data.message && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">💬 Lời nhắn</p>
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-gray-700 whitespace-pre-line italic">
                                        "{viewFeedbackModal.data.message}"
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setViewFeedbackModal({ isOpen: false, data: null })}
                                className="px-6 py-2.5 rounded-xl font-bold text-white bg-olive hover:bg-earth transition-colors shadow-sm"
                            >
                                Đóng lại
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedCandidateId && (
                <CandidateDetailModal candidateId={selectedCandidateId} onClose={() => setSelectedCandidateId(null)} />
            )}
        </div>
    );
}

export default JobApplicationsPage;