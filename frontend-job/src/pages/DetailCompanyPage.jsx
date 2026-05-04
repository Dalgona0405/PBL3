import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import JobList from "../components/JobList"; 
import { API_URLS } from "../api/api";

function DetailCompanyPage() {
    const { id } = useParams(); 
    const navigate = useNavigate(); // Dùng để làm nút Quay lại
    
    const[companyDetail, setCompanyDetail] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        fetch(`${API_URLS.COMPANIES}/${id}`) 
            .then(response => response.json())
            .then(data => {
                setCompanyDetail(data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Lỗi lấy chi tiết:', error);
                setIsLoading(false);
            });
    }, [id]);

    // Hiệu ứng Loading đồng bộ với các trang khác
    if (isLoading || !companyDetail) {
        return (
            <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse font-medium">
                Đang tải thông tin công ty... 🌿
            </div>
        );
    }

    let displayWebsite = companyDetail.website || "Chưa cập nhật";

    return (
        <div className="max-w-6xl mx-auto w-full pb-12 px-4 md:px-0">
            
            {/* NÚT QUAY LẠI */}
            <button 
                onClick={() => navigate(-1)} // navigate(-1) nghĩa là quay lại trang trước đó
                className="text-gray-500 hover:text-olive font-medium flex items-center gap-2 mb-6 transition-colors"
            >
                ⬅ Quay lại
            </button>

            {/* KHỐI 1: BẢNG HIỆU CÔNG TY (STOREFRONT) */}
            <div className="bg-white rounded-3xl shadow-sm border-t-8 border-olive p-8 mb-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                
                {/* Logo Công ty */}
                <div className="w-40 h-40 rounded-2xl bg-cream border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner p-2">
                    {companyDetail.logoImg ? (
                        <img 
                            src={companyDetail.logoImg} 
                            alt={`${companyDetail.companyName} logo`} 
                            className="w-full h-full object-contain" // object-contain giúp logo không bị méo
                        />
                    ) : (
                        <span className="text-6xl">🏢</span>
                    )}
                </div>

                {/* Thông tin chi tiết */}
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold text-textmain mb-6">
                        {companyDetail.companyName}
                    </h1>
                    
                    <div className="flex flex-col gap-4 text-gray-600 text-lg">
                        <p className="flex items-center justify-center md:justify-start gap-3">
                            <span className="text-2xl">🌐</span> 
                            <strong className="w-24 text-left">Website:</strong> 
                            {companyDetail.website ? (
                                <a 
                                    href={companyDetail.website} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                                >
                                    {displayWebsite}
                                </a>
                            ) : (
                                <span>{displayWebsite}</span>
                            )}
                        </p>
                        <p className="flex items-center justify-center md:justify-start gap-3">
                            <span className="text-2xl">👥</span> 
                            <strong className="w-24 text-left">Quy mô:</strong> 
                            <span>{companyDetail.size || "Chưa cập nhật"}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* KHỐI 2: BẢNG THÔNG BÁO TUYỂN DỤNG */}
            <div className="bg-white rounded-3xl shadow-sm p-8">
                <div className="mb-8 border-b-2 border-gray-100 pb-4">
                    <h2 className="text-2xl font-bold text-olive pl-3 border-l-4 border-earth">
                        Tuyển dụng từ {companyDetail.companyName}
                    </h2>
                    <p className="text-gray-500 mt-2 pl-4">Khám phá các cơ hội nghề nghiệp hấp dẫn đang mở tuyển.</p>
                </div>

                {/* Gọi khối Lego JobList ra đây, truyền ID công ty vào để nó tự lọc */}
                <JobList companyId={id} />
            </div>

        </div>
    );
}

export default DetailCompanyPage;