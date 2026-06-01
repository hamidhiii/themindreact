import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import { ApiPaths } from '../../api/apiPaths';
import { dataWithFallbacks, extractMapList, unwrapEntity } from '../../api/apiResponse';
import { getSelectedBranchId } from '../../utils/branchContext';
import { extractLinkedTeacherId } from '../../utils/teacherProfile';
import { teacherApi } from './teacherApi';
import type { AdminModel, WorkerFinanceModel } from '../../types';

function parseAdmin(j: Record<string, unknown>): AdminModel {
  const fullName = String(j['full_name'] ?? j['name'] ?? '').trim();
  const username = String(j['username'] ?? '').trim();
  const [fallbackFirst = '', ...fallbackLastParts] = fullName.split(/\s+/).filter(Boolean);
  const systemRole = String(j['system_role'] ?? j['role'] ?? '');

  return {
    id: String(j['id'] ?? ''),
    firstName: String(j['first_name'] ?? (fallbackFirst || username)),
    lastName: String(j['last_name'] ?? fallbackLastParts.join(' ')),
    fullName: fullName || undefined,
    role: systemRole,
    roleDisplay: String(j['system_role_display'] ?? j['role_display'] ?? systemRole),
    phoneNumber: String(j['phone'] ?? j['phone_number'] ?? '').trim() || undefined,
    teacherId: extractLinkedTeacherId(j) || undefined,
    isActive: (j['is_active'] ?? true) as boolean,
  };
}

function parseWorkerFinance(j: Record<string, unknown>): WorkerFinanceModel {
  return {
    workerId: String(j['worker_id'] ?? j['id'] ?? ''),
    fullName: (j['full_name'] ?? '') as string,
    currentBalance: Number(j['current_balance'] ?? 0),
    salary: Number(j['salary'] ?? 0),
    bonus: Number(j['bonus'] ?? 0),
    penalty: Number(j['penalty'] ?? 0),
    nextPaymentDate: (j['next_payment_date'] ?? '') as string,
  };
}

function defaultBranchIds(branchIds?: number[]): number[] {
  if (branchIds && branchIds.length > 0) return branchIds;
  const id = Number(getSelectedBranchId() || 1);
  return Number.isNaN(id) ? [1] : [id];
}

function buildUsername(data: { username?: string; phoneNumber?: string; firstName: string; lastName?: string }): string {
  if (data.username?.trim()) return data.username.trim();
  const fromPhone = data.phoneNumber?.replace(/\D/g, '');
  if (fromPhone && fromPhone.length >= 4) return fromPhone;
  const fromName = [data.firstName, data.lastName].filter(Boolean).join('_').toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (fromName) return fromName;
  return `worker_${Date.now()}`;
}

function workerCreateBody(data: {
  username?: string;
  firstName: string;
  lastName?: string;
  role: string;
  phoneNumber?: string;
  password: string;
  isActive?: boolean;
  branchIds?: number[];
}): Record<string, unknown> {
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
  const body: Record<string, unknown> = {
    username: buildUsername(data),
    password: data.password,
    full_name: fullName,
    phone: data.phoneNumber ?? '',
    system_role: data.role,
    branch_ids: defaultBranchIds(data.branchIds),
    is_active: data.isActive ?? true,
  };
  if ((data.role ?? '').toLowerCase() === 'teacher') {
    body['salary_type'] = 'fixed';
    body['salary_amount'] = '0.00';
  }
  return body;
}

function workerUpdateBody(data: {
  firstName: string;
  lastName?: string;
  role: string;
  phoneNumber?: string;
  isActive?: boolean;
  branchIds?: number[];
  password?: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    full_name: [data.firstName, data.lastName].filter(Boolean).join(' ').trim(),
    phone: data.phoneNumber ?? '',
    system_role: data.role,
    is_active: data.isActive ?? true,
    branch_ids: defaultBranchIds(data.branchIds),
  };
  if (data.password?.trim()) body['password'] = data.password.trim();
  return body;
}

export const workerApi = createApi({
  reducerPath: 'workerApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Worker'],
  endpoints: (builder) => ({
    getWorkers: builder.query<AdminModel[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [{ url: ApiPaths.workers }],
          (raw) => extractMapList(raw).map(parseAdmin)
        ),
      providesTags: ['Worker'],
    }),
    getWorkerById: builder.query<AdminModel, string>({
      queryFn: (id, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [{ url: ApiPaths.worker(id) }],
          (raw) => parseAdmin(unwrapEntity(raw, ['user', 'worker', 'item', 'result']))
        ),
      providesTags: ['Worker'],
    }),
    getWorkerChoices: builder.query<AdminModel[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.workerChoices },
            { url: ApiPaths.workers },
          ],
          (raw) => extractMapList(raw).map(parseAdmin)
        ),
      providesTags: ['Worker'],
    }),
    createWorker: builder.mutation<AdminModel, {
      username?: string;
      firstName: string;
      lastName?: string;
      role: string;
      phoneNumber?: string;
      isActive?: boolean;
      password: string;
      branchIds?: number[];
    }>({
      query: (data) => ({
        url: ApiPaths.workers,
        method: 'POST',
        data: workerCreateBody(data),
      }),
      invalidatesTags: ['Worker'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          if ((arg.role ?? '').toLowerCase() === 'teacher') {
            dispatch(teacherApi.util.invalidateTags(['Teacher']));
          }
        } catch {
          /* mutation failed */
        }
      },
      transformResponse: (raw) => parseAdmin(unwrapEntity(raw, ['user', 'worker', 'item', 'result'])),
    }),
    deleteWorker: builder.mutation<void, string>({
      query: (id) => ({ url: ApiPaths.worker(id), method: 'DELETE' }),
      invalidatesTags: ['Worker'],
    }),
    updateWorker: builder.mutation<AdminModel, {
      id: string;
      firstName: string;
      lastName?: string;
      role: string;
      phoneNumber?: string;
      isActive?: boolean;
      password?: string;
      branchIds?: number[];
    }>({
      query: ({ id, ...data }) => ({
        url: ApiPaths.worker(id),
        method: 'PATCH',
        data: workerUpdateBody(data),
      }),
      invalidatesTags: ['Worker'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          if ((arg.role ?? '').toLowerCase() === 'teacher') {
            dispatch(teacherApi.util.invalidateTags(['Teacher']));
          }
        } catch {
          /* mutation failed */
        }
      },
      transformResponse: (raw) => parseAdmin(unwrapEntity(raw, ['user', 'worker', 'item', 'result'])),
    }),
    getWorkerFinance: builder.query<WorkerFinanceModel, string>({
      query: (id) => ({ url: `/users/workers/${id}/finance/` }),
      transformResponse: (raw) => parseWorkerFinance(raw as Record<string, unknown>),
    }),
  }),
});

export const {
  useGetWorkersQuery,
  useGetWorkerByIdQuery,
  useGetWorkerChoicesQuery,
  useCreateWorkerMutation,
  useDeleteWorkerMutation,
  useUpdateWorkerMutation,
  useGetWorkerFinanceQuery,
} = workerApi;
