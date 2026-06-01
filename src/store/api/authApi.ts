import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import { ApiPaths } from '../../api/apiPaths';
import { dataWithFallbacks, isRecord, unwrapDataMap } from '../../api/apiResponse';
import type { AuthTokens, CurrentUser } from '../../types';

function normalizeRole(role: unknown): string {
    const raw = String(role ?? '').trim();
    return raw === 'superadmin' ? 'super_admin' : raw;
}

function parseCurrentUser(raw: unknown): CurrentUser | undefined {
    if (!isRecord(raw)) return undefined;
    const user = unwrapDataMap(raw);
    const idRaw = user['id'];
    return {
        id: typeof idRaw === 'number' ? idRaw : Number(idRaw ?? 0),
        username: String(user['username'] ?? ''),
        fullName: (user['full_name'] ?? user['fullName']) as string | undefined,
        telegramUsername: (user['telegram_username'] ?? user['telegramUsername']) as string | undefined,
        phone: user['phone'] as string | undefined,
        systemRole: normalizeRole(user['system_role'] ?? user['role']),
        currentBranchId: user['current_branch_id'] != null ? Number(user['current_branch_id']) : undefined,
        permissions: isRecord(user['permissions'])
            ? user['permissions'] as Record<string, Record<string, boolean>>
            : {},
        branches: Array.isArray(user['branches']) ? user['branches'].filter(isRecord) : [],
    };
}

function parseAuthTokens(raw: unknown, fallbackRefresh?: string): AuthTokens {
    const data = unwrapDataMap(raw);
    const user = parseCurrentUser(data['user']);
    const access = data['access'] ?? data['access_token'] ?? data['token'];
    const refresh = data['refresh'] ?? data['refresh_token'] ?? fallbackRefresh;

    if (typeof access !== 'string' || !access.trim()) {
        throw new Error('Login response does not include an access token');
    }
    if (typeof refresh !== 'string' || !refresh.trim()) {
        throw new Error('Login response does not include a refresh token');
    }

    return { access, refresh, user };
}

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: axiosBaseQuery(),
    endpoints: (builder) => ({
        login: builder.mutation<AuthTokens, { username: string; password: string }>({
            queryFn: (credentials, _api, _extra, baseQuery) =>
                dataWithFallbacks(
                    baseQuery,
                    [
                        { url: ApiPaths.authLogin, method: 'POST', data: credentials },
                        { url: '/token/', method: 'POST', data: credentials },
                    ],
                    parseAuthTokens
                ),
        }),
        refreshToken: builder.mutation<{ access: string }, { refresh: string }>({
            queryFn: (data, _api, _extra, baseQuery) =>
                dataWithFallbacks(
                    baseQuery,
                    [
                        { url: ApiPaths.authRefresh, method: 'POST', data },
                        { url: '/token/refresh/', method: 'POST', data },
                    ],
                    (raw) => ({ access: parseAuthTokens(raw, data.refresh).access })
                ),
        }),
        blacklistToken: builder.mutation<void, { refresh: string }>({
            queryFn: (data, _api, _extra, baseQuery) =>
                dataWithFallbacks(
                    baseQuery,
                    [
                        { url: ApiPaths.authLogout, method: 'POST', data },
                        { url: '/token/blacklist/', method: 'POST', data },
                    ],
                    () => undefined
                ),
        }),
        getMe: builder.query<CurrentUser, void>({
            query: () => ({ url: ApiPaths.workersMe }),
            transformResponse: (raw) => parseCurrentUser(raw) ?? {
                id: 0,
                username: '',
                systemRole: '',
                permissions: {},
                branches: [],
            },
        }),
    }),
});

export const { useLoginMutation, useRefreshTokenMutation, useBlacklistTokenMutation, useGetMeQuery } = authApi;
