import toast from "react-hot-toast";

/**
 * Trích xuất thông báo lỗi Tiếng Việt chuẩn hóa từ Backend (.NET ExceptionMiddleware / FluentValidation)
 */
export const extractApiErrorMessage = (
  error,
  fallbackMessage = "Đã có lỗi xảy ra. Vui lòng thử lại!",
) => {
  const responseData = error?.response?.data;

  if (!responseData) {
    return error?.message === "Network Error"
      ? "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng!"
      : fallbackMessage;
  }

  // 1. Ưu tiên trường message chuẩn hóa từ Backend
  if (typeof responseData.message === "string" && responseData.message.trim()) {
    return responseData.message;
  }

  // 2. Nếu có mảng lỗi chi tiết từ FluentValidation (errors: { SalaryMax: ["..."] })
  if (responseData.errors && typeof responseData.errors === "object") {
    const firstFieldErrors = Object.values(responseData.errors)[0];
    if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
      return firstFieldErrors[0];
    }
  }

  return fallbackMessage;
};

/**
 * Hiển thị toast lỗi chuẩn hóa từ API
 */
export const toastApiError = (error, fallbackMessage, toastId) => {
  const msg = extractApiErrorMessage(error, fallbackMessage);
  if (toastId) {
    toast.error(msg, { id: toastId });
  } else {
    toast.error(msg);
  }
  return msg;
};
