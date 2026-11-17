import React, { useState, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Heart,
  Building2,
  BadgeCheck,
  ShieldAlert,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Globe,
  Briefcase,
  Clock,
  Banknote,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import axiosClient from "../../api/axiosClient";
import { API_URLS } from "../../api/api";
import { useSavedJobsStore } from "../../stores/useSavedJobsStore";
import { toastApiError } from "../../utils/apiError";
import ExplainableScoreCard from "./ExplainableScoreCard";

const formatCardSalary = (salaryMin, salaryMax) => {
  if (salaryMin && salaryMax) {
    return salaryMin === salaryMax
      ? `${salaryMin} triệu`
      : `${salaryMin} - ${salaryMax} triệu`;
  }
  if (salaryMin && !salaryMax) return `Từ ${salaryMin} triệu`;
  if (!salaryMin && salaryMax) return `Lên đến ${salaryMax} triệu`;
  return "Thỏa thuận";
};

function JobCard(props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [imgError, setImgError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // TỐI ƯU RE-RENDER: Chỉ subscribe vào boolean của đúng jobId này thay vì toàn bộ mảng savedJobIds
  const isSavedInStore = useSavedJobsStore(
    useCallback((s) => s.savedJobIds.includes(props.jobId), [props.jobId]),
  );
  const setJobSavedState = useSavedJobsStore((s) => s.setJobSavedState);

  const isSaved =
    props.isSaved !== undefined ? Boolean(props.isSaved) : isSavedInStore;
  const displaySalary = formatCardSalary(props.salaryMin, props.salaryMax);
  const isVerified = Boolean(
    props.company?.isVerified || props.isCompanyVerified,
  );
  const isScraped = Boolean(props.isScraped || props.originalId);
  const isFreelance = Boolean(
    props.isFreelanceRecruiter ||
    (!props.company?.companyId && !props.companyId && !isScraped),
  );
  const hasAiScore =
    props.matchScore !== undefined && props.matchScore !== null;

  const handleToggleSave = async (e) => {
    e.stopPropagation();
    if (!user || user.role !== "Candidate") {
      toast.error(
        "Vui lòng đăng nhập bằng tài khoản Ứng viên để lưu việc làm.",
      );
      return;
    }
    if (isSaving) return;

    // OPTIMISTIC UPDATE: Đổi màu nút tim ngay lập tức trước khi API phản hồi
    const previousState = isSaved;
    const nextState = !previousState;
    setJobSavedState(props.jobId, nextState);
    setIsSaving(true);

    try {
      if (previousState) {
        await axiosClient.delete(`${API_URLS.JOBS}/${props.jobId}/save`);
        queryClient.setQueryData(["savedJobs"], (prev) =>
          Array.isArray(prev)
            ? prev.filter((j) => (j.jobId || j.job?.jobId) !== props.jobId)
            : prev,
        );
        toast.success("Đã bỏ lưu công việc.");
        props.onRemove?.(props.jobId);
      } else {
        await axiosClient.post(`${API_URLS.JOBS}/${props.jobId}/save`);
        queryClient.invalidateQueries({ queryKey: ["savedJobs"] });
        toast.success("Đã lưu vào danh sách việc làm yêu thích!");
      }
    } catch (err) {
      // ROLLBACK nếu API lỗi
      setJobSavedState(props.jobId, previousState);
      toastApiError(err, "Không thể cập nhật trạng thái lưu công việc.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article
      className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform-gpu hover:-translate-y-1 border border-gray-100 flex flex-col h-full group relative cursor-pointer"
      onClick={() => navigate(`/detail-job/${props.jobId}`)}
    >
      {(!user || user.role === "Candidate") && (
        <button
          type="button"
          onClick={handleToggleSave}
          disabled={isSaving}
          aria-label={isSaved ? "Bỏ lưu công việc" : "Lưu công việc"}
          className={`absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
            isSaved
              ? "bg-red-50 text-red-500 hover:bg-red-100"
              : "bg-gray-50 text-gray-400 hover:bg-cream hover:text-olive"
          }`}
          title={isSaved ? "Bỏ lưu" : "Lưu công việc"}
        >
          <Heart
            className={`w-5 h-5 transition-transform active:scale-125 ${isSaved ? "fill-current" : ""}`}
          />
        </button>
      )}

      <div className="flex items-start gap-4 mb-4 pr-10">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 border border-gray-100 shadow-sm overflow-hidden p-1.5">
          {props.company?.logoImg && !imgError ? (
            <img
              src={props.company.logoImg}
              alt={props.company.companyName || "Company Logo"}
              className="w-full h-full object-contain"
              loading={props.priority ? "eager" : "lazy"}
              onError={() => setImgError(true)}
            />
          ) : (
            <Building2 className="w-7 h-7 text-gray-300" />
          )}
        </div>
        <div className="flex-1 pt-0.5 min-w-0">
          <h3 className="text-lg font-bold text-textmain line-clamp-2 leading-snug mb-1 group-hover:text-olive transition-colors">
            {props.title}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm text-gray-500 font-medium line-clamp-1">
              {props.company?.companyName ||
                props.companyName ||
                (isFreelance ? "Nhà tuyển dụng độc lập" : "Doanh nghiệp")}
            </p>
            {isVerified && (
              <span
                className="inline-flex items-center gap-1 text-[11px] bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-bold shrink-0"
                title="Doanh nghiệp đã xác minh pháp lý"
              >
                <BadgeCheck className="w-3.5 h-3.5 text-sky-600" />
                Đã xác minh
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {isFreelance && (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            Nhà tuyển dụng độc lập (Chưa xác minh DN)
          </span>
        )}
        {hasAiScore && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowBreakdown((prev) => !prev);
            }}
            className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            {Math.round(Number(props.matchScore))}% AI Match
            {showBreakdown ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        )}
        {isScraped && (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            <Globe className="w-3 h-3" />
            Tin tổng hợp thị trường
          </span>
        )}
        {props.level && (
          <span className="inline-flex items-center gap-1 bg-cream text-olive text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-gray-200">
            <Briefcase className="w-3 h-3" />
            {props.level}
          </span>
        )}
        {props.expYear && (
          <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-gray-200">
            <Clock className="w-3 h-3" />
            {props.expYear}
          </span>
        )}
      </div>

      {showBreakdown && hasAiScore && (
        <div onClick={(e) => e.stopPropagation()} className="mb-4">
          <ExplainableScoreCard
            matchResult={{
              matchScore: props.matchScore,
              breakdown: props.breakdown,
              missingSkills: props.missingSkills,
              advice: props.advice,
            }}
            compact
          />
        </div>
      )}

      <div className="flex-1 space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold bg-gray-50 w-fit px-3 py-1.5 rounded-xl border border-gray-100">
          <Banknote className="w-4 h-4 text-earth shrink-0" />
          <span className="text-earth">{displaySalary}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500 text-sm px-1">
          <MapPin className="w-4 h-4 text-olive shrink-0" />
          <span className="truncate">
            {props.location?.locationName || "Chưa cập nhật địa điểm"}
          </span>
        </div>
      </div>

      <div className="w-full py-2.5 bg-gray-50 text-olive font-bold text-sm rounded-xl border border-gray-100 group-hover:bg-olive group-hover:text-white group-hover:border-olive transition-all duration-300 flex items-center justify-center gap-1.5">
        <span>Xem chi tiết</span>
        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </article>
  );
}

export default memo(JobCard);
