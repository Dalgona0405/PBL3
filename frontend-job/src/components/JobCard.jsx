// File: src/components/JobCard.jsx
import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';

function JobCard(props) {
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);
    
    let displaySalary = "Thỏa thuận"; // Mặc định là Thỏa thuận

    if (props.salaryMin && props.salaryMax) {
        // Trường hợp có cả Min và Max
        if (props.salaryMin === props.salaryMax) {
            displaySalary = `${props.salaryMin} triệu`; // Nếu Min = Max thì in 1 số thôi
        } else {
            displaySalary = `${props.salaryMin} - ${props.salaryMax} triệu`;
        }
    } else if (props.salaryMin && !props.salaryMax) {
        // Trường hợp chỉ có Min
        displaySalary = `Từ ${props.salaryMin} triệu`;
    } else if (!props.salaryMin && props.salaryMax) {
        // Trường hợp chỉ có Max
        displaySalary = `Lên đến ${props.salaryMax} triệu`;
    }

    return (
        // 🌟 THAY ĐỔI 1: Nền trắng, viền mỏng, bo góc tròn trịa hơn (rounded-3xl), thêm class "group" để làm hiệu ứng hover đồng bộ
        <div className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform-gpu hover:-translate-y-1 border border-gray-100 flex flex-col h-full group">
            
            <div className="flex items-start gap-4 mb-5">
                {/* 🌟 THAY ĐỔI 2: Hộp Logo nền trắng, có viền nhẹ, bo góc mềm mại */}
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-2xl flex-shrink-0 border border-gray-100 shadow-sm overflow-hidden p-1">
                    {props.company?.logoImg && !imgError ? (
                        <img 
                            src={props.company.logoImg}
                            alt={props.company.companyName}
                            className="w-full h-full object-contain"
                            loading={props.priority ? "eager" : "lazy"}
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <span className="text-gray-300">🏢</span>
                    )}
                </div>
                
                <div className="flex-1 pt-1">
                    {/* 🌟 THAY ĐỔI 3: Tên Job sẽ tự động đổi sang màu Olive khi rê chuột vào thẻ */}
                    <h3 className="text-lg font-bold text-textmain line-clamp-2 leading-tight mb-1.5 group-hover:text-olive transition-colors">
                        {props.title}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium line-clamp-1">
                        {props.company?.companyName || "Công ty ẩn danh"}
                    </p>
                </div>
            </div>

            <div className="flex-1 space-y-3 mb-6">
                {/* 🌟 THAY ĐỔI 4: Đóng khung mức lương lại cho gọn gàng và nổi bật */}
                <div className="flex items-center text-sm font-medium bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-100">
                    <span className="mr-2 opacity-80">💰</span> 
                    <span className="text-earth">{displaySalary}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm px-1">
                    <span className="mr-2 opacity-80">📍</span> 
                    {props.location?.locationName || "Chưa cập nhật"}
                </div>
            </div>

            {/* 🌟 THAY ĐỔI 5: Nút bấm tàng hình, rê chuột vào mới hiện màu Olive */}
            <button 
                className="w-full py-3 bg-gray-50 text-olive font-bold rounded-xl border border-gray-100 group-hover:bg-olive group-hover:text-white group-hover:border-olive transition-all duration-300"
                onClick={() => navigate(`/detail-job/${props.jobId}`)}
            >
                Xem chi tiết
            </button>
        </div>
    );
}

export default memo(JobCard);