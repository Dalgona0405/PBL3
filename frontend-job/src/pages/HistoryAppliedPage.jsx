import React, {useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { API_URLS } from "../api/api";
import '../css/HistoryAppliedPage.css'

function HistoryAppliedPage() {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(savedUser);
        //Chỉ Candidate mới có lịch sử ứng tuyển
        if (parsedUser.role !== 'Candidate') {
            navigate('/');
            return;
        }
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${API_URLS.APPLICATIONS}/candidate/${parsedUser.id}`);
                if (!res.ok) throw new Error ("Không thể tải dữ liệu.");

                const data = await res.json();
                setApplications(data);
            } catch (err) {
                setError("Không thể tải lịch sử ứng tuyển. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [navigate]);

    const getStatusInfo = (statusCode) => {
        switch (statusCode) {
            case 1: return {text: 'Chờ duyệt', className: 'status-1'};
            case 2: return {text: 'Đang xem xét', className: 'status-2'};
            case 3: return {text: 'Phỏng vấn', className: 'status-3'};
            case 4: return {text: 'Trúng tuyển', className: 'status-4'};
            case 5: return {text: 'Từ chối', className: 'status-5'};
            default: return {text: 'Không xác định', className: 'status-6'};
        }
    };

    if (isLoading) {
        return (
            <div className="app-wrapper">
                <div className="loading-spinner">Đang tải lịch sử ứng tuyển... 🌿</div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="app-wrapper">
                <div className="error-message">{error}</div>
            </div>
        );
    }
    return (
        <div className="app-wrapper">
            <div className="history-container">
                <div className="history-header">
                    <h2>📤 Lịch sử ứng tuyển của bạn</h2>
                    <span style={{fontSize: '1.6rem', color: '#888'}}>
                        Tổng cộng: <strong>{applications.length}</strong>
                    </span>
                </div>
                {applications.length === 0 ? (
                    <div className="empty-history">
                        <p>Bạn chưa ứng tuyển công việc nào cả.</p>
                        <button onClick={() => navigate('/')} style={{marginTop: '1.5rem'}}>
                            Tìm việc ngay 🚀
                        </button>
                    </div>
                ) : (
                    <div className="history-list">
                        {applications.map((app) => {
                            const statusInfo = getStatusInfo(app.status);

                            return (
                                <div key={app.applicationId} className="history-card">
                                    <div className="history-info">
                                        {/* Bấm vào tên Job sẽ nhảy sang trang chi tiết Job đó */}
                                        <h3 onClick={() => navigate(`/detail-job/${app.jobId}`)}>
                                            {app.job?.title || "Công việc không xác định"}
                                        </h3>

                                        <div className = "history-details">
                                            <p>🏢 {app.job?.companyName || "Công ty ẩn"}</p>
                                            <p>📍 {app.job?.locationName || "Chưa cập nhật"}</p>
                                        </div>

                                        <div className="history-details" style={{fontSize: '1.4rem', color: '#888'}}>
                                            <p>📅 Ngày nộp CV: {new Date(app.appliedDate).toLocaleDateString('vi-VN')}</p>
                                            <p>💰 Lương: {app.job?.salaryMin ? `${app.job.salaryMin} - ${app.job.salaryMax} triệu` : 'Thỏa thuận'} </p>
                                        </div>
                                    </div>

                                    <div className="history-action">
                                        <div className={`status-badge ${statusInfo.className}`}>
                                            {statusInfo.text}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default HistoryAppliedPage;