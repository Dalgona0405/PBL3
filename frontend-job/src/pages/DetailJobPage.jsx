import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URLS } from "../api/api";

function DetailJobPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [jobDetail, setJobDetail] = useState(null);
    const [user, setUser] = useState(null);

    // Lấy data công việc từ C#
    useEffect(() => {
        fetch(`${API_URLS.JOBS}/${id}`)
            .then(response => response.json())
            .then(data => setJobDetail(data))
            .catch(error => console.error('Lỗi lấy chi tiết:', error));
    }, [id]);

    // Kiểm tra xem ai đang đăng nhập
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    if (!jobDetail) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-olive text-xl font-medium animate-pulse">Đang tải thông tin... 🌿</div>
            </div>
        );
    }

    let displaySalary = (!jobDetail.salaryMin && !jobDetail.salaryMax)
        ? "Thỏa thuận"
        : `${jobDetail.salaryMin} - ${jobDetail.salaryMax} triệu`;

    let displayAddress = jobDetail.address || "Chưa cập nhật";

    // Hàm xử lý khi bấm nút Ứng tuyển
    const handleApply = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.role !== 'Candidate') {
            alert("Bạn là nhà tuyển dụng mà, sao lại tự đi xin việc? 😆");
            return;
        }

        try {
            // Gửi token để Backend C# biết ai đang gọi API
            const token = localStorage.getItem('token');
            const payload = {
                userId: user.id,
                jobId: parseInt(id)
            };

            const response = await fetch(API_URLS.APPLICATIONS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Phải có thẻ VIP (Token) mới được nộp đơn
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("🎉 Chúc mừng bạn! Nộp CV thành công rồi nè, chuẩn bị tinh thần HR gọi nha!");
            } else {
                const errorData = await response.json();
                alert(`Lỗi: ${errorData.message || "Bạn đã ứng tuyển công việc này rồi. 🌿"}`);
            }
        } catch (error) {
            console.error("Lỗi khi ứng tuyển:", error);
            alert("Lỗi kết nối. Vui lòng thử lại sau nhé! 🌿");
        }
    };

    const formatJDText = (text) => {
        if (!text) return "";
        // Tìm chỗ nào có dấu chấm/chấm phẩy/hai chấm mà dính liền chữ Hoa, thì tách ra
        let formatted = text.replace(/([.;:])([A-Z])/g, '$1\n\n$2');
        // Tìm chỗ nào chữ thường dính liền chữ Hoa (ví dụ: productExperience), tách ra
        formatted = formatted.replace(/([a-z])([A-Z])/g, '$1\n$2');
        return formatted;
    };

    return (
        <div className="max-w-4xl mx-auto w-full pb-12">

            {/* KHỐI 1: THÔNG TIN CƠ BẢN */}
            <div className="bg-white rounded-2xl shadow-sm border-t-8 border-olive p-8 mb-6">
                <h1 className="text-3xl font-bold text-textmain mb-6 pb-4 border-b border-gray-100">
                    {jobDetail.title}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                    <p
                        onClick={() => navigate(`/detail-company/${jobDetail.company?.companyId}`)}
                        className="flex items-center cursor-pointer hover:text-olive transition-colors"
                    >
                        <span className="text-xl mr-3">🏢</span>
                        <strong>Công ty:</strong> &nbsp;{jobDetail.company?.companyName}
                    </p>
                    <p className="flex items-center">
                        <span className="text-xl mr-3">📍</span>
                        <strong>Khu vực:</strong> &nbsp;{jobDetail.location?.locationName}
                    </p>
                    <p className="flex items-center">
                        <span className="text-xl mr-3">💰</span>
                        <strong>Lương:</strong> &nbsp;<span className="text-earth font-medium">{displaySalary}</span>
                    </p>
                    <p className="flex items-center">
                        <span className="text-xl mr-3">⏳</span>
                        <strong>Cấp bậc:</strong> &nbsp;{jobDetail.level}
                    </p>
                    <p className="flex items-center md:col-span-2">
                        <span className="text-xl mr-3">🏠</span>
                        <strong>Địa chỉ:</strong> &nbsp;{displayAddress}
                    </p>
                </div>
            </div>

            {/* KHỐI 2: MÔ TẢ CHI TIẾT */}
            <div className="bg-white rounded-2xl shadow-sm p-8">

                <div className="mb-8">
                    <h3 className="text-xl font-bold text-olive mb-4 pl-3 border-l-4 border-earth">
                        Mô tả công việc
                    </h3>
                    {/* whitespace-pre-line giúp giữ nguyên các dấu Enter từ Database */}
                    <p className="text-textmain leading-relaxed whitespace-pre-line">
                        {formatJDText(jobDetail.description)}
                    </p>
                </div>

                <div className="mb-8">
                    <h3 className="text-xl font-bold text-olive mb-4 pl-3 border-l-4 border-earth">
                        Yêu cầu ứng viên
                    </h3>
                    <p className="text-textmain leading-relaxed whitespace-pre-line">
                        {formatJDText(jobDetail.requirement)}
                    </p>
                </div>

                <div className="mb-8">
                    <h3 className="text-xl font-bold text-olive mb-4 pl-3 border-l-4 border-earth">
                        Quyền lợi
                    </h3>
                    <p className="text-textmain leading-relaxed whitespace-pre-line">
                        {formatJDText(jobDetail.benefits)}
                    </p>
                </div>

                {/* KHU VỰC NÚT BẤM */}
                <div className="mt-10 pt-8 border-t border-dashed border-gray-200 text-center">
                    <button
                        className="bg-earth hover:bg-olive text-white text-lg font-bold py-3 px-12 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 w-full md:w-auto min-w-[300px]"
                        onClick={handleApply}
                    >
                        {user ? (
                            user.role === 'Candidate' ? "Ứng tuyển ngay" : "Bạn là nhà tuyển dụng"
                        ) : (
                            "Đăng nhập để ứng tuyển"
                        )}
                    </button>
                </div>
            </div>

        </div>
    );
}

export default DetailJobPage;