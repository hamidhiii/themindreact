import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import type { TransactionModel } from '../../types';

function parseTransaction(j: Record<string, unknown>): TransactionModel {
  return {
    id: Number(j['id'] ?? 0),
    studentName: (j['student_name'] ?? '') as string,
    groupName: (j['group_name'] ?? '') as string,
    amount: String(j['amount'] ?? '0'),
    payWith: (j['pay_with'] ?? '') as string,
    payWithDisplay: (j['pay_with_display'] ?? '') as string,
    createdAt: (j['created_at'] ?? '') as string,
  };
}

export const transactionApi = createApi({
  reducerPath: 'transactionApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Transaction'],
  endpoints: (builder) => ({
    getTransactions: builder.query<TransactionModel[], {
      page?: number;
      ordering?: string;
      payWith?: string;
      student?: string | number;
      startDate?: string;
      endDate?: string;
    } | void>({
      query: (params = {}) => ({
        url: '/student/transactions/',
        params: params ?? {},
      }),
      providesTags: ['Transaction'],
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseTransaction);
      },
    }),
  }),
});

export const {
  useGetTransactionsQuery,
} = transactionApi;
