// File: src/components/JobCard.jsx
import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';

function JobCard(props) {
    const navigate = useNavigate();
    const { user } = useAuth(); // Lấy thông tin user
    const [imgError, setImgError] = useState(false);
    
    // State lưu trạng thái trái tim (đỏ hay rỗng)
    // Nếu component cha truyền vào isSaved = true (ở trang Việc làm đã lưu), thì tim mặc định đỏ
    const [isSaved, setIsSaved] = useState(props.isSaved || false); 
    const [isSaving, setIsSaving] = useState(false);

    let displaySalary = "Thỏa thuận";
    if (props.salaryMin && props.salaryMax) {
        if (props.salaryMin === props.salaryMax) {
            displaySalary = `${props.salaryMin} triệu`;
        } else {
            displaySalary = `${props.salaryMin} - ${props.salaryMax} triệu`;
        }
    } else if (props.salaryMin && !props.salaryMax) {
        displaySalary = `Từ ${props.salaryMin} triệu`;
    } else if (!props.salaryMin && props.salaryMax) {
        displaySalary = `Lên đến ${props.salaryMax} triệu`;
    }

    // Hàm xử lý khi bấm vào trái tim
    const handleToggleSave = async (e) => {
        e.stopPropagation(); // Ngăn không cho sự kiện click lan ra ngoài (tránh bị chuyển trang)
        
        if (!user || user.role !== 'Candidate') {
            toast.error("Bạn cần đăng nhập với vai trò Ứng viên để lưu việc làm nha! 🌿");
            return;
        }

        setIsSaving(true);
        try {
            if (isSaved) {
                // Nếu đã lưu rồi -> Bấm vào là Bỏ lưu (DELETE)
                await axiosClient.delete(`/Jobs/${props.jobId}/save`);
                setIsSaved(false);
                toast.success("Đã bỏ lưu công việc!");
                // Nếu có hàm onRemove (truyền từ trang SavedJobs), thì gọi để ẩn card đi
                if (props.onRemove) props.onRemove(props.jobId);
            } else {
                // Nếu chưa lưu -> Bấm vào là Lưu (POST)
                await axiosClient.post(`/Jobs/${props.jobId}/save`);
                setIsSaved(true);
                toast.success("❤️ Đã lưu công việc vào danh sách!");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div 
            className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform-gpu hover:-translate-y-1 border border-gray-100 flex flex-col h-full group relative cursor-pointer"
            onClick={() => navigate(`/detail-job/${props.jobId}`)} // Bấm vào card thì chuyển trang
        >
            {/* NÚT TRÁI TIM (Chỉ hiện cho Candidate) */}
            {(!user || user.role === 'Candidate') && (
                <button 
                    onClick={handleToggleSave}
                    disabled={isSaving}
                    className="absolute top-6 right-6 text-2xl z-10 hover:scale-110 transition-transform focus:outline-none"
                    title={isSaved ? "Bỏ lưu" : "Lưu công việc"}
                >
                    {isSaved ? '❤️' : '🤍'}
                </button>
            )}
            
            <div className="flex items-start gap-4 mb-5 pr-8"> {/* Thêm pr-8 để chữ không đè lên trái tim */}
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
                    <h3 className="text-lg font-bold text-textmain line-clamp-2 leading-tight mb-1.5 group-hover:text-olive transition-colors">
                        {props.title}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium line-clamp-1">
                        {props.company?.companyName || "Công ty ẩn danh"}
                    </p>
                </div>
            </div>

            <div className="flex-1 space-y-3 mb-6">
                <div className="flex items-center text-sm font-medium bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-100">
                    <span className="mr-2 opacity-80">💰</span> 
                    <span className="text-earth">{displaySalary}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm px-1">
                    <span className="mr-2 opacity-80">📍</span> 
                    {props.location?.locationName || "Chưa cập nhật"}
                </div>
            </div>

            <button 
                className="w-full py-3 bg-gray-50 text-olive font-bold rounded-xl border border-gray-100 group-hover:bg-olive group-hover:text-white group-hover:border-olive transition-all duration-300"
            >
                Xem chi tiết
            </button>
        </div>
    );
}

export default memo(JobCard);