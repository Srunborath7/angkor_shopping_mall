import axios from "axios";
import { config } from "./request";
import { store } from "../store/store";
import { setAuth, clearAuth } from "../store/authSlice";

// Create an axios instance
const apiClient = axios.create({
    baseURL: config.base_url,
    headers: {
        Accept: "application/json",
    },
    timeout: 30000,
});

const pendingRequests = new Map();

const getRequestKey = (axiosConfig) => {
    return `${axiosConfig.method}-${axiosConfig.url}-${JSON.stringify(axiosConfig.params || {})}`;
};

// Request interceptor to inject accessToken
apiClient.interceptors.request.use(
    (axiosConfig) => {
        let token = store.getState()?.auth?.token;
        if (!token || typeof token !== "string" || token === "undefined" || token === "null") {
            try {
                const rootPersist = localStorage.getItem("persist:root");
                if (rootPersist) {
                    const parsed = JSON.parse(rootPersist);
                    if (parsed.auth) {
                        const authObj = JSON.parse(parsed.auth);
                        token = authObj.token;
                    }
                }
                if (!token || typeof token !== "string" || token === "undefined" || token === "null") {
                    token = localStorage.getItem("token") || localStorage.getItem("accessToken");
                }
            } catch (e) {}
        }
        if (token && typeof token === "string" && token !== "undefined" && token !== "null" && token.trim().length > 10) {
            axiosConfig.headers.Authorization = `Bearer ${token.trim()}`;
        }
        
        // If data is not FormData, set Content-Type to application/json
        if (axiosConfig.data && !(axiosConfig.data instanceof FormData)) {
            axiosConfig.headers["Content-Type"] = "application/json";
        }
        
        return axiosConfig;
    },
    (error) => Promise.reject(error)
);

const retryableStatuses = [408, 429, 500, 502, 503, 504];

const isSharedMemoryError = (error) => {
    const data = error?.response?.data;
    const msg = String(
        (typeof data === "string" ? data : "") ||
        data?.message ||
        data?.error ||
        data?.details ||
        error?.message ||
        ""
    ).toLowerCase();

    return (
        msg.includes("out of shared memory") ||
        msg.includes("53200") ||
        msg.includes("max_locks_per_transaction") ||
        msg.includes("deadlock") ||
        msg.includes("too many clients") ||
        msg.includes("connection terminated") ||
        msg.includes("socket hang up")
    );
};

const shouldRetry = (error, retryCount = 0) => {
    if (retryCount >= 2) return false;
    if (!error.response) return true;
    if (error.response.status === 400 || error.response.status === 401 || error.response.status === 403 || error.response.status === 404) return false;
    if (isSharedMemoryError(error)) return true;
    return retryableStatuses.includes(error.response.status);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
                store.dispatch(clearAuth());
            }
        }
        
        // Retry logic for server errors and network issues
        if (shouldRetry(error, originalRequest._retryCount || 0)) {
            originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
            await delay(1000 * originalRequest._retryCount);
            return apiClient(originalRequest);
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
        if (typeof method === "string" && method.toUpperCase() === "GET") {
            configObj.params = data;
        } else {
            configObj.data = data;
        }
    }
    
    // Deduplicate concurrent identical GET requests
    const isGet = String(method).toUpperCase() === "GET";
    if (isGet) {
        const requestKey = getRequestKey(configObj);
        const existing = pendingRequests.get(requestKey);
        if (existing) {
            return existing;
        }
        
        const promise = apiClient(configObj)
            .finally(() => {
                pendingRequests.delete(requestKey);
            });
        pendingRequests.set(requestKey, promise);
        return promise;
    }
    
    return apiClient(configObj);
};