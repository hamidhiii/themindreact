import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import type { AuthTokens } from '../../types';

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: axiosBaseQuery(),
    endpoints: (builder) => ({
        login: builder.mutation<AuthTokens, { username: string; password: string }>({
            query: (credentials) => ({
                url: '/token/',
                method: 'POST',
                data: credentials,
            }),
        }),
        refreshToken: builder.mutation<{ access: string }, { refresh: string }>({
            query: (data) => ({
                url: '/token/refresh/',
                method: 'POST',
                data,
            }),
        }),
        blacklistToken: builder.mutation<void, { refresh: string }>({
            query: (data) => ({
                url: '/token/blacklist/',
                method: 'POST',
                data,
            }),
        }),
    }),
});

export const { useLoginMutation, useRefreshTokenMutation, useBlacklistTokenMutation } = authApi;
