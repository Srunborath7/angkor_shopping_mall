import axios from "axios";
import { config } from "./request";
import { store } from "../store/store";
import { setAuth, clearAuth } from "../store/authSlice";

// Create an axios instance
const apiClient = axios.create({
    baseURL: config.base_url,
    headers: {
        Accept: "application/json",
    }
});

// Request interceptor to inject accessToken
apiClient.interceptors.request.use(
    (axiosConfig) => {
        const token = store.getState()?.auth?.token;
        if (token) {
            axiosConfig.headers.Authorization = `Bearer ${token}`;
        }
        
        // If data is not FormData, set Content-Type to application/json
        if (axiosConfig.data && !(axiosConfig.data instanceof FormData)) {
            axiosConfig.headers["Content-Type"] = "application/json";
        }
        return axiosConfig;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh gracefully
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;
        
        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            const authState = store.getState()?.auth;
            const refreshToken = authState?.refreshToken;
            
            if (refreshToken && !originalRequest.url?.includes("/auth/")) {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
                }
                
                originalRequest._retry = true;
                isRefreshing = true;
                
                try {
                    let refreshRes = null;
                    // Attempt token refresh if available
                    try {
                        refreshRes = await axios.post(`${config.base_url}/api/auth/refresh-token`, {
                            refreshToken: refreshToken
                        });
                    } catch (e) {
                        console.warn("Refresh token endpoint unavailable (404/401):", e.message);
                    }
                    
                    const newAccessToken = refreshRes?.data?.accessToken || refreshRes?.data?.token || refreshRes?.data?.data?.accessToken;
                    const newRefreshToken = refreshRes?.data?.refreshToken || refreshRes?.data?.refresh_token || refreshToken;
                    
                    if (newAccessToken) {
                        store.dispatch(setAuth({
                            token: newAccessToken,
                            refreshToken: newRefreshToken,
                            role: authState.role,
                            remember: authState.remember,
                            user: authState.user
                        }));
                        
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        processQueue(null, newAccessToken);
                        isRefreshing = false;
                        return apiClient(originalRequest);
                    } else {
                        // Refresh token expired or unavailable, clear stale token
                        processQueue(error, null);
                        isRefreshing = false;
                        store.dispatch(clearAuth());
                        return Promise.reject(error.response?.data || error);
                    }
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    isRefreshing = false;
                    store.dispatch(clearAuth());
                    return Promise.reject(refreshError);
                }
            } else {
                // Token invalid or no refresh token, clear stale state safely
                store.dispatch(clearAuth());
            }
        }
        
        return Promise.reject(error.response?.data || error);
    }
);

export const api = async (
    url,
    method = "GET",
    data = null
) => {
    const configObj = {
        url,
        method,
    };
    if (data !== null && data !== undefined) {
        configObj.data = data;
    }
    return apiClient(configObj);
};