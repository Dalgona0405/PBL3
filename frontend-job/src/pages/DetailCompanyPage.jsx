import React from "react";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_URLS } from "../api/api";
import "../App.css";

function DetailCompanyPage() {
    const { id } = useParams(); 
    const [companyDetail, setCompanyDetail] = useState(null);

    useEffect(() => {
        fetch(`${API_URLS.COMPANIES}/${id}`) 
            .then(response => response.json())
            .then(data => {
                console.log("Chi tiết công ty:", data);
                setCompanyDetail(data);
            })
            .catch(error => console.error('Lỗi lấy chi tiết:', error));
    }, [id]);
    if (!companyDetail) {
        return (
            <div className="app-wrapper">
                <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải thông tin...🌿</div>
            </div>
        );
    }
    let displayWebsite = companyDetail.website || "Chưa cập nhật";
    return (
        <div className="app-wrapper">
            <div className="detail-company-container">
                <h1>{companyDetail.companyName}</h1>
                <div>
                    <img src={companyDetail.logoImg} alt={`${companyDetail.companyName} logo`}/>
                    <p><strong>🌐 Website:</strong> {displayWebsite}</p>
                    <p><strong> Nhân viên:</strong> {companyDetail.size}</p>
                </div>
            </div>
        </div>
    );
}

export default DetailCompanyPage;