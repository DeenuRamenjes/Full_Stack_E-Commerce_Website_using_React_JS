import axios from "axios";

// Create axios instance with proper cookie handling
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true, // Important for cookie handling
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000, // 10 second timeout
    xsrfCookieName: 'csrfToken',
    xsrfHeaderName: 'X-CSRF-Token'
});

// Global state for refresh token promise
let refreshPromise = null;

// Function to handle refresh token
const handleRefreshToken = async () => {
    try {
        // If refresh is already in progress, wait for it to complete
        if (!refreshPromise) {
            // Get refresh token from cookies
            const refreshToken = document.cookie.split('; ').find(row => row.startsWith('refresh_token='))?.split('=')[1];
            if (!refreshToken) {
                throw new Error('No refresh token found');
            }
            
            // Send refresh request with credentials
            refreshPromise = axiosInstance.post('/auth/refresh-token', {}, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        
        const response = await refreshPromise;
        refreshPromise = null;
        
        // Extract new tokens from response
        const { accessToken } = response.data;
        if (accessToken) {
            // Update tokens in storage
            localStorage.setItem('token', accessToken);
            
            // Set new access token cookie
            document.cookie = `access_token=${accessToken}; Max-Age=${15 * 60}; path=/; sameSite=lax; secure`;
            
            return accessToken;
        }
        
        throw new Error('No access token received from refresh');
    } catch (error) {
        console.error('Refresh token failed:', error);
        // Clear refresh promise on error
        refreshPromise = null;
        // Clear any stored tokens
        localStorage.removeItem('token');
        // Clear cookies
        document.cookie = 'access_token=; Max-Age=0; path=/;';
        document.cookie = 'refresh_token=; Max-Age=0; path=/;';
        throw error;
    }
};

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        // Store any new tokens from response
        if (response.data.accessToken) {
            localStorage.setItem('token', response.data.accessToken);
            // Set access token cookie
            document.cookie = `access_token=${response.data.accessToken}; Max-Age=${15 * 60}; path=/; sameSite=lax; secure`;
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // Only handle 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Handle refresh token
                const newAccessToken = await handleRefreshToken();
                
                // Update the original request with new access token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                
                // Retry the original request
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Clear any stored tokens
                localStorage.removeItem('token');
                // Clear cookies
                document.cookie = 'access_token=; Max-Age=0; path=/;';
                document.cookie = 'refresh_token=; Max-Age=0; path=/;';
                // Don't redirect immediately, let the error propagate
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Request interceptor
axiosInstance.interceptors.request.use((config) => {
    // Add token to requests
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add credentials
    config.withCredentials = true;
    
    return config;
});

// Add a function to clear all tokens
export const clearTokens = () => {
    localStorage.removeItem('token');
    document.cookie = 'access_token=; Max-Age=0; path=/;';
    document.cookie = 'refresh_token=; Max-Age=0; path=/;';
};

export default axiosInstance;