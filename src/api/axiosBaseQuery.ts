import axios from 'axios';

const DEFAULT_API_BASE_URL = 'https://crm1.the-mind.uz/api';

function normalizeBaseUrl(value?: string): string {
    const raw = value?.trim() || DEFAULT_API_BASE_URL;
    return raw.replace(/\/+$/, '');
}

function readStorage(keys: string[]): string | null {
    for (const key of keys) {
        const value = localStorage.getItem(key);
        if (value && value.trim()) return value.trim();
    }
    return null;
}

function isLatin1Only(value: string): boolean {
    for (let i = 0; i < value.length; i += 1) {
        if (value.charCodeAt(i) > 0xff) return false;
    }
    return true;
}

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;

export const BASE_URL = normalizeBaseUrl(viteEnv?.VITE_API_BASE_URL);

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 120000,
    headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    const isTokenRoute =
        config.url?.includes('/token/') || config.url?.includes('/token/refresh/');

    if (token && !isTokenRoute) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    const branchId = readStorage(['selectedBranchId', 'branchId', 'branch_id']);
    const branchName = readStorage(['selectedBranchName', 'branchName', 'branch_name']);

    if (branchId) {
        config.headers['X-Branch-Id'] = branchId;
    }
    if (branchName && isLatin1Only(branchName)) {
        config.headers['X-Branch-Name'] = branchName;
    }

    return config;
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((p) => {
        if (error) p.reject(error);
        else p.resolve(token!);
    });
    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return axiosInstance(originalRequest);
                    })
                    .catch(Promise.reject.bind(Promise));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const res = await axios.post(`${BASE_URL}/token/refresh/`, {
                    refresh: refreshToken,
                });

                const newToken: string = res.data.access;
                const newRefresh: string | undefined = res.data.refresh;
                localStorage.setItem('accessToken', newToken);
                if (newRefresh) {
                    localStorage.setItem('refreshToken', newRefresh);
                }
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                processQueue(null, newToken);

                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('role');
                window.location.href = '/auth';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export const axiosBaseQuery =
    ({ baseUrl }: { baseUrl?: string } = { baseUrl: '' }) =>
        async ({
            url,
            method = 'GET',
            data,
            params,
        }: {
            url: string;
            method?: string;
            data?: unknown;
            params?: unknown;
        }) => {
            try {
                const result = await axiosInstance({
                    url: `${baseUrl ?? ''}${url}`,
                    method,
                    data,
                    params,
                });
                return { data: result.data };
            } catch (axiosError: unknown) {
                const err = axiosError as { response?: { status: number; data: unknown }; message: string };
                return {
                    error: {
                        status: err.response?.status,
                        data: err.response?.data || err.message,
                    },
                };
            }
        };

export default axiosInstance;
