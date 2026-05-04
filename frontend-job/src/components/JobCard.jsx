import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';

function JobCard(props) {
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);
    
    let displaySalary = (!props.salaryMin && !props.salaryMax) 
        ? "Thỏa thuận" 
        : `${props.salaryMin} - ${props.salaryMax} triệu`; 

    return (
        // 1. Bỏ transition-all, thay bằng transition-[transform,shadow]
        // 2. Thêm transform-gpu và will-change-transform để ép dùng Card màn hình
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-[transform,shadow] duration-300 transform-gpu hover:-translate-y-1 will-change-transform border border-gray-50 flex flex-col h-full">
            
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center text-2xl flex-shrink-0 border border-gray-100 overflow-hidden">
                    {props.company?.logoImg && !imgError ? (
                        <img 
                            src={props.company.logoImg}
                            alt={props.company.companyName}
                            className="w-full h-full object-cover"
                            width="48" 
                            height="48" 
                            loading={props.priority ? "eager" : "lazy"}
                            fetchPriority={props.priority ? "high" : "auto"}
                            decoding="async"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <span>🏢</span>
                    )}
                </div>
                
                <div>
                    <h3 className="text-lg font-bold text-textmain line-clamp-2 leading-tight mb-1">
                        {props.title}
                    </h3>
                    <p className="text-sm text-olive font-medium">
                        {props.company?.companyName || "Công ty ẩn danh"}
                    </p>
                </div>
            </div>

            <div className="flex-1 space-y-2 mb-6">
                <div className="flex items-center text-gray-500 text-sm">
                    <span className="mr-2">💰</span> 
                    <span className="font-medium text-earth">{displaySalary}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                    <span className="mr-2">📍</span> 
                    {props.location?.locationName || "Chưa cập nhật"}
                </div>
            </div>

            <button 
                className="w-full py-2.5 bg-cream text-olive font-semibold rounded-xl hover:bg-olive hover:text-white transition-colors duration-300"
                onClick={() => navigate(`/detail-job/${props.jobId}`)}
            >
                Xem chi tiết
            </button>
        </div>
    );
}

export default memo(JobCard);