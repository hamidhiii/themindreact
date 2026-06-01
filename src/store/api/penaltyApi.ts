import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import { ApiPaths } from '../../api/apiPaths';
import { dataWithFallbacks, extractMapList } from '../../api/apiResponse';
import type {
  PenaltyTypeModel,
  PenaltyModel,
  PenaltyHistoryResponse,
  PenaltyTeacherChoice,
  PenaltyHistoryTeacherRow,
  PenaltyDayEntry,
} from '../../types';

function parsePenaltyType(j: Record<string, unknown>): PenaltyTypeModel {
  return {
    id: String(j['id'] ?? ''),
    name: (j['name'] ?? '') as string,
    defaultAmount: String(j['default_amount'] ?? '0'),
    isActive: (j['is_active'] ?? true) as boolean,
  };
}

function parsePenalty(j: Record<string, unknown>): PenaltyModel {
  return {
    id: String(j['id'] ?? ''),
    teacher: String(j['teacher'] ?? ''),
    teacherName: j['teacher_name'] as string | undefined,
    penaltyType: String(j['penalty_type'] ?? ''),
    penaltyTypeName: j['penalty_type_name'] as string | undefined,
    amount: String(j['amount'] ?? '0'),
    penaltyDate: (j['penalty_date'] ?? '') as string,
    note: j['note'] as string | undefined,
  };
}

function parsePenaltyDayEntry(j: Record<string, unknown>): PenaltyDayEntry {
  return {
    id: String(j['id'] ?? ''),
    amount: String(j['amount'] ?? '0'),
    penaltyTypeName: j['penalty_type_name'] as string | undefined,
    note: j['note'] as string | undefined,
  };
}

function parsePenaltyHistoryTeacherRow(j: Record<string, unknown>): PenaltyHistoryTeacherRow {
  const rawPenalties = (j['penalties'] ?? j['days'] ?? {}) as Record<string, unknown>;
  const penalties: Record<string, PenaltyDayEntry[]> = {};

  for (const [key, val] of Object.entries(rawPenalties)) {
    if (Array.isArray(val)) {
      penalties[key] = (val as Record<string, unknown>[]).map(parsePenaltyDayEntry);
    } else if (val && typeof val === 'object') {
      penalties[key] = [parsePenaltyDayEntry(val as Record<string, unknown>)];
    }
  }

  return {
    id: String(j['id'] ?? j['teacher_id'] ?? ''),
    name: (j['name'] ?? j['teacher_name'] ?? j['full_name'] ?? '') as string,
    role: (j['role'] ?? '') as string,
    penalties,
  };
}

function parsePenaltyHistory(raw: unknown): PenaltyHistoryResponse {
  const j = raw as Record<string, unknown>;

  if (Array.isArray(j)) {
    const rows = (j as Record<string, unknown>[]).map(parsePenaltyHistoryTeacherRow);
    return { teachers: rows, totalTeachers: rows.length };
  }

  const teachers = Array.isArray(j['teachers'])
    ? (j['teachers'] as Record<string, unknown>[]).map(parsePenaltyHistoryTeacherRow)
    : Array.isArray(j['results'])
      ? (j['results'] as Record<string, unknown>[]).map(parsePenaltyHistoryTeacherRow)
      : [];

  return {
    teachers,
    totalTeachers: Number(j['count'] ?? j['total_teachers'] ?? teachers.length),
  };
}

function parsePenaltyTeacherChoice(j: Record<string, unknown>): PenaltyTeacherChoice {
  return {
    id: String(j['id'] ?? ''),
    name: (j['name'] ?? j['full_name'] ?? '') as string,
    role: (j['role'] ?? '') as string,
  };
}

export const penaltyApi = createApi({
  reducerPath: 'penaltyApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['PenaltyType', 'Penalty', 'PenaltyHistory'],
  endpoints: (builder) => ({
    getPenaltyTypes: builder.query<PenaltyTypeModel[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.penaltyTypes },
            { url: '/penalty/penalty-types/' },
          ],
          (raw) => extractMapList(raw).map(parsePenaltyType)
        ),
      providesTags: ['PenaltyType'],
    }),
    getPenaltyTypeById: builder.query<PenaltyTypeModel, string>({
      query: (id) => ({ url: ApiPaths.penaltyType(id) }),
      providesTags: ['PenaltyType'],
      transformResponse: (raw) => parsePenaltyType(raw as Record<string, unknown>),
    }),
    createPenaltyType: builder.mutation<PenaltyTypeModel, { name: string; defaultAmount: string; isActive?: boolean }>({
      query: (data) => ({
        url: ApiPaths.penaltyTypes,
        method: 'POST',
        data: { name: data.name, default_amount: data.defaultAmount, is_active: data.isActive ?? true },
      }),
      invalidatesTags: ['PenaltyType'],
      transformResponse: (raw) => parsePenaltyType(raw as Record<string, unknown>),
    }),
    updatePenaltyType: builder.mutation<PenaltyTypeModel, { id: string; name: string; defaultAmount: string; isActive?: boolean }>({
      query: (data) => ({
        url: ApiPaths.penaltyType(data.id),
        method: 'PATCH',
        data: { name: data.name, default_amount: data.defaultAmount, is_active: data.isActive ?? true },
      }),
      invalidatesTags: ['PenaltyType'],
      transformResponse: (raw) => parsePenaltyType(raw as Record<string, unknown>),
    }),
    deletePenaltyType: builder.mutation<void, string>({
      query: (id) => ({ url: ApiPaths.penaltyType(id), method: 'DELETE' }),
      invalidatesTags: ['PenaltyType'],
    }),

    getPenalties: builder.query<PenaltyModel[], { month?: string; teacher?: string } | void>({
      query: (params) => {
        const p = params as { month?: string; teacher?: string } | undefined;
        const query: Record<string, string> = {};
        if (p?.month) query['month'] = p.month;
        if (p?.teacher) query['teacher'] = p.teacher;
        return { url: ApiPaths.penaltyCalendar, params: query };
      },
      providesTags: ['Penalty'],
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parsePenalty);
      },
    }),
    createPenalty: builder.mutation<PenaltyModel, {
      teacher: string;
      penaltyType: string;
      amount: string;
      penaltyDate: string;
      note?: string;
    }>({
      query: (data) => ({
        url: ApiPaths.penalty,
        method: 'POST',
        data: {
          user_ids: [data.teacher],
          penalty_type: data.penaltyType,
          amount: data.amount,
          penalty_date: data.penaltyDate,
          note: data.note,
        },
      }),
      invalidatesTags: ['Penalty', 'PenaltyHistory'],
      transformResponse: (raw) => parsePenalty(raw as Record<string, unknown>),
    }),
    updatePenalty: builder.mutation<PenaltyModel, {
      id: string;
      teacher?: string;
      penaltyType?: string;
      amount?: string;
      penaltyDate?: string;
      note?: string;
    }>({
      query: ({ id, penaltyType, penaltyDate, ...rest }) => ({
        url: ApiPaths.penaltyId(id),
        method: 'PATCH',
        data: {
          ...rest,
          ...(penaltyType ? { penalty_type: penaltyType } : {}),
          ...(penaltyDate ? { penalty_date: penaltyDate } : {}),
        },
      }),
      invalidatesTags: ['Penalty', 'PenaltyHistory'],
      transformResponse: (raw) => parsePenalty(raw as Record<string, unknown>),
    }),
    deletePenalty: builder.mutation<void, string>({
      query: (id) => ({ url: ApiPaths.penaltyId(id), method: 'DELETE' }),
      invalidatesTags: ['Penalty', 'PenaltyHistory'],
    }),
    bulkCreatePenalty: builder.mutation<void, {
      penaltyType: string;
      penaltyDate: string;
      amount: string;
      note?: string;
      teacherIds: string[];
    }>({
      query: (data) => ({
        url: ApiPaths.penalty,
        method: 'POST',
        data: {
          penalty_type: data.penaltyType,
          penalty_date: data.penaltyDate,
          amount: data.amount,
          note: data.note,
          user_ids: data.teacherIds,
        },
      }),
      invalidatesTags: ['Penalty', 'PenaltyHistory'],
    }),

    getPenaltyHistory: builder.query<PenaltyHistoryResponse, { month?: string; teacher?: string; penaltyType?: string } | void>({
      query: (params) => {
        const p = params as { month?: string; teacher?: string; penaltyType?: string } | undefined;
        const query: Record<string, string> = {};
        if (p?.month) query['month'] = p.month;
        if (p?.teacher) query['teacher'] = p.teacher;
        if (p?.penaltyType) query['penalty_type'] = p.penaltyType;
        return { url: ApiPaths.penaltyCalendar, params: query };
      },
      providesTags: ['PenaltyHistory'],
      transformResponse: (raw) => parsePenaltyHistory(raw),
    }),

    getPenaltyTeacherChoices: builder.query<PenaltyTeacherChoice[], void>({
      query: () => ({ url: ApiPaths.workerChoices }),
      transformResponse: (raw) => {
        return extractMapList(raw).map(parsePenaltyTeacherChoice);
      },
    }),
  }),
});

export const {
  useGetPenaltyTypesQuery,
  useGetPenaltyTypeByIdQuery,
  useCreatePenaltyTypeMutation,
  useUpdatePenaltyTypeMutation,
  useDeletePenaltyTypeMutation,
  useGetPenaltiesQuery,
  useCreatePenaltyMutation,
  useUpdatePenaltyMutation,
  useDeletePenaltyMutation,
  useBulkCreatePenaltyMutation,
  useGetPenaltyHistoryQuery,
  useGetPenaltyTeacherChoicesQuery,
} = penaltyApi;
