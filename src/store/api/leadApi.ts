import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import type { LidModel, LeadChoicesModel, LeadChoiceItem, LeadGroupItem, LeadBookItem } from '../../types';

function parseLid(j: Record<string, unknown>): LidModel {
  return {
    id: j['id'] as number | undefined,
    firstName: String(j['first_name'] ?? j['full_name'] ?? j['name'] ?? ''),
    phone: j['phone'] as string | undefined,
    status: (j['status'] ?? '') as string,
    statusDisplay: j['status_display'] as string | undefined,
    source: j['source'] as string | undefined,
    comment: j['comment'] as string | undefined,
    date: j['date'] as string | undefined,
    branch: j['branch'] as number | undefined,
    destination: j['destination'] as string | undefined,
    gender: j['gender'] as string | undefined,
    course: j['course'] as number | undefined,
    giveBook: (j['give_book'] ?? false) as boolean,
  };
}

function extractList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data?.['results'] as Record<string, unknown>[]) ?? [];
}

type LeadQueryError = { status: number | undefined; data: {} };

function toLeadQueryError(error: unknown): { error: LeadQueryError } {
  return { error: error as LeadQueryError };
}

function parseLeadChoices(j: Record<string, unknown>): LeadChoicesModel {
  const groupRequired = Array.isArray(j['group_required_statuses'])
    ? (j['group_required_statuses'] as string[])
    : [];
  function parseChoiceItems(key: string): LeadChoiceItem[] {
    const raw = j[key];
    if (!Array.isArray(raw)) return [];
    return (raw as Record<string, unknown>[]).map((e) => ({
      value: String(e['value'] ?? ''),
      label: String(e['label'] ?? ''),
    }));
  }
  function parseGroupItems(): LeadGroupItem[] {
    const raw = j['groups'];
    if (!Array.isArray(raw)) return [];
    return (raw as Record<string, unknown>[]).map((e) => ({
      id: Number(e['id'] ?? 0),
      name: String(e['name'] ?? ''),
    }));
  }
  function parseBookItems(): LeadBookItem[] {
    const raw = j['books'];
    if (!Array.isArray(raw)) return [];
    return (raw as Record<string, unknown>[]).map((e) => ({
      id: Number(e['id'] ?? 0),
      name: String(e['name'] ?? ''),
      stock: Number(e['stock'] ?? 0),
    }));
  }
  return {
    groupRequiredStatuses: groupRequired,
    statuses: parseChoiceItems('statuses'),
    sources: parseChoiceItems('sources'),
    genders: parseChoiceItems('genders'),
    groups: parseGroupItems(),
    books: parseBookItems(),
  };
}

function lidToBody(data: {
  firstName?: string;
  phone?: string;
  status?: string;
  source?: string;
  comment?: string;
  date?: string;
  branch?: number;
  destination?: string;
  gender?: string;
  course?: number;
  giveBook?: boolean;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.firstName !== undefined) body['first_name'] = data.firstName;
  if (data.phone !== undefined) body['phone'] = data.phone;
  if (data.status !== undefined) body['status'] = data.status;
  if (data.source !== undefined) body['source'] = data.source;
  if (data.comment !== undefined) body['comment'] = data.comment;
  if (data.date !== undefined) body['date'] = data.date;
  if (data.branch !== undefined) body['branch'] = data.branch;
  if (data.destination !== undefined) body['destination'] = data.destination;
  if (data.gender !== undefined) body['gender'] = data.gender;
  if (data.course !== undefined) body['course'] = data.course;
  if (data.giveBook !== undefined) body['give_book'] = data.giveBook;
  return body;
}

export const leadApi = createApi({
  reducerPath: 'leadApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Lead', 'LeadCalls', 'LeadStats'],
  endpoints: (builder) => ({
    getLeads: builder.query<LidModel[], { status?: string; source?: string; search?: string } | void>({
      async queryFn(params = {}, _api, _extra, baseQuery) {
        const requested = params ?? {};
        const hasExplicitParams = Object.keys(requested).length > 0;
        const loadUi = async (query: Record<string, unknown>) =>
          baseQuery({ url: '/student/ui/leads/', params: query });
        const loadLegacy = async () => baseQuery({ url: '/student/leads/' });

        if (hasExplicitParams) {
          const result = await loadUi(requested as Record<string, unknown>);
          const status = 'error' in result ? (result.error as { status?: number }).status : undefined;
          if ('error' in result && status !== 404 && status !== 405) return toLeadQueryError(result.error);
          if ('data' in result) return { data: extractList(result.data).map(parseLid) };
          const fallback = await loadLegacy();
          if ('error' in fallback) return toLeadQueryError(fallback.error);
          return { data: extractList(fallback.data).map(parseLid) };
        }

        const columns = await Promise.all([
          loadUi({ status: 'lead' }),
          loadUi({ status: 'waiting' }),
          loadUi({ status: 'call' }),
          loadUi({ is_archived: 1 }),
        ]);
        const hasUiError = columns.some((result) => 'error' in result);
        if (hasUiError) {
          const fallback = await loadLegacy();
          if ('error' in fallback) return toLeadQueryError(fallback.error);
          return { data: extractList(fallback.data).map(parseLid) };
        }

        const byId = new Map<number, LidModel>();
        const withoutId: LidModel[] = [];
        for (const result of columns) {
          const list = extractList(result.data).map(parseLid);
          for (const lead of list) {
            if (lead.id == null) withoutId.push(lead);
            else byId.set(lead.id, lead);
          }
        }
        return { data: [...byId.values(), ...withoutId] };
      },
      providesTags: ['Lead'],
    }),
    getLeadChoices: builder.query<LeadChoicesModel, void>({
      query: () => ({ url: '/student/ui/leads/choices/' }),
      transformResponse: (raw) => parseLeadChoices(raw as Record<string, unknown>),
    }),
    getLeadPipelineStats: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: '/student/ui/leads/pipeline-stats/' }),
      providesTags: ['LeadStats'],
    }),
    checkLeadExamConflict: builder.query<Record<string, unknown>, { group?: number; date?: string; time?: string }>({
      query: (params) => ({ url: '/student/ui/leads/check-exam-conflict/', params }),
    }),
    getLeadEdit: builder.query<LidModel, number>({
      query: (id) => ({ url: `/student/ui/leads/${id}/edit/` }),
      providesTags: ['Lead'],
      transformResponse: (raw) => parseLid(raw as Record<string, unknown>),
    }),
    createLead: builder.mutation<LidModel, {
      firstName: string;
      phone?: string;
      status?: string;
      source?: string;
      comment?: string;
      date?: string;
      branch?: number;
      destination?: string;
      gender?: string;
      course?: number;
      giveBook?: boolean;
    }>({
      query: (data) => ({
        url: '/student/leads/',
        method: 'POST',
        data: lidToBody(data),
      }),
      invalidatesTags: ['Lead'],
      transformResponse: (raw) => parseLid(raw as Record<string, unknown>),
    }),
    updateLead: builder.mutation<LidModel, {
      id: number;
      firstName?: string;
      phone?: string;
      status?: string;
      source?: string;
      comment?: string;
      date?: string;
      branch?: number;
      destination?: string;
      gender?: string;
      course?: number;
      giveBook?: boolean;
    }>({
      query: ({ id, ...rest }) => ({
        url: `/student/ui/leads/${id}/edit/`,
        method: 'PATCH',
        data: lidToBody(rest),
      }),
      invalidatesTags: ['Lead'],
      transformResponse: (raw) => parseLid(raw as Record<string, unknown>),
    }),
    updateLeadStatus: builder.mutation<void, { id: number; status: string }>({
      query: ({ id, status }) => ({
        url: `/student/leads/${id}/`,
        method: 'PATCH',
        data: { status },
      }),
      invalidatesTags: ['Lead'],
    }),
    deleteLead: builder.mutation<void, number>({
      query: (id) => ({ url: `/student/leads/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Lead'],
    }),
    getLeadCalls: builder.query<Record<string, unknown>[], number>({
      query: (id) => ({ url: `/student/ui/leads/${id}/calls/` }),
      providesTags: ['LeadCalls'],
      transformResponse: (raw) => extractList(raw),
    }),
    addLeadCall: builder.mutation<Record<string, unknown>, { id: number; note: string }>({
      query: ({ id, note }) => ({
        url: `/student/ui/leads/${id}/calls/`,
        method: 'POST',
        data: { note },
      }),
      invalidatesTags: ['LeadCalls', 'Lead'],
    }),
    moveLeadToWaiting: builder.mutation<LidModel | null, {
      id: number;
      preferredBranchId: string | number;
      scheduledDate: string;
      scheduledTime: string;
      goal?: string;
      preferredDays?: string;
      preferredTime?: string;
      comment?: string;
      firstName?: string;
      telegramUsername?: string;
    }>({
      query: ({ id, preferredBranchId, scheduledDate, scheduledTime, ...rest }) => ({
        url: `/student/ui/leads/${id}/move-to-waiting/`,
        method: 'POST',
        data: {
          preferred_branch_id: preferredBranchId,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          goal: rest.goal,
          preferred_days: rest.preferredDays,
          preferred_time: rest.preferredTime,
          comment: rest.comment,
          first_name: rest.firstName,
          telegram_username: rest.telegramUsername,
        },
      }),
      invalidatesTags: ['Lead', 'LeadStats'],
      transformResponse: (raw) => raw ? parseLid(raw as Record<string, unknown>) : null,
    }),
    setLeadAttendance: builder.mutation<LidModel | null, { id: number; attendance: string }>({
      query: ({ id, attendance }) => ({
        url: `/student/ui/leads/${id}/set-attendance/`,
        method: 'POST',
        data: { attendance },
      }),
      invalidatesTags: ['Lead', 'LeadStats'],
      transformResponse: (raw) => raw ? parseLid(raw as Record<string, unknown>) : null,
    }),
    archiveLead: builder.mutation<LidModel | null, { id: number; archiveReason: string }>({
      query: ({ id, archiveReason }) => ({
        url: `/student/ui/leads/${id}/archive/`,
        method: 'POST',
        data: { archive_reason: archiveReason },
      }),
      invalidatesTags: ['Lead', 'LeadStats'],
      transformResponse: (raw) => raw ? parseLid(raw as Record<string, unknown>) : null,
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadChoicesQuery,
  useGetLeadPipelineStatsQuery,
  useCheckLeadExamConflictQuery,
  useGetLeadEditQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useUpdateLeadStatusMutation,
  useDeleteLeadMutation,
  useGetLeadCallsQuery,
  useAddLeadCallMutation,
  useMoveLeadToWaitingMutation,
  useSetLeadAttendanceMutation,
  useArchiveLeadMutation,
} = leadApi;
