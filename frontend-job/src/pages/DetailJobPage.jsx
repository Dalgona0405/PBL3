import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URLS } from "../api/api";

function DetailJobPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [jobDetail, setJobDetail] = useState(null);
    const [user, setUser] = useState(null);

    // STATE CHO MODAL NỘP CV
    const [showModal, setShowModal] = useState(false);
    const [cvOption, setCvOption] = useState('default'); // 'default' hoặc 'new'
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetch(`${API_URLS.JOBS}/${id}`)
            .then(response => response.json())
            .then(data => setJobDetail(data))
            .catch(error => console.error('Lỗi lấy chi tiết:', error));
    }, [id]);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUser(JSON.parse(savedUser));
    }, []);

    // Hàm mở Modal
    const handleOpenModal = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'Candidate') {
            alert("Bạn là nhà tuyển dụng mà, sao lại tự đi xin việc? 😆");
            return;
        }
        setShowModal(true);
    };

    // Hàm xử lý khi chọn file từ máy tính
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Kiểm tra đuôi file (Chỉ nhận PDF)
            if (file.type !== 'application/pdf') {
                alert("Vui lòng chỉ tải lên file PDF nha!");
                e.target.value = null;
                return;
            }
            // Kiểm tra dung lượng (Ví dụ: Max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("File CV nặng quá, vui lòng chọn file dưới 5MB!");
                e.target.value = null;
                return;
            }
            setSelectedFile(file);
        }
    };

    // Hàm chính: Gửi đơn ứng tuyển
    const handleConfirmApply = async () => {
        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        let finalCvUrl = ""; // Mặc định rỗng, Backend C# của Trúc sẽ tự lấy CV mặc định

        try {
            // NẾU CHỌN CV MỚI: Phải upload file lên Server trước
            if (cvOption === 'new') {
                if (!selectedFile) {
                    alert("Bạn chưa chọn file CV mới kìa!");
                    setIsSubmitting(false);
                    return;
                }

                /* 
                =========================================================
                GÓC NHÌN BrSE: CHỖ NÀY CẦN BACKEND C# VIẾT API UPLOAD
                =========================================================
                const formData = new FormData();
                formData.append('file', selectedFile);

                const uploadRes = await fetch(`${API_URLS.BASE_URL}/upload`, {
                    method: 'POST',
                    body: formData
                });
                const uploadData = await uploadRes.json();
                finalCvUrl = uploadData.fileUrl; // Lấy URL từ Backend trả về
                =========================================================
                */

                // Tạm thời giả lập URL vì Backend chưa có API Upload
                alert("Tính năng Upload File đang chờ Backend hoàn thiện. Tạm thời hệ thống sẽ dùng CV mặc định của bạn nha! 🌿");
                finalCvUrl = "";
            }

            // GỌI API NỘP ĐƠN CHÍNH THỨC
            const payload = {
                userId: user.id,
                jobId: parseInt(id),
                cvUrl: finalCvUrl
            };

            const response = await fetch(API_URLS.APPLICATIONS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("🎉 Chúc mừng bạn! Nộp CV thành công rồi nè, chuẩn bị tinh thần HR gọi nha!");
                setShowModal(false); // Đóng modal
            } else {
                const errorData = await response.json();
                alert(`Lỗi: ${errorData.message || "Bạn đã ứng tuyển công việc này rồi. 🌿"}`);
            }
        } catch (error) {
            alert("Lỗi kết nối. Vui lòng thử lại sau nhé! 🌿");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatJDText = (text) => {
        if (!text) return ""; // Tìm chỗ nào có dấu chấm/chấm phẩy/hai chấm mà dính liền chữ Hoa, thì tách ra 
        let formatted = text.replace(/([.;:])([A-Z])/g, '$1\n\n$2'); // Tìm chỗ nào chữ thường dính liền chữ Hoa (ví dụ: productExperience), tách ra 
        formatted = formatted.replace(/([a-z])([A-Z])/g, '$1\n$2');
        return formatted;
    };

    if (!jobDetail) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải thông tin... 🌿</div>;

    let displaySalary = (!jobDetail.salaryMin && !jobDetail.salaryMax) ? "Thỏa thuận" : `${jobDetail.salaryMin} - ${jobDetail.salaryMax} triệu`;

    return (
        <div className="max-w-4xl mx-auto w-full pb-12 relative">

            {/* KHỐI 1: THÔNG TIN CƠ BẢN */}
            <div className="bg-white rounded-2xl shadow-sm border-t-8 border-olive p-8 mb-6">
                <h1 className="text-3xl font-bold text-textmain mb-6 pb-4 border-b border-gray-100">{jobDetail.title}</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                    <p onClick={() => navigate(`/detail-company/${jobDetail.company?.companyId}`)} className="flex items-center cursor-pointer hover:text-olive transition-colors">
                        <span className="text-xl mr-3">🏢</span> <strong>Công ty:</strong> &nbsp;{jobDetail.company?.companyName}
                    </p>
                    <p className="flex items-center"><span className="text-xl mr-3">📍</span> <strong>Khu vực:</strong> &nbsp;{jobDetail.location?.locationName}</p>
                    <p className="flex items-center"><span className="text-xl mr-3">💰</span> <strong>Lương:</strong> &nbsp;<span className="text-earth font-medium">{displaySalary}</span></p>
                    <p className="flex items-center"><span className="text-xl mr-3">⏳</span> <strong>Cấp bậc:</strong> &nbsp;{jobDetail.level}</p>
                </div>
            </div>

            {/* KHỐI 2: MÔ TẢ CHI TIẾT */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-olive mb-4 pl-3 border-l-4 border-earth">Mô tả công việc</h3>
                    <p className="text-textmain leading-relaxed whitespace-pre-line">{formatJDText(jobDetail.description)}</p>
                </div>
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-olive mb-4 pl-3 border-l-4 border-earth">Yêu cầu ứng viên</h3>
                    <p className="text-textmain leading-relaxed whitespace-pre-line">{formatJDText(jobDetail.requirement)}</p>
                </div>
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-olive mb-4 pl-3 border-l-4 border-earth">Quyền lợi</h3>
                    <p className="text-textmain leading-relaxed whitespace-pre-line">{formatJDText(jobDetail.benefits)}</p>
                </div>

                {/* NÚT MỞ MODAL ỨNG TUYỂN */}
                <div className="mt-10 pt-8 border-t border-dashed border-gray-200 text-center">
                    <button
                        className="bg-earth hover:bg-olive text-white text-lg font-bold py-3 px-12 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 w-full md:w-auto min-w-[300px]"
                        onClick={handleOpenModal}
                    >
                        {user ? (user.role === 'Candidate' ? "Ứng tuyển ngay" : "Bạn là nhà tuyển dụng") : "Đăng nhập để ứng tuyển"}
                    </button>
                </div>
            </div>

            {/* ======================================================= */}
            {/* MODAL (POPUP) XÁC NHẬN NỘP CV */}
            {/* ======================================================= */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">

                        {/* Header Modal */}
                        <div className="bg-olive px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-xl">Xác nhận ứng tuyển</h3>
                            <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-200 text-2xl leading-none">&times;</button>
                        </div>

                        {/* Body Modal */}
                        <div className="p-6">
                            <p className="text-gray-600 mb-6">
                                Bạn đang ứng tuyển vào vị trí <strong className="text-olive">{jobDetail.title}</strong>. Vui lòng chọn CV để gửi cho nhà tuyển dụng:
                            </p>

                            {/* Option 1: CV Mặc định */}
                            <label className={`flex items-center p-4 border rounded-xl mb-4 cursor-pointer transition-all ${cvOption === 'default' ? 'border-earth bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name="cvOption"
                                    value="default"
                                    checked={cvOption === 'default'}
                                    onChange={() => setCvOption('default')}
                                    className="w-5 h-5 text-earth focus:ring-earth"
                                />
                                <div className="ml-3">
                                    <span className="block font-bold text-textmain">Dùng CV mặc định</span>
                                    <span className="text-sm text-gray-500">Hệ thống sẽ lấy CV bạn đã lưu trong Hồ sơ cá nhân.</span>
                                </div>
                            </label>

                            {/* Option 2: Tải CV Mới */}
                            <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${cvOption === 'new' ? 'border-earth bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name="cvOption"
                                    value="new"
                                    checked={cvOption === 'new'}
                                    onChange={() => setCvOption('new')}
                                    className="w-5 h-5 text-earth focus:ring-earth"
                                />
                                <div className="ml-3 w-full">
                                    <span className="block font-bold text-textmain mb-1">Tải CV mới lên (PDF)</span>
                                    {cvOption === 'new' && (
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-olive file:text-white hover:file:bg-earth transition-all"
                                        />
                                    )}
                                </div>
                            </label>
                        </div>

                        {/* Footer Modal */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleConfirmApply}
                                disabled={isSubmitting}
                                className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-md transition-all ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-earth hover:bg-olive hover:-translate-y-0.5'}`}
                            >
                                {isSubmitting ? 'Đang gửi...' : 'Xác nhận nộp CV'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default DetailJobPage;