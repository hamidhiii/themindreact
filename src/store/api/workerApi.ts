import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import type { AdminModel, WorkerFinanceModel } from '../../types';

function parseAdmin(j: Record<string, unknown>): AdminModel {
  const fullName = String(j['full_name'] ?? j['name'] ?? '').trim();
  const [fallbackFirst = '', ...fallbackLastParts] = fullName.split(/\s+/).filter(Boolean);

  return {
    id: String(j['id'] ?? ''),
    firstName: String(j['first_name'] ?? fallbackFirst),
    lastName: String(j['last_name'] ?? fallbackLastParts.join(' ')),
    role: (j['role'] ?? '') as string,
    roleDisplay: (j['role_display'] ?? '') as string,
    phoneNumber: j['phone_number'] as string | undefined,
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

export const workerApi = createApi({
  reducerPath: 'workerApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Worker'],
  endpoints: (builder) => ({
    getWorkers: builder.query<AdminModel[], void>({
      query: () => ({ url: '/users/workers/' }),
      providesTags: ['Worker'],
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseAdmin);
      },
    }),
    getWorkerById: builder.query<AdminModel, string>({
      query: (id) => ({ url: `/users/workers/${id}/` }),
      providesTags: ['Worker'],
      transformResponse: (raw) => parseAdmin(raw as Record<string, unknown>),
    }),
    getWorkerChoices: builder.query<AdminModel[], void>({
      query: () => ({ url: '/users/workers/choices/' }),
      providesTags: ['Worker'],
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseAdmin);
      },
    }),
    createWorker: builder.mutation<AdminModel, {
      firstName: string;
      lastName: string;
      role: string;
      phoneNumber?: string;
      isActive?: boolean;
      password: string;
    }>({
      query: (data) => ({
        url: '/users/workers/',
        method: 'POST',
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role,
          phone_number: data.phoneNumber,
          is_active: data.isActive ?? true,
          password: data.password,
        },
      }),
      invalidatesTags: ['Worker'],
      transformResponse: (raw) => parseAdmin(raw as Record<string, unknown>),
    }),
    deleteWorker: builder.mutation<void, string>({
      query: (id) => ({ url: `/users/workers/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Worker'],
    }),
    updateWorker: builder.mutation<AdminModel, {
      id: string;
      firstName: string;
      lastName: string;
      role: string;
      phoneNumber?: string;
      isActive?: boolean;
    }>({
      query: ({ id, ...data }) => ({
        url: `/users/workers/${id}/`,
        method: 'PATCH',
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role,
          phone_number: data.phoneNumber,
          is_active: data.isActive ?? true,
        },
      }),
      invalidatesTags: ['Worker'],
      transformResponse: (raw) => parseAdmin(raw as Record<string, unknown>),
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
