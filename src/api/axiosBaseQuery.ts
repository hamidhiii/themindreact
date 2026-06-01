import axios from 'axios';
import { ApiPaths } from './apiPaths';
import { getSelectedBranchId, getSelectedBranchName } from '../utils/branchContext';

const DEFAULT_API_BASE_URL = 'https://crm1.the-mind.uz/api';

function normalizeBaseUrl(value?: string): string {
    const raw = value?.trim() || DEFAULT_API_BASE_URL;
    return raw.replace(/\/+$/, '');
}

function isLatin1Only(value: string): boolean {
    for (let i = 0; i < value.length; i += 1) {
        if (value.charCodeAt(i) > 0xff) return false;
    }
    return true;
}

function needsBranchHeader(path?: string): boolean {
    if (!path) return false;
    const isAuth =
        path.includes('/token/') ||
        path.includes(ApiPaths.authLogin) ||
        path.includes(ApiPaths.authRefresh);
    return !isAuth;
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
        config.url?.includes('/token/') ||
        config.url?.includes('/token/refresh/') ||
        config.url?.includes(ApiPaths.authLogin) ||
        config.url?.includes(ApiPaths.authRefresh);

    if (token && !isTokenRoute) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    let branchId = getSelectedBranchId();
    const branchName = getSelectedBranchName();
    if (!branchId && needsBranchHeader(config.url)) {
        branchId = '1';
    }
    if (branchId) {
        config.headers['x-branch-id'] = String(branchId);
        config.headers['X-Branch-Id'] = String(branchId);
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

function readTokenPayload(data: unknown): { access?: string; refresh?: string } {
    const raw = data && typeof data === 'object' ? data as Record<string, unknown> : {};
    const nested = raw['data'] && typeof raw['data'] === 'object'
        ? raw['data'] as Record<string, unknown>
        : raw;
    const access = nested['access'] ?? nested['access_token'] ?? nested['token'];
    const refresh = nested['refresh'] ?? nested['refresh_token'];
    return {
        access: typeof access === 'string' ? access : undefined,
        refresh: typeof refresh === 'string' ? refresh : undefined,
    };
}

async function refreshAccessToken(refreshToken: string): Promise<{ access: string; refresh?: string }> {
    const body = { refresh: refreshToken };
    const candidates = [ApiPaths.authRefresh, '/token/refresh/'];
    let lastError: unknown;

    for (const path of candidates) {
        try {
            const res = await axios.post(`${BASE_URL}${path}`, body);
            const tokens = readTokenPayload(res.data);
            if (tokens.access) return { access: tokens.access, refresh: tokens.refresh };
            throw new Error('Refresh response does not include an access token');
        } catch (error: unknown) {
            lastError = error;
            const status = (error as { response?: { status?: number } }).response?.status;
            if (status !== 404 && status !== 405 && status !== 410) break;
        }
    }

    throw lastError;
}

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

                const tokens = await refreshAccessToken(refreshToken);
                const newToken = tokens.access;
                const newRefresh = tokens.refresh;
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
