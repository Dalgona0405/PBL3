import { useState, useEffect } from 'react';

// Custom Hook này nhận vào 2 tham số: 
// - value: Chữ mà user đang gõ
// - delay: Thời gian chờ (ví dụ: 500ms)
function useDebounce(value, delay) {
    // State này lưu lại giá trị "đã chốt" sau khi chờ xong
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Đặt một cái đồng hồ hẹn giờ (setTimeout)
        // Sau đúng khoảng thời gian 'delay', nó mới cập nhật debouncedValue
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // CLEANUP FUNCTION: 
        // Nếu user gõ tiếp 1 ký tự mới TRƯỚC KHI hết giờ, 
        // React sẽ chạy hàm này để hủy cái đồng hồ cũ đi, và đặt lại đồng hồ mới từ đầu.
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // Hook này chỉ chạy lại khi user gõ chữ mới (value) hoặc đổi thời gian chờ (delay)

    return debouncedValue; // Trả về chữ đã chốt đơn
}

export default useDebounce;