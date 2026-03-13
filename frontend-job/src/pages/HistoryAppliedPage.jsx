{/* <div className="profile-section">
                        <h3>Lịch sử ứng tuyển</h3>
                        {profile.applications?.length > 0 ? (
                            <div className="application-list">
                                {profile.applications.map(app => (
                                    <div key={app.applicationId} className="application-item">
                                        <h4>{app.job?.title}</h4>
                                        <p>🏢 Công ty: {app.job?.companyName}</p>
                                        <p>📅 Ngày nộp: {new Date(app.appliedDate).toLocaleDateString('vi-VN')}</p>
                                        <p>
                                            <strong>Trạng thái: </strong> 
                                            <span className={`status-text status-${app.status}`}>
                                                {app.status === 1 ? 'Chờ duyệt' : app.status === 2 ? 'Đang xem xét' : 'Đã phản hồi'}
                                            </span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-text">Chưa có lịch sử ứng tuyển nào. Ra trang chủ rải CV ngay thôi! 🚀</p>
                        )}
                    </div> */}