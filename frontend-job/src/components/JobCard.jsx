import React from 'react';
import { useNavigate } from 'react-router-dom';

function JobCard(props) {
    const navigate = useNavigate();
    
    let displaySalary = (!props.salaryMin && !props.salaryMax) 
        ? "Thỏa thuận" 
        : `${props.salaryMin} - ${props.salaryMax} triệu`; 

    return (
        // Thẻ Card: Nền trắng, bo góc lớn, đổ bóng, hiệu ứng bay lên khi hover
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-50 flex flex-col h-full">
            
            {/* Phần Header của Card: Logo công ty và Tên Job */}
            <div className="flex items-start gap-4 mb-4">
                {/* Cục Logo giả lập (Vì API hiện tại chưa trả về Logo) */}
                <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center text-2xl flex-shrink-0 border border-gray-100">
                    🏢
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

            {/* Phần thông tin chi tiết (Lương, Địa điểm) */}
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

            {/* Nút Xem chi tiết nằm ở dưới cùng */}
            <button 
                className="w-full py-2.5 bg-cream text-olive font-semibold rounded-xl hover:bg-olive hover:text-white transition-colors duration-300"
                onClick={() => navigate(`/detail-job/${props.jobId}`)}
            >
                Xem chi tiết
            </button>
        </div>
    );
}

export default JobCard;