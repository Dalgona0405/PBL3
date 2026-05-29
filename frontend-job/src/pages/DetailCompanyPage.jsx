import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import JobList from "../components/JobList"; 
import { API_URLS } from "../api/api";
import axiosClient from "../api/axiosClient";

function DetailCompanyPage() {
    const { id } = useParams(); 
    const navigate = useNavigate(); 
    
    const [companyDetail, setCompanyDetail] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const fetchCompanyDetail = async () => {
            try {
                const data = await axiosClient.get(`${API_URLS.COMPANIES}/${id}`);
                setCompanyDetail(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Lỗi lấy chi tiết:', error);
                setIsLoading(false);
            }
        };
        fetchCompanyDetail();
    }, [id]);

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
                onClick={() => navigate(-1)} 
                className="text-gray-500 hover:text-olive font-medium flex items-center gap-2 mb-6 transition-colors"
            >
                ⬅ Quay lại
            </button>

            {/* 🌟 KHỐI 1: BẢNG HIỆU CÔNG TY (ĐÃ ĐƯỢC "GIẢM CÂN") */}
            <div className="bg-white rounded-3xl shadow-sm border-t-8 border-olive p-6 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                
                {/* Logo Công ty - Thu nhỏ xuống w-28 h-28, đổi nền trắng cho sang */}
                <div className="w-28 h-28 rounded-2xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-2">
                    {companyDetail.logoImg ? (
                        <img 
                            src={companyDetail.logoImg} 
                            alt={`${companyDetail.companyName} logo`} 
                            className="w-full h-full object-contain" 
                        />
                    ) : (
                        <span className="text-5xl text-gray-300">🏢</span>
                    )}
                </div>

                {/* Thông tin chi tiết - Thu nhỏ size chữ và khoảng cách */}
                <div className="flex-1 text-center md:text-left pt-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-textmain mb-4">
                        {companyDetail.companyName}
                    </h1>
                    
                    <div className="flex flex-col gap-3 text-gray-600">
                        <p className="flex items-center justify-center md:justify-start gap-3">
                            <span className="text-xl opacity-80">🌐</span> 
                            <strong className="w-20 text-left">Website:</strong> 
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
                            <span className="text-xl opacity-80">👥</span> 
                            <strong className="w-20 text-left">Quy mô:</strong> 
                            <span>{companyDetail.size || "Chưa cập nhật"}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* 🌟 KHỐI 2: BẢNG THÔNG BÁO TUYỂN DỤNG */}
            <div className="bg-white rounded-3xl shadow-sm p-6">
                <div className="mb-6 border-b border-gray-50 pb-4">
                    <h2 className="text-xl font-bold text-olive pl-3 border-l-4 border-earth">
                        Tuyển dụng từ {companyDetail.companyName}
                    </h2>
                    <p className="text-gray-500 mt-2 pl-4 text-sm">Khám phá các cơ hội nghề nghiệp hấp dẫn đang mở tuyển.</p>
                </div>
                
                {/* Truyền companyInfo xuống cho JobList để fix luôn cái lỗi "Công ty ẩn danh" lúc nãy */}
                <JobList 
                    companyId={id} 
                    companyInfo={{ 
                        companyName: companyDetail.companyName, 
                        logoImg: companyDetail.logoImg 
                    }} 
                />
            </div>

        </div>
    );
}

export default DetailCompanyPage;