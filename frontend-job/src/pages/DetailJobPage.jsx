// File: src/pages/DetailJobPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { API_URLS } from "../api/api";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../contexts/AuthContext";
import toast from 'react-hot-toast';

function DetailJobPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const [jobDetail, setJobDetail] = useState(null);
    const { user } = useAuth();

    const [showModal, setShowModal] = useState(false);
    const [cvOption, setCvOption] = useState('default');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [matchResult, setMatchResult] = useState(null);

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
                    const data = await axiosClient.get(`${API_URLS.JOBS}/${id}/match/${user.id}`);
                    setMatchResult(data);
                } catch (error) {
                    console.error('Lỗi lấy điểm match:', error);
                }
            }
        };
        fetchJobDetail();
        fetchMatchScore();
    }, [id, user]);

    const handleOpenModal = () => {
        if (!user) {
            toast.error("Bạn cần đăng nhập để ứng tuyển nha! 🌿");
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        if (user.role !== 'Candidate') {
            toast.error("Bạn là nhà tuyển dụng mà, sao lại tự đi xin việc? 😆");
            return;
        }
        setShowModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                toast.error("Vui lòng chỉ tải lên file PDF nha!");
                e.target.value = null;
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File CV nặng quá, vui lòng chọn file dưới 5MB!");
                e.target.value = null;
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleConfirmApply = async () => {
        setIsSubmitting(true);
        let finalCvUrl = "";
        const toastId = toast.loading("Đang gửi hồ sơ của bạn... 🌿");

        try {
            if (cvOption === 'new') {
                if (!selectedFile) {
                    toast.error("Bạn chưa chọn file CV mới kìa! 🌿", { id: toastId });
                    setIsSubmitting(false);
                    return;
                }
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadRes = await axiosClient.post('/files/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalCvUrl = uploadRes.url || uploadRes.fileUrl || uploadRes.data || uploadRes.file || uploadRes;
            }

            const payload = {
                userId: user.id,
                jobId: parseInt(id),
                cvUrl: finalCvUrl
            };

            await axiosClient.post(API_URLS.APPLICATIONS, payload);
            toast.success("🎉 Chúc mừng bạn! Nộp CV thành công rồi nè!", { id: toastId });
            setShowModal(false);

        } catch (error) {
            const errorMsg = error.response?.data?.message || "Bạn đã ứng tuyển công việc này rồi hoặc lỗi mạng. 🌿";
            toast.error(`Lỗi: ${errorMsg}`, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 🌟 HÀM FORMAT TEXT XỊN XÒ (ĐÃ FIX LỖI BĂM NÁT CHỮ TIẾNG VIỆT)
    const formatJDText = (text) => {
        if (!text) return null;

        // Bước 1: Tách chỗ có dấu câu dính liền chữ Hoa (VD: "quốc tế.Chi tiết" -> "quốc tế.\nChi tiết")
        let formatted = text.replace(/([.;:)])([A-ZĐ])/g, '$1\n$2');

        // Bước 2: Tách chỗ chữ thường dính liền chữ Hoa (VD: "nghiệp vụCó ít nhất" -> "nghiệp vụ\nCó ít nhất")
        // Dùng \p{Ll} để nhận diện an toàn mọi chữ cái viết thường của tiếng Việt
        formatted = formatted.replace(/(\p{Ll})([A-ZĐ])/gu, '$1\n$2');

        // Bước 3: Cắt thành từng dòng dựa trên dấu \n vừa thêm
        const sentences = formatted.split('\n');

        return (
            <ul className="list-disc pl-5 space-y-2 text-gray-700 leading-relaxed">
                {sentences.map((sentence, index) => {
                    const cleanSentence = sentence.trim();
                    // Bỏ qua các dòng quá ngắn (dưới 2 ký tự)
                    if (cleanSentence.length > 2) {
                        return <li key={index}>{cleanSentence}</li>;
                    }
                    return null;
                })}
            </ul>
        );
    };

    if (!jobDetail) return <div className="flex justify-center items-center h-64 text-olive text-xl animate-pulse">Đang tải thông tin công việc... 🌿</div>;

    // 🌟 LOGIC XỬ LÝ LƯƠNG THÔNG MINH
    let displaySalary = "Thỏa thuận";
    if (jobDetail.salaryMin && jobDetail.salaryMax) {
        displaySalary = jobDetail.salaryMin === jobDetail.salaryMax
            ? `${jobDetail.salaryMin} triệu`
            : `${jobDetail.salaryMin} - ${jobDetail.salaryMax} triệu`;
    } else if (jobDetail.salaryMin && !jobDetail.salaryMax) {
        displaySalary = `Từ ${jobDetail.salaryMin} triệu`;
    } else if (!jobDetail.salaryMin && jobDetail.salaryMax) {
        displaySalary = `Lên đến ${jobDetail.salaryMax} triệu`;
    }

    return (
        <div className="max-w-6xl mx-auto w-full pb-12 relative">

            {/* NÚT QUAY LẠI */}
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-olive font-medium flex items-center gap-2 mb-6 transition-colors">
                ⬅ Quay lại
            </button>

            {/* 🌟 HEADER: THÔNG TIN TỔNG QUAN */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 flex flex-col md:flex-row gap-6 items-start">
                {/* Logo Công ty */}
                <div
                    className="w-28 h-28 rounded-2xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-2 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/detail-company/${jobDetail.company?.companyId}`)}
                >
                    {jobDetail.company?.logoImg ? (
                        <img src={jobDetail.company.logoImg} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <span className="text-4xl">🏢</span>
                    )}
                </div>

                {/* Thông tin chính */}
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-textmain mb-2 leading-tight">{jobDetail.title}</h1>
                    <p
                        className="text-lg text-olive font-bold mb-4 cursor-pointer hover:text-earth transition-colors"
                        onClick={() => navigate(`/detail-company/${jobDetail.company?.companyId}`)}
                    >
                        {jobDetail.company?.companyName}
                    </p>

                    {/* Các chỉ số (Metrics) */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
                        <span className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-1.5">
                            🕒 Đăng ngày: {new Date(jobDetail.postedDate).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-1.5">
                            👁️ {jobDetail.viewCount || 0} lượt xem
                        </span>
                        <span className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-1.5">
                            📥 {jobDetail.applicationCount || 0} lượt ứng tuyển
                        </span>
                    </div>
                </div>
            </div>

            {/* 🌟 BENTO BOX LAYOUT: CHIA 2 CỘT */}
            <div className="flex flex-col lg:flex-row gap-8">

                {/* CỘT TRÁI (70%): NỘI DUNG CHI TIẾT */}
                <div className="lg:w-2/3 space-y-8">

                    {/* Độ phù hợp AI (Nếu có) */}
                    {matchResult && matchResult.matchScore !== undefined && (
                        <div className="bg-gradient-to-r from-cream to-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center gap-6 transform transition-all hover:shadow-md">
                            
                            {/* Vòng tròn điểm số */}
                            <div className="w-20 h-20 shrink-0 rounded-full flex items-center justify-center border-4 border-olive bg-white shadow-inner relative">
                                <span className="text-2xl font-bold text-olive">
                                    {matchResult.matchScore}%
                                </span>
                            </div>
                            
                            {/* Nội dung phân tích */}
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-xl font-bold text-olive mb-2">Độ phù hợp của bạn</h3>
                                
                                {/* 🌟 Hiển thị Lời khuyên (Advice) từ Backend AI */}
                                <p className="text-gray-700 font-medium mb-3">
                                    {matchResult.advice || "Hệ thống đang phân tích hồ sơ của bạn..."}
                                </p>

                                {/* 🌟 Hiển thị Danh sách Kỹ năng còn thiếu (Missing Skills) */}
                                {matchResult.missingSkills && matchResult.missingSkills.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start mt-2 pt-3 border-t border-gray-100 border-dashed">
                                        <span className="text-sm text-red-500 font-bold flex items-center gap-1">
                                            ⚠️ Cần bổ sung:
                                        </span>
                                        {matchResult.missingSkills.map((skill, index) => (
                                            <span 
                                                key={index} 
                                                className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-xs font-bold border border-red-100"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Thẻ Kỹ năng (Tags) */}
                    {jobDetail.tags && jobDetail.tags.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <h3 className="text-xl font-bold text-olive mb-4 flex items-center gap-2">
                                🏷️ Thẻ từ khóa (Tags)
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {jobDetail.tags.map(tag => (
                                    <span key={tag.tagId} className="bg-cream text-olive px-4 py-1.5 rounded-xl text-sm font-medium border border-gray-200">
                                        {tag.tagName}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chi tiết JD */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-olive mb-4 pl-3 border-l-4 border-earth">Mô tả công việc</h3>
                            {formatJDText(jobDetail.description)}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-olive mb-4 pl-3 border-l-4 border-earth">Yêu cầu ứng viên</h3>
                            {formatJDText(jobDetail.requirement)}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-olive mb-4 pl-3 border-l-4 border-earth">Quyền lợi</h3>
                            {formatJDText(jobDetail.benefits)}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI (30%): STICKY SIDEBAR (TÓM TẮT & NÚT ỨNG TUYỂN) */}
                <div className="lg:w-1/3">
                    <div className="bg-white rounded-3xl shadow-sm border-t-8 border-olive p-6 sticky top-8">
                        <h3 className="text-xl font-bold text-textmain mb-6 border-b border-gray-100 pb-4">Tóm tắt công việc</h3>

                        <div className="space-y-5 mb-8">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-lg shrink-0">💰</div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Mức lương</p>
                                    <p className="font-bold text-earth">{displaySalary}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-lg shrink-0">📍</div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Địa điểm</p>
                                    <p className="font-bold text-textmain">{jobDetail.location?.locationName || "Chưa cập nhật"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-lg shrink-0">⏳</div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Kinh nghiệm</p>
                                    <p className="font-bold text-textmain">{jobDetail.expYear || "Không yêu cầu"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-lg shrink-0">🎓</div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Cấp bậc</p>
                                    <p className="font-bold text-textmain">{jobDetail.level || "Nhân viên"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-lg shrink-0">⏰</div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Hạn nộp hồ sơ</p>
                                    <p className="font-bold text-red-500">{jobDetail.deadline ? new Date(jobDetail.deadline).toLocaleDateString('vi-VN') : "Không thời hạn"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Địa chỉ chi tiết */}
                        <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-sm font-bold text-olive mb-1">Địa chỉ cụ thể:</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{jobDetail.address || "Chưa cập nhật"}</p>
                        </div>

                        {/* NÚT ỨNG TUYỂN */}
                        <button
                            className="w-full bg-olive hover:bg-earth text-white text-lg font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                            onClick={handleOpenModal}
                        >
                            {user ? (user.role === 'Candidate' ? "🚀 Ứng tuyển ngay" : "Bạn là nhà tuyển dụng") : "Đăng nhập để ứng tuyển"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ======================================================= */}
            {/* MODAL (POPUP) XÁC NHẬN NỘP CV (Giữ nguyên logic, làm đẹp UI) */}
            {/* ======================================================= */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border-t-8 border-olive">
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-cream">
                            <h3 className="text-2xl font-bold text-olive flex items-center gap-2">🚀 Xác nhận ứng tuyển</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 text-3xl leading-none transition-colors">&times;</button>
                        </div>

                        <div className="p-8">
                            <p className="text-gray-600 mb-6 text-lg">
                                Bạn đang ứng tuyển vào vị trí <strong className="text-olive">{jobDetail.title}</strong>. Vui lòng chọn CV:
                            </p>

                            <label className={`flex items-center p-5 border-2 rounded-2xl mb-4 cursor-pointer transition-all ${cvOption === 'default' ? 'border-earth bg-cream' : 'border-gray-100 hover:bg-gray-50'}`}>
                                <input type="radio" name="cvOption" value="default" checked={cvOption === 'default'} onChange={() => setCvOption('default')} className="w-5 h-5 text-earth focus:ring-earth" />
                                <div className="ml-4">
                                    <span className="block font-bold text-textmain text-lg">Dùng CV mặc định</span>
                                    <span className="text-sm text-gray-500">Hệ thống sẽ lấy CV bạn đã lưu trong Hồ sơ.</span>
                                </div>
                            </label>

                            <label className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${cvOption === 'new' ? 'border-earth bg-cream' : 'border-gray-100 hover:bg-gray-50'}`}>
                                <input type="radio" name="cvOption" value="new" checked={cvOption === 'new'} onChange={() => setCvOption('new')} className="w-5 h-5 text-earth focus:ring-earth" />
                                <div className="ml-4 w-full">
                                    <span className="block font-bold text-textmain text-lg mb-1">Tải CV mới lên (PDF)</span>
                                    {cvOption === 'new' && (
                                        <input type="file" accept=".pdf" onChange={handleFileChange} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-olive hover:file:bg-olive hover:file:text-white transition-all border border-gray-200" />
                                    )}
                                </div>
                            </label>
                        </div>

                        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">Hủy bỏ</button>
                            <button onClick={handleConfirmApply} disabled={isSubmitting} className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-md transition-all ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-earth hover:bg-olive hover:-translate-y-0.5'}`}>
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