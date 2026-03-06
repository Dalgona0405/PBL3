import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import { API_URLS } from "../api/api";
import { useNavigate } from "react-router-dom";
import "../App.css";

function DetailJobPage() {
    const navigate = useNavigate();
    const { id } = useParams(); 
    const [jobDetail, setJobDetail] = useState(null);

    useEffect(() => {
        fetch(`${API_URLS.JOBS}/${id}`) 
            .then(response => response.json())
            .then(data => {
                console.log("Chi tiết công việc:", data);
                setJobDetail(data);
            })
            .catch(error => console.error('Lỗi lấy chi tiết:', error));
    }, [id]);
    if (!jobDetail) {
        return (
            <div className="app-wrapper">
                <Header />
                <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải thông tin...🌿</div>
            </div>
        );
    }
    let displaySalary = "";
    if (!jobDetail.salaryMin && !jobDetail.salaryMax) {
        displaySalary = "Thỏa thuận";
    } 
    else {
        displaySalary = `${jobDetail.salaryMin} - ${jobDetail.salaryMax} triệu`; 
    }
    let displayAddress = jobDetail.address || "Chưa cập nhật";
    return (
        <div className="app-wrapper">
            <Header />
            <div className="detail-job-container">
                <h1>{jobDetail.title}</h1>
                <div>
                    <p onClick={() => navigate(`/detail-company/${jobDetail.company?.companyId}`)}>
                        <strong>🏢 Công ty:</strong> {jobDetail.company?.companyName}
                    </p>
                    <p><strong>📍 Khu vực:</strong> {jobDetail.location?.locationName}</p>
                    <p><strong>💰 Lương:</strong> {displaySalary}</p>
                    <p><strong>⏳ Cấp bậc:</strong> {jobDetail.level}</p>
                    <p><strong>🏠 Địa chỉ:</strong> {displayAddress}</p>
                </div>

                <h3>Mô tả công việc</h3>
                <p>{jobDetail.description}</p>
                <h3>Yêu cầu ứng viên</h3>
                <p>{jobDetail.requirement}</p>
                <h3>Quyền lợi</h3>
                <p>{jobDetail.benefits}</p>
                
                <button className="btn-submit">Ứng tuyển ngay</button>
            </div>
        </div>
    );
}

export default DetailJobPage;