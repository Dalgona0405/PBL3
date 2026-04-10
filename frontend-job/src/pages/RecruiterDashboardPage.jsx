import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../api/api';
import '../css/RecruiterDashboardPage.css';

function RecruiterDashboardPage() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const[isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State để lưu danh sách ứng viên của job đang được mở xem
    const[expandedJobId, setExpandedJobId] = useState(null);
    const [applications, setApplications] = useState({});
    const[loadingApps, setLoadingApps] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(savedUser);
        
        if (parsedUser.role !== 'Recruiter') {
            navigate('/');
            return;
        }

        // Lấy danh sách Job của Recruiter này
        const fetchJobs = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`${API_URLS.USERS}/${parsedUser.id}`);
                if (!res.ok) throw new Error("Không thể tải dữ liệu.");
                
                const userData = await res.json();
                // Lấy danh sách jobs từ thông tin công ty của recruiter
                if (userData.recruiter?.company?.jobs) {
                    setJobs(userData.recruiter.company.jobs);
                }
            } catch (err) {
                setError("Lỗi kết nối máy chủ. Vui lòng thử lại sau! 🌿");
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobs();
    }, [navigate]);

    // Hàm mở/đóng danh sách ứng viên của 1 Job
    const toggleJobApplications = async (jobId) => {
        // Nếu đang mở thì đóng lại
        if (expandedJobId === jobId) {
            setExpandedJobId(null);
            return;
        }

        setExpandedJobId(jobId);
        
        // Nếu đã tải data ứng viên cho job này rồi thì không gọi API nữa
        if (applications[jobId]) return;

        try {
            setLoadingApps(true);
            const res = await fetch(`${API_URLS.APPLICATIONS}/job/${jobId}`);
            if (res.ok) {
                const data = await res.json();
                setApplications(prev => ({ ...prev, [jobId]: data }));
            }
        } catch (err) {
            alert("Không thể tải danh sách ứng viên!");
        } finally {
            setLoadingApps(false);
        }
    };

    // Hàm cập nhật trạng thái ứng viên
    const handleUpdateStatus = async (appId, jobId, newStatus) => {
        try {
            const res = await fetch(`${API_URLS.APPLICATIONS}/${appId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStatus)
            });

            if (res.ok) {
                // Cập nhật UI ngay lập tức (Optimistic UI Update)
                setApplications(prev => {
                    const jobApps = prev[jobId].map(app => 
                        app.applicationId === appId ? { ...app, status: newStatus } : app
                    );
                    return { ...prev, [jobId]: jobApps };
                });
            } else {
                alert("Cập nhật thất bại!");
            }
        } catch (err) {
            alert("Lỗi mạng, không thể cập nhật trạng thái!");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 1: return <span className="badge badge-pending">Chờ duyệt</span>;
            case 2: return <span className="badge badge-review">Đang xem xét</span>;
            case 3: return <span className="badge badge-interview">Phỏng vấn</span>;
            case 4: return <span className="badge badge-accepted">Trúng tuyển</span>;
            case 5: return <span className="badge badge-rejected">Từ chối</span>;
            default: return <span className="badge">Chưa rõ</span>;
        }
    };

    if (isLoading) return <div className="app-wrapper"><div className="loading-spinner">Đang tải dữ liệu... 🌿</div></div>;
    if (error) return <div className="app-wrapper"><div className="error-message">{error}</div></div>;

    return (
        <div className="app-wrapper">
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h2>🏢 Quản lý Tuyển dụng</h2>
                    <p>Theo dõi và quản lý các đơn ứng tuyển vào công ty của bạn.</p>
                </div>

                {jobs.length === 0 ? (
                    <div className="empty-state">Công ty bạn chưa đăng tin tuyển dụng nào.</div>
                ) : (
                    <div className="job-management-list">
                        {jobs.map(job => (
                            <div key={job.jobId} className="job-management-card">
                                <div className="job-card-header">
                                    <div>
                                        <h3 onClick={() => navigate(`/detail-job/${job.jobId}`)}>{job.title}</h3>
                                        <p className="job-meta">📍 {job.locationName} | ⏳ Hạn chót: {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                                    </div>
                                    <button 
                                        className="btn-view-apps"
                                        onClick={() => toggleJobApplications(job.jobId)}
                                    >
                                        {expandedJobId === job.jobId ? 'Đóng lại 🔼' : 'Xem ứng viên 🔽'}
                                    </button>
                                </div>

                                {/* Khu vực hiển thị danh sách ứng viên (Expandable) */}
                                {expandedJobId === job.jobId && (
                                    <div className="applications-section">
                                        {loadingApps ? (
                                            <p className="loading-text">Đang tải danh sách ứng viên...</p>
                                        ) : applications[job.jobId]?.length > 0 ? (
                                            <table className="apps-table">
                                                <thead>
                                                    <tr>
                                                        <th>Ứng viên</th>
                                                        <th>Ngày nộp</th>
                                                        <th>CV</th>
                                                        <th>Trạng thái</th>
                                                        <th>Hành động</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {applications[job.jobId].map(app => (
                                                        <tr key={app.applicationId}>
                                                            <td>
                                                                <div className="candidate-info">
                                                                    <div className="candidate-avatar">
                                                                        {app.candidate?.avatar ? <img src={app.candidate.avatar} alt="avt"/> : '👤'}
                                                                    </div>
                                                                    <div>
                                                                        <strong>{app.candidate?.fullName}</strong>
                                                                        <br/>
                                                                        <small>{app.candidate?.email}</small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>{new Date(app.appliedDate).toLocaleDateString('vi-VN')}</td>
                                                            <td>
                                                                {app.candidate?.cvUrl ? (
                                                                    <a href={app.candidate.cvUrl} target="_blank" rel="noreferrer" className="link-cv">Xem CV 📄</a>
                                                                ) : 'Chưa có CV'}
                                                            </td>
                                                            <td>{getStatusBadge(app.status)}</td>
                                                            <td>
                                                                <select 
                                                                    className="status-dropdown"
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
                                        ) : (
                                            <p className="empty-apps">Chưa có ứng viên nào nộp CV vào vị trí này. 🌿</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default RecruiterDashboardPage;