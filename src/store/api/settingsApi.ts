import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import { ApiPaths } from '../../api/apiPaths';
import { dataWithFallbacks, extractMapList } from '../../api/apiResponse';
import type { ExpenseModel, RoomSettingModel } from '../../types';

function parseRoomSetting(j: Record<string, unknown>): RoomSettingModel {
  return {
    id: Number(j['id'] ?? 0),
    name: String(j['name'] ?? ''),
    color: String(j['color'] ?? ''),
    startTime: String(j['start_time'] ?? ''),
    endTime: String(j['end_time'] ?? ''),
  };
}

function parseExpense(j: Record<string, unknown>): ExpenseModel {
  return {
    id: Number(j['id'] ?? 0),
    name: (j['name'] ?? j['title'] ?? '') as string,
    amount: Number(j['amount'] ?? 0),
    category: j['category'] as string | undefined,
    date: j['date'] as string | undefined,
    createdAt: (j['created_at'] ?? j['date'] ?? '') as string,
    comment: j['comment'] as string | undefined,
  };
}

function expenseToBody(data: {
  name: string;
  amount: number;
  category?: string;
  date?: string;
  comment?: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: data.name,
    amount: data.amount,
  };
  if (data.category !== undefined) body['category'] = data.category;
  if (data.date !== undefined) body['date'] = data.date;
  if (data.comment !== undefined) body['comment'] = data.comment;
  return body;
}

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Expense', 'SettingsRoom', 'Branch', 'Role', 'Marketing'],
  endpoints: (builder) => ({
    getExpenses: builder.query<ExpenseModel[], void>({
      query: () => ({ url: ApiPaths.settingsExpenses }),
      providesTags: ['Expense'],
      transformResponse: (raw) => extractMapList(raw).map(parseExpense),
    }),
    getExpenseLimit: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: ApiPaths.settingsExpensesLimit }),
      providesTags: ['Expense'],
    }),
    patchExpenseLimit: builder.mutation<Record<string, unknown>, Record<string, unknown>>({
      query: (data) => ({ url: ApiPaths.settingsExpensesLimit, method: 'POST', data }),
      invalidatesTags: ['Expense'],
    }),
    getExpenseCategories: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: ApiPaths.settingsExpenseCategories }),
      providesTags: ['Expense'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    createExpense: builder.mutation<ExpenseModel, {
      name: string;
      amount: number;
      category?: string;
      date?: string;
      comment?: string;
    }>({
      query: (data) => ({
        url: ApiPaths.settingsExpenses,
        method: 'POST',
        data: expenseToBody(data),
      }),
      invalidatesTags: ['Expense'],
      transformResponse: (raw) => parseExpense(raw as Record<string, unknown>),
    }),
    updateExpense: builder.mutation<ExpenseModel, {
      id: number;
      name: string;
      amount: number;
      category?: string;
      date?: string;
      comment?: string;
    }>({
      query: (data) => ({
        url: ApiPaths.settingsExpense(data.id),
        method: 'PATCH',
        data: expenseToBody(data),
      }),
      invalidatesTags: ['Expense'],
      transformResponse: (raw) => parseExpense(raw as Record<string, unknown>),
    }),
    deleteExpense: builder.mutation<void, number>({
      query: (id) => ({ url: ApiPaths.settingsExpense(id), method: 'DELETE' }),
      invalidatesTags: ['Expense'],
    }),

    getSettingsRooms: builder.query<RoomSettingModel[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsRooms },
            { url: '/group/rooms/' },
          ],
          (raw) => extractMapList(raw).map(parseRoomSetting)
        ),
      providesTags: ['SettingsRoom'],
    }),
    createSettingsRoom: builder.mutation<RoomSettingModel, {
      name: string;
      color: string;
      startTime: string;
      endTime: string;
    }>({
      query: (data) => ({
        url: ApiPaths.analyticsRooms,
        method: 'POST',
        data: {
          name: data.name,
          color: data.color,
          start_time: data.startTime,
          end_time: data.endTime,
        },
      }),
      invalidatesTags: ['SettingsRoom'],
      transformResponse: (raw) => parseRoomSetting(raw as Record<string, unknown>),
    }),
    updateSettingsRoom: builder.mutation<RoomSettingModel, {
      id: number;
      name: string;
      color: string;
      startTime: string;
      endTime: string;
    }>({
      query: (data) => ({
        url: ApiPaths.analyticsRoom(data.id),
        method: 'PATCH',
        data: {
          name: data.name,
          color: data.color,
          start_time: data.startTime,
          end_time: data.endTime,
        },
      }),
      invalidatesTags: ['SettingsRoom'],
      transformResponse: (raw) => parseRoomSetting(raw as Record<string, unknown>),
    }),
    deleteSettingsRoom: builder.mutation<void, number>({
      query: (id) => ({ url: ApiPaths.analyticsRoom(id), method: 'DELETE' }),
      invalidatesTags: ['SettingsRoom'],
    }),
    getBranches: builder.query<Record<string, unknown>[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.workerBranches },
            { url: ApiPaths.settingsBranches },
          ],
          (raw) => extractMapList(raw)
        ),
      providesTags: ['Branch'],
    }),
    createBranch: builder.mutation<Record<string, unknown>, Record<string, unknown>>({
      query: (data) => ({ url: ApiPaths.settingsBranches, method: 'POST', data }),
      invalidatesTags: ['Branch'],
    }),
    switchBranch: builder.mutation<void, string | number>({
      query: (id) => ({ url: `/settings/branches/${id}/switch/`, method: 'POST', data: {} }),
      invalidatesTags: ['Branch'],
    }),
    getRoles: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: ApiPaths.settingsRoles }),
      providesTags: ['Role'],
      transformResponse: (raw) => extractMapList(raw),
    }),
    createRole: builder.mutation<Record<string, unknown>, Record<string, unknown>>({
      query: (data) => ({ url: ApiPaths.settingsRoles, method: 'POST', data }),
      invalidatesTags: ['Role'],
    }),
    patchRolePermissions: builder.mutation<void, { id: string; permissions: unknown }>({
      query: ({ id, permissions }) => ({
        url: `/settings/roles/${id}/permissions/`,
        method: 'PATCH',
        data: { permissions },
      }),
      invalidatesTags: ['Role'],
    }),
    getMyAccess: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: ApiPaths.settingsRolesMyPermissions }),
      providesTags: ['Role'],
    }),
    getMarketingFunnel: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: ApiPaths.settingsMarketingFunnel }),
      providesTags: ['Marketing'],
    }),
    createMarketingFunnelStage: builder.mutation<Record<string, unknown>, Record<string, unknown>>({
      query: (data) => ({ url: ApiPaths.settingsMarketingFunnelStage, method: 'POST', data }),
      invalidatesTags: ['Marketing'],
    }),
    patchMarketingFunnelStage: builder.mutation<Record<string, unknown>, { id: string | number; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: ApiPaths.settingsMarketingFunnelStageId(id), method: 'PATCH', data }),
      invalidatesTags: ['Marketing'],
    }),
    moveMarketingFunnelStage: builder.mutation<void, { id: string | number; direction?: string; position?: number }>({
      query: ({ id, ...data }) => ({ url: ApiPaths.settingsMarketingFunnelStageId(id), method: 'POST', data }),
      invalidatesTags: ['Marketing'],
    }),
    getMarketingSources: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: ApiPaths.settingsMarketingSources }),
      providesTags: ['Marketing'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    getMarketingPlatforms: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: '/settings/marketing/sources/platforms/' }),
      providesTags: ['Marketing'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    createMarketingSource: builder.mutation<Record<string, unknown>, Record<string, unknown>>({
      query: (data) => ({ url: ApiPaths.settingsMarketingSources, method: 'POST', data }),
      invalidatesTags: ['Marketing'],
    }),
    createMarketingSourceSpend: builder.mutation<Record<string, unknown>, { sourceId: string | number; data: Record<string, unknown> }>({
      query: ({ sourceId, data }) => ({
        url: `/settings/marketing/sources/${sourceId}/spends/`,
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Marketing'],
    }),
    getMarketingSourceSpends: builder.query<Record<string, unknown>[], string | number>({
      query: (sourceId) => ({ url: `/settings/marketing/sources/${sourceId}/spends/` }),
      providesTags: ['Marketing'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    getMarketingOverview: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: ApiPaths.settingsMarketingOverview }),
      providesTags: ['Marketing'],
    }),
    getMarketingLeadStats: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: '/settings/marketing/lead-stats/' }),
      providesTags: ['Marketing'],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpenseLimitQuery,
  usePatchExpenseLimitMutation,
  useGetExpenseCategoriesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetSettingsRoomsQuery,
  useCreateSettingsRoomMutation,
  useUpdateSettingsRoomMutation,
  useDeleteSettingsRoomMutation,
  useGetBranchesQuery,
  useCreateBranchMutation,
  useSwitchBranchMutation,
  useGetRolesQuery,
  useCreateRoleMutation,
  usePatchRolePermissionsMutation,
  useGetMyAccessQuery,
  useGetMarketingFunnelQuery,
  useCreateMarketingFunnelStageMutation,
  usePatchMarketingFunnelStageMutation,
  useMoveMarketingFunnelStageMutation,
  useGetMarketingSourcesQuery,
  useGetMarketingPlatformsQuery,
  useCreateMarketingSourceMutation,
  useCreateMarketingSourceSpendMutation,
  useGetMarketingSourceSpendsQuery,
  useGetMarketingOverviewQuery,
  useGetMarketingLeadStatsQuery,
} = settingsApi;
