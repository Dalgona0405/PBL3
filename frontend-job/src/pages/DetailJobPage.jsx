import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URLS } from "../api/api";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../contexts/AuthContext";
import toast from 'react-hot-toast';

function DetailJobPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [jobDetail, setJobDetail] = useState(null);
    const { user } = useAuth(); // Lấy thông tin user từ AuthContext

    // STATE CHO MODAL NỘP CV
    const [showModal, setShowModal] = useState(false);
    const [cvOption, setCvOption] = useState('default'); // 'default' hoặc 'new'
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [matchScore, setMatchScore] = useState(null); // Điểm match (nếu có)

    useEffect(() => {
        const fetchJobDetail = async () => {
            try {
                const data = await axiosClient.get(`${API_URLS.JOBS}/${id}`);
                setJobDetail(data);
            } catch (error) {
                console.error('Lỗi lấy chi tiết:', error);
            }
        };

        const fetchMatchScore = async () => {
            if (user && user.role === 'Candidate') {
                try {
                    const matchData = await axiosClient.get(`${API_URLS.JOBS}/${id}/match/${user.id}`);
                    const score = matchData.MatchScore;
                    if (typeof score === 'number') {
                        setMatchScore(score);
                    }
                } catch (error) {
                    console.error('Lỗi lấy điểm match:', error);
                }
            }
        };
        fetchJobDetail();
        fetchMatchScore();
    }, [id]);

    // Hàm mở Modal
    const handleOpenModal = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'Candidate') {
            toast.error("Bạn là nhà tuyển dụng mà, sao lại tự đi xin việc? 😆", { id: toastId });
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
                toast.error("Vui lòng chỉ tải lên file PDF nha!", { id: toastId });
                e.target.value = null;
                return;
            }
            // Kiểm tra dung lượng (Ví dụ: Max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File CV nặng quá, vui lòng chọn file dưới 5MB!", { id: toastId });
                e.target.value = null;
                return;
            }
            setSelectedFile(file);
        }
    };

    // Hàm chính: Gửi đơn ứng tuyển
    const handleConfirmApply = async () => {
        setIsSubmitting(true);
        let finalCvUrl = ""; // Mặc định rỗng, Backend C# sẽ tự lấy CV mặc định

        try {
            // NẾU CHỌN CV MỚI: Phải upload file lên Server trước
            if (cvOption === 'new') {
                if (!selectedFile) {
                    toast.error("Bạn chưa chọn file CV mới kìa! 🌿", { id: toastId });
                    setIsSubmitting(false);
                    return;
                }

                const formData = new FormData();
                formData.append('file', selectedFile);

                const uploadRes = await axiosClient.post('/Files/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                finalCvUrl = uploadRes.file;
            }
            
             const payload = {
                userId: user.id,
                jobId: parseInt(id),
                cvUrl: finalCvUrl
            };

            await axiosClient.post(API_URLS.APPLICATIONS, payload);

            toast.success("🎉 Chúc mừng bạn! Nộp CV thành công rồi nè, chuẩn bị tinh thần HR gọi nha!", { id: toastId });
            setShowModal(false); // Đóng modal

        } catch (error) {
            const errorMsg = error.response?.data?.message || "Bạn đã ứng tuyển công việc này rồi hoặc lỗi mạng. 🌿";
            toast.error(`Lỗi: ${errorMsg}`, { id: toastId });
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

            {matchScore !== null && (
                <div className="bg-gradient-to-r from-cream to-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex flex-col md:flex-row items-center gap-6 transform transition-all hover:shadow-md">
                    <div className="w-20 h-20 shrink-0 rounded-full flex items-center justify-center border-4 border-olive bg-white shadow-inner relative">
                        <span className="text-2xl font-bold text-olive">{matchScore}%</span>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold text-olive mb-2">Độ phù hợp của bạn</h3>
                        <p className="text-gray-600">
                            {matchScore >= 80 
                                ? "Tuyệt vời! Kỹ năng của bạn cực kỳ phù hợp với vị trí này. Hãy ứng tuyển ngay nhé! 🚀" 
                                : matchScore >= 50 
                                ? "Khá tốt! Bạn có một số kỹ năng phù hợp. Đừng ngần ngại thử sức! 🌿" 
                                : "Có vẻ vị trí này yêu cầu một số kỹ năng mới. Đây là cơ hội tốt để học hỏi thêm! 📚"}
                        </p>
                    </div>
                </div>
            )}

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