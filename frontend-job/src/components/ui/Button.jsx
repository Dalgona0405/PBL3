import React from 'react';

// Khuôn đúc cho Nút bấm (Có tích hợp sẵn hiệu ứng Loading)
function Button({ 
    children,           // Chữ hoặc Icon bên trong nút
    onClick,            // Hàm chạy khi click
    type = "button",    // Loại nút (button, submit)
    isLoading = false,  // Trạng thái đang tải
    disabled = false,   // Trạng thái khóa nút
    variant = "primary" // Màu sắc: "primary" (Màu Đất) hoặc "secondary" (Màu Olive)
}) {
    // Tự động đổi màu dựa vào variant Trúc truyền vào
    const baseStyle = "w-full py-3.5 rounded-xl font-bold text-lg transition-all transform shadow-md flex justify-center items-center gap-2";
    const colorStyle = variant === "primary" 
        ? "bg-earth text-white hover:bg-olive hover:shadow-lg hover:-translate-y-1" 
        : "bg-olive text-white hover:bg-earth hover:shadow-lg hover:-translate-y-1";
    
    // Nếu đang loading hoặc bị disabled thì làm mờ nút đi
    const disabledStyle = "bg-gray-400 text-white cursor-not-allowed transform-none shadow-none";

    return (
        <button 
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`${baseStyle} ${disabled || isLoading ? disabledStyle : colorStyle}`}
        >
            {/* Nếu đang loading thì hiện chữ Đang xử lý, ngược lại hiện nội dung bình thường */}
            {isLoading ? (
                <>
                    <span className="animate-spin text-xl">⏳</span> Đang xử lý...
                </>
            ) : (
                children
            )}
        </button>
    );
}

export default Button;