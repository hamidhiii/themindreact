import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import { ApiPaths } from '../../api/apiPaths';
import { buildPaymentPayload } from '../../api/paymentPayload';
import { dataWithFallbacks, extractMapList } from '../../api/apiResponse';
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
      queryFn: (params = {}, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.transactions, params: params ?? {} },
            { url: '/student/transactions/', params: params ?? {} },
          ],
          (raw) => extractMapList(raw).map(parseTransaction)
        ),
      providesTags: ['Transaction'],
    }),
    createPayment: builder.mutation<void, {
      studentId: string | number;
      amount: string;
      payWith: string;
      groupId?: string | number;
      date?: string;
    }>({
      queryFn: (data, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            {
              url: ApiPaths.transactionsPayment,
              method: 'POST',
              data: buildPaymentPayload(data),
            },
          ],
          () => undefined
        ),
      invalidatesTags: ['Transaction'],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useCreatePaymentMutation,
} = transactionApi;
