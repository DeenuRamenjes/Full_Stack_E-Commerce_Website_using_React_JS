import axios from "axios";

const instance = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add request interceptor for debugging
instance.interceptors.request.use((config) => {
    config.headers['X-Request-ID'] = Math.random().toString(36).substring(2);
    return config;
});

export default instance;
