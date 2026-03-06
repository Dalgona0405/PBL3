import React from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
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
                <Header />
                <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải thông tin...🌿</div>
            </div>
        );
    }
    return (
        <div className="app-wrapper">
            <Header />
            <div className="detail-company-container">
                <h1>{companyDetail.companyName}</h1>
                <div>
                    <p><strong>🌐 Website:</strong> {companyDetail.Website}</p>
                    <p><strong> Nhân viên:</strong> {companyDetail.Size}</p>
                </div>
            </div>
        </div>
    );
}

export default DetailCompanyPage;