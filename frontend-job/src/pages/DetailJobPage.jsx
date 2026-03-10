import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URLS } from "../api/api";
import "../App.css";

function DetailJobPage() {
    const navigate = useNavigate();
    const { id } = useParams(); 
    const [jobDetail, setJobDetail] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch(`${API_URLS.JOBS}/${id}`) 
            .then(response => response.json())
            .then(data => {
                console.log("Chi tiết công việc:", data);
                setJobDetail(data);
            })
            .catch(error => console.error('Lỗi lấy chi tiết:', error));
    }, [id]);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    if (!jobDetail) {
        return (
            <div className="app-wrapper">
                <div style={{ textAlign: 'center', marginTop: '50px', color: '#8E9775' }}>Đang tải thông tin... 🌿</div>
            </div>
        );
    }

    let displaySalary = "";
    if (!jobDetail.salaryMin && !jobDetail.salaryMax) {
        displaySalary = "Thỏa thuận";
    } else {
        displaySalary = `${jobDetail.salaryMin} - ${jobDetail.salaryMax} triệu`; 
    }
    
    let displayAddress = jobDetail.address || "Chưa cập nhật";

    const handleApply = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.role !== 'Candidate') {
            alert("Bạn là nhà tuyển dụng mà, sao lại tự đi xin việc? 😆");
            return;
        }

        try {
            const payload = {
                userId: user.id,
                jobId: parseInt(id)
            };

            const response = await fetch(API_URLS.APPLICATIONS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("🎉 Chúc mừng bạn! Nộp CV thành công rồi nè, chuẩn bị tinh thần HR gọi nha!");
            } else {
                alert("Bạn đã ứng tuyển công việc này. 🌿");
            }
        } catch (error) {
            console.error("Lỗi khi ứng tuyển:", error);
            alert("Lỗi kết nối. Vui lòng thử lại sau nhé! 🌿");
        }
    };

    return (
        <div className="app-wrapper">
            <div className="basic-job-container">
                <h1>{jobDetail.title}</h1>
                <div>
                    <p onClick={() => navigate(`/detail-company/${jobDetail.company?.companyId}`)} style={{ cursor: 'pointer' }}>
                        <strong>🏢 Công ty:</strong> {jobDetail.company?.companyName}
                    </p>
                    <p><strong>📍 Khu vực:</strong> {jobDetail.location?.locationName}</p>
                    <p><strong>💰 Lương:</strong> {displaySalary}</p>
                    <p><strong>⏳ Cấp bậc:</strong> {jobDetail.level}</p>
                    <p><strong>🏠 Địa chỉ:</strong> {displayAddress}</p>
                </div>
            </div>
            <div className="detail-job-container">

                <h3>Mô tả công việc</h3>
                <p>{jobDetail.description}</p>
                
                <h3>Yêu cầu ứng viên</h3>
                <p>{jobDetail.requirement}</p>
                
                <h3>Quyền lợi</h3>
                <p>{jobDetail.benefits}</p>
            </div>
            <button className="btn-submit" onClick={handleApply}>
                {user ? (
                    user.role === 'Candidate' ? "Ứng tuyển ngay" : "Bạn là nhà tuyển dụng"
                ) : (
                    "Đăng nhập để ứng tuyển"
                    )}
                </button>
        </div>
    );
}

export default DetailJobPage;