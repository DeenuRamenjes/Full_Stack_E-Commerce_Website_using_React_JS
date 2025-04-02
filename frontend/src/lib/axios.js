import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.mode === 'development' ? 'http://localhost:5000/api' : '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

// Add a request interceptor to handle token refresh
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't try to refresh if we're already on the login page or making a login request
            // Also don't try to refresh if we're checking auth or making a refresh token request
            if (window.location.pathname.includes('/login') || 
                originalRequest.url.includes('/auth/login') ||
                originalRequest.url.includes('/auth/signup') ||
                originalRequest.url.includes('/auth/refresh-token') ||
                originalRequest.url.includes('/auth/profile')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // If we're already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => axiosInstance(originalRequest))
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Try to refresh the token
                await axiosInstance.post('/auth/refresh-token');
                processQueue();
                // Retry the original request
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                // If refresh fails, clear user state and redirect to login
                if (refreshError.response?.status === 401) {
                    // Only redirect to login if we're not already on the login page
                    // and not checking auth
                    if (!window.location.pathname.includes('/login') && 
                        !originalRequest.url.includes('/auth/profile')) {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;