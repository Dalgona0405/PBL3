import axios from 'axios';
import toast from 'react-hot-toast';
import { extractApiErrorMessage } from '../utils/apiError';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const HUB_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

let memoryAccessToken = null;
let refreshPromise = null;

export const getAccessToken = () => memoryAccessToken;
export const setAccessToken = (token) => {
    memoryAccessToken = token || null;
};

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Bắt buộc cho HttpOnly Cookie sjsp_refresh_token
    headers: { 'Content-Type': 'application/json' },
});

export const refreshAccessToken = async () => {
    if (!refreshPromise) {
        refreshPromise = axios
            .post(`${API_BASE_URL}/Auth/refresh`, {}, { withCredentials: true })
            .then((res) => {
                const payload = res.data;
                if (payload?.token) setAccessToken(payload.token);
                return payload;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
};

axiosClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const status = error.response?.status;
        const originalRequest = error.config;
        const reqUrl = String(originalRequest?.url || '').toLowerCase();
        const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/google-login', '/auth/refresh', '/auth/logout']
            .some((path) => reqUrl.includes(path));

        // Quy tắc 403 Forbidden: Chỉ báo lỗi, TUYỆT ĐỐI KHÔNG tự động Logout
        if (status === 403) {
            toast.error(extractApiErrorMessage(error, 'Bạn không có quyền thực hiện thao tác này.'));
            return Promise.reject(error);
        }

        // Quy tắc 401 Unauthorized: Tự động Refresh Token & gọi lại request
        if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;
            try {
                const refreshed = await refreshAccessToken();
                if (refreshed?.token) {
                    originalRequest.headers.Authorization = `Bearer ${refreshed.token}`;
                    return axiosClient(originalRequest);
                }
            } catch {
                // Refresh token cũng hết hạn -> Xóa phiên và chuyển về /login
            }
            setAccessToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;