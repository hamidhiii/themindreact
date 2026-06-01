import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import { ApiPaths } from '../../api/apiPaths';
import { dataWithFallbacks, extractMapList, isRecord, unwrapDataMap, unwrapEntity } from '../../api/apiResponse';
import type {
  LidModel,
  LeadChoicesModel,
  LeadChoiceItem,
  LeadGroupItem,
  LeadBookItem,
  LeadPipelineSummary,
} from '../../types';

const PIPELINE_STAGES = ['lead', 'waiting', 'call', 'archive'] as const;
type PipelineStage = (typeof PIPELINE_STAGES)[number];

const STATUS_ALIASES: Record<string, string> = {
  new: 'lead',
  leads: 'lead',
  calling: 'call',
  calls: 'call',
  archived: 'archive',
  archive: 'archive',
  pending: 'waiting',
  scheduled: 'waiting',
  in_waiting: 'waiting',
  on_hold: 'waiting',
  trial_lesson: 'waiting',
  trial: 'waiting',
};

function asInt(v: unknown): number {
  if (typeof v === 'number') return Math.trunc(v);
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : Math.trunc(n);
  }
  return 0;
}

function normalizeStatus(raw: string, fallbackStage?: string): string {
  const s = raw.trim().toLowerCase();
  if (!s && fallbackStage) return fallbackStage;
  return STATUS_ALIASES[s] ?? s;
}

function parseLid(j: Record<string, unknown>, stage?: string): LidModel {
  const statusRaw = String(j['status'] ?? j['stage'] ?? j['pipeline_stage'] ?? stage ?? '');
  const isArchived = Boolean(j['is_archived'] ?? j['isArchived'] ?? j['archived']);
  const normalized = isArchived ? 'archive' : normalizeStatus(statusRaw, stage);

  const rawId = j['id'];
  return {
    id: rawId != null && rawId !== '' ? asInt(rawId) : undefined,
    firstName: String(j['first_name'] ?? j['full_name'] ?? j['name'] ?? ''),
    phone: j['phone'] as string | undefined,
    status: normalized,
    statusDisplay: j['status_display'] as string | undefined,
    source: j['source'] as string | undefined,
    comment: j['comment'] as string | undefined,
    date: (j['date'] ?? j['scheduled_date']) as string | undefined,
    branch: asInt(j['branch'] ?? j['branch_id']) || undefined,
    destination: j['destination'] as string | undefined,
    gender: j['gender'] as string | undefined,
    course: j['course'] as number | undefined,
    giveBook: (j['give_book'] ?? false) as boolean,
    callCount: asInt(j['call_count'] ?? j['calls_count'] ?? j['callCount']),
    isArchived,
    telegramUsername: j['telegram_username'] as string | undefined,
    scheduledDate: j['scheduled_date'] as string | undefined,
    scheduledTime: j['scheduled_time'] as string | undefined,
    goal: j['goal'] as string | undefined,
    preferredDays: formatPreferredDays(j['preferred_days']),
    preferredTimeSlot: String(j['preferred_time'] ?? j['preferred_time_slot'] ?? '').trim() || undefined,
    createdAt: String(j['created_at'] ?? j['created'] ?? '').trim() || undefined,
  };
}

function formatPreferredDays(raw: unknown): string | undefined {
  if (raw == null || raw === '') return undefined;
  if (Array.isArray(raw)) {
    const parts = raw.map((v) => String(v).trim()).filter(Boolean);
    return parts.length ? parts.join(', ') : undefined;
  }
  const s = String(raw).trim();
  if (!s || s === '[]') return undefined;
  return s.replace(/_/g, '-');
}

function extractBucketItems(bucket: unknown): Record<string, unknown>[] {
  if (Array.isArray(bucket)) return bucket.filter(isRecord);
  if (!isRecord(bucket)) return [];
  return extractMapList(bucket);
}

function mergeLeads(into: Map<number, LidModel>, batch: LidModel[], withoutId: LidModel[]) {
  for (const lead of batch) {
    if (lead.id == null) {
      withoutId.push(lead);
      continue;
    }
    into.set(lead.id, lead);
  }
}

function extractPipelineLeads(raw: unknown): LidModel[] {
  const map = unwrapDataMap(raw);
  const byId = new Map<number, LidModel>();
  const withoutId: LidModel[] = [];

  const stageKeys: Array<{ stage: PipelineStage; keys: string[] }> = [
    { stage: 'lead', keys: ['lead', 'leads', 'new', 'lead_list'] },
    { stage: 'waiting', keys: ['waiting', 'waiting_list', 'waitings'] },
    { stage: 'call', keys: ['call', 'calling', 'calls', 'call_list'] },
    { stage: 'archive', keys: ['archive', 'archived', 'archive_list'] },
  ];

  const scanContainer = (container: Record<string, unknown>) => {
    for (const { stage, keys } of stageKeys) {
      for (const key of keys) {
        const bucket = container[key];
        if (bucket == null) continue;
        const items = extractBucketItems(bucket);
        for (const item of items) {
          mergeLeads(byId, [parseLid(item, stage)], withoutId);
        }
      }
    }

    const pipeline = container['pipeline'];
    if (Array.isArray(pipeline)) {
      for (const entry of pipeline) {
        if (!isRecord(entry)) continue;
        const stageRaw = String(entry['stage'] ?? entry['status'] ?? entry['key'] ?? '').toLowerCase();
        const stage = normalizeStatus(stageRaw) as PipelineStage;
        const items = extractBucketItems(entry['leads'] ?? entry['items'] ?? entry['results'] ?? entry);
        const fallback = PIPELINE_STAGES.includes(stage as PipelineStage) ? stage : undefined;
        for (const item of items) {
          mergeLeads(byId, [parseLid(item, fallback)], withoutId);
        }
      }
    }
  };

  scanContainer(map);
  if (isRecord(map['columns'])) scanContainer(map['columns'] as Record<string, unknown>);
  if (isRecord(map['stages'])) scanContainer(map['stages'] as Record<string, unknown>);

  mergeLeads(byId, extractMapList(raw).map((item) => parseLid(item)), withoutId);
  mergeLeads(byId, [...extractLeadsDeep(raw).values()], withoutId);

  return [...byId.values(), ...withoutId];
}

/** Collect any lead-shaped objects nested in the API JSON. */
function extractLeadsDeep(raw: unknown, into = new Map<number, LidModel>()): Map<number, LidModel> {
  if (Array.isArray(raw)) {
    for (const item of raw) extractLeadsDeep(item, into);
    return into;
  }
  if (!isRecord(raw)) return into;

  const hasId = raw['id'] != null;
  const hasIdentity = Boolean(
    raw['first_name'] ?? raw['name'] ?? raw['phone'] ?? raw['full_name']
  );
  if (hasId && hasIdentity) {
    const lead = parseLid(raw);
    if (lead.id != null) into.set(lead.id, lead);
  }

  for (const value of Object.values(raw)) {
    if (value !== raw) extractLeadsDeep(value, into);
  }
  return into;
}

type LeadListParams = {
  status?: string;
  source?: string;
  search?: string;
  callFilter?: string;
  branchId?: string;
};

type BaseQueryFn = (
  arg: { url: string; params?: Record<string, unknown> }
) => Promise<{ data?: unknown; error?: { status?: number } }>;

function buildLeadQueryParams(params: LeadListParams = {}): Record<string, unknown> {
  const queryParams: Record<string, unknown> = {};
  if (params.status) queryParams['status'] = params.status;
  if (params.source) queryParams['source'] = params.source;
  if (params.search) queryParams['search'] = params.search;
  if (params.callFilter && params.callFilter !== 'all') {
    if (params.callFilter === 'none') queryParams['call_count'] = 0;
    else queryParams['call_count'] = Number(params.callFilter);
  }
  return queryParams;
}

async function loadAllLeads(
  baseQuery: BaseQueryFn,
  params: LeadListParams = {}
): Promise<LidModel[]> {
  const queryParams = buildLeadQueryParams(params);
  const hasClientFilters = Boolean(params.search || (params.callFilter && params.callFilter !== 'all'));
  const byId = new Map<number, LidModel>();
  const withoutId: LidModel[] = [];

  const mergeBatch = (batch: LidModel[]) => mergeLeads(byId, batch, withoutId);

  const tryFetch = async (url: string, extraParams?: Record<string, unknown>) => {
    try {
      const byIdPage = new Map<number, LidModel>();
      const withoutIdPage: LidModel[] = [];
      for (let page = 1; page <= 30; page += 1) {
        const result = await baseQuery({
          url,
          params: { ...queryParams, ...extraParams, page },
        });
        if ('error' in result && result.error) {
          if (page === 1) throw result.error;
          break;
        }
        const batch = extractPipelineLeads(result.data);
        if (batch.length === 0) break;
        mergeLeads(byIdPage, batch, withoutIdPage);
        const map = unwrapDataMap(result.data);
        if (!map['next'] && batch.length < 50) break;
      }
      mergeBatch([...byIdPage.values(), ...withoutIdPage]);
    } catch {
      /* try next source */
    }
  };

  // UI pipeline (Flutter) — primary source; new leads appear here first
  await tryFetch('/student/ui/leads/');
  await tryFetch(ApiPaths.lead);

  if (!hasClientFilters && !params.status) {
    await Promise.all([
      tryFetch(ApiPaths.lead, { status: 'waiting' }),
      tryFetch(ApiPaths.lead, { status: 'call' }),
      tryFetch(ApiPaths.lead, { status: 'archive' }),
      tryFetch(ApiPaths.lead, { status: 'lead' }),
      tryFetch('/student/ui/leads/', { status: 'waiting' }),
    ]);
  }

  if (byId.size === 0 && withoutId.length === 0) {
    const fallback = await baseQuery({ url: '/student/leads/', params: queryParams });
    if ('error' in fallback && fallback.error) {
      throw fallback.error;
    }
    mergeBatch(extractPipelineLeads(fallback.data));
  }

  if (byId.size > 0 || withoutId.length > 0) {
    return [...byId.values(), ...withoutId];
  }

  throw { status: 404, data: {} };
}

function pickNum(map: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const v = map[key];
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return 0;
}

function parseLeadSummary(raw: unknown): LeadPipelineSummary {
  const map = unwrapDataMap(raw);
  const counts = isRecord(map['counts']) ? (map['counts'] as Record<string, unknown>) : map;
  const cards = isRecord(map['cards']) ? (map['cards'] as Record<string, unknown>) : null;

  const read = (source: Record<string, unknown>): LeadPipelineSummary => ({
    leads: pickNum(source, ['leads', 'lead', 'lead_count', 'total_leads', 'new']),
    waiting: pickNum(source, ['waiting', 'waiting_count']),
    calling: pickNum(source, ['calling', 'call', 'call_count', 'calls']),
    archived: pickNum(source, ['archived', 'archive', 'archive_count']),
  });

  if (cards) return read(cards);
  return read(counts);
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

const DEFAULT_CHOICES: LeadChoicesModel = {
  groupRequiredStatuses: ['came'],
  statuses: [
    { value: 'lead', label: 'Lead' },
    { value: 'waiting', label: 'Waiting' },
    { value: 'call', label: 'Call' },
    { value: 'archive', label: 'Archive' },
  ],
  sources: [
    { value: 'telegram', label: 'Telegram' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'walk_in', label: 'Walk in' },
    { value: 'reference', label: 'Reference' },
  ],
  genders: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ],
  groups: [],
  books: [],
};

function buildLeadCreateBody(data: Parameters<typeof lidToBody>[0]): Record<string, unknown> {
  return {
    ...lidToBody(data),
    name: data.firstName,
    first_name: data.firstName,
    full_name: data.firstName,
  };
}

function parseCreatedLead(raw: unknown, fallback: Parameters<typeof lidToBody>[0]): LidModel {
  const entity = unwrapEntity(raw, ['lead', 'item', 'result', 'data']);
  const parsed = parseLid(entity);
  if (parsed.id == null) {
    const map = unwrapDataMap(raw);
    const id = map['id'] ?? entity['id'];
    if (id != null) parsed.id = asInt(id);
  }
  if (!parsed.firstName?.trim()) parsed.firstName = fallback.firstName ?? '';
  if (!parsed.phone && fallback.phone) parsed.phone = fallback.phone;
  if (!parsed.status && fallback.status) parsed.status = normalizeStatus(fallback.status);
  if (fallback.scheduledDate) parsed.scheduledDate = parsed.scheduledDate ?? fallback.scheduledDate;
  if (fallback.scheduledTime) parsed.scheduledTime = parsed.scheduledTime ?? fallback.scheduledTime;
  if (fallback.preferredDays) parsed.preferredDays = parsed.preferredDays ?? formatPreferredDays(fallback.preferredDays);
  if (fallback.telegramUsername) {
    parsed.telegramUsername = parsed.telegramUsername ?? fallback.telegramUsername;
  }
  return parsed;
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
  goal?: string;
  preferredDays?: string;
  preferredTime?: string;
  telegramUsername?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  preferredBranchId?: number | string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.firstName !== undefined) {
    body['first_name'] = data.firstName;
    body['full_name'] = data.firstName;
    body['name'] = data.firstName;
  }
  if (data.phone !== undefined) body['phone'] = data.phone;
  if (data.status !== undefined) body['status'] = data.status;
  if (data.source !== undefined) body['source'] = data.source;
  if (data.comment !== undefined) body['comment'] = data.comment;
  if (data.date !== undefined) body['date'] = data.date;
  if (data.branch !== undefined) {
    body['branch'] = data.branch;
    body['branch_id'] = data.branch;
  }
  if (data.destination !== undefined) body['destination'] = data.destination;
  if (data.gender !== undefined) body['gender'] = data.gender;
  if (data.course !== undefined) body['course'] = data.course;
  if (data.giveBook !== undefined) body['give_book'] = data.giveBook;
  if (data.goal !== undefined) body['goal'] = data.goal;
  if (data.preferredDays !== undefined) body['preferred_days'] = data.preferredDays;
  if (data.preferredTime !== undefined) body['preferred_time'] = data.preferredTime;
  if (data.telegramUsername !== undefined) body['telegram_username'] = data.telegramUsername;
  if (data.scheduledDate !== undefined) body['scheduled_date'] = data.scheduledDate;
  if (data.scheduledTime !== undefined) body['scheduled_time'] = data.scheduledTime;
  if (data.preferredBranchId !== undefined) body['preferred_branch_id'] = data.preferredBranchId;
  return body;
}

type LeadQueryError = { status: number | undefined; data: {} };

function toLeadQueryError(error: unknown): { error: LeadQueryError } {
  return { error: error as LeadQueryError };
}

export const leadApi = createApi({
  reducerPath: 'leadApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Lead', 'LeadCalls', 'LeadStats'],
  endpoints: (builder) => ({
    getLeads: builder.query<LidModel[], LeadListParams | void>({
      async queryFn(params = {}, _api, _extra, baseQuery) {
        try {
          const data = await loadAllLeads(baseQuery as BaseQueryFn, params ?? {});
          return { data };
        } catch (error) {
          return toLeadQueryError(error);
        }
      },
      providesTags: ['Lead'],
    }),

    getLeadChoices: builder.query<LeadChoicesModel, void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const legacy = await baseQuery({ url: '/student/ui/leads/choices/' });
        if (!('error' in legacy) && legacy.data) {
          return { data: parseLeadChoices(legacy.data as Record<string, unknown>) };
        }

        const groupsResult = await baseQuery({ url: ApiPaths.leadGroups });
        const groups = 'data' in groupsResult ? extractMapList(groupsResult.data) : [];
        const parsedGroups: LeadGroupItem[] = groups.map((g) => ({
          id: Number(g['id'] ?? 0),
          name: String(g['name'] ?? ''),
        }));

        return {
          data: {
            ...DEFAULT_CHOICES,
            groups: parsedGroups.length ? parsedGroups : DEFAULT_CHOICES.groups,
          },
        };
      },
    }),

    getLeadPipelineStats: builder.query<LeadPipelineSummary, { branchId?: string } | void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.leadSummary },
            { url: '/student/ui/leads/pipeline-stats/' },
          ],
          parseLeadSummary
        ),
      providesTags: ['LeadStats'],
    }),

    getLeadGroups: builder.query<LeadGroupItem[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [{ url: ApiPaths.leadGroups }],
          (raw) =>
            extractMapList(raw).map((g) => ({
              id: Number(g['id'] ?? 0),
              name: String(g['name'] ?? ''),
            }))
        ),
      providesTags: ['Lead'],
    }),

    checkLeadExamConflict: builder.query<Record<string, unknown>, { group?: number; date?: string; time?: string }>({
      query: (params) => ({ url: '/student/ui/leads/check-exam-conflict/', params }),
    }),

    getLeadEdit: builder.query<LidModel, number>({
      queryFn: (id, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.leadId(id) },
            { url: `/student/ui/leads/${id}/edit/` },
          ],
          (raw) => parseLid(raw as Record<string, unknown>)
        ),
      providesTags: ['Lead'],
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
      goal?: string;
      preferredDays?: string;
      preferredTime?: string;
      telegramUsername?: string;
      scheduledDate?: string;
      scheduledTime?: string;
      preferredBranchId?: number | string;
    }>({
      queryFn: (data, _api, _extra, baseQuery) => {
        const body = buildLeadCreateBody(data);
        return dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.lead, method: 'POST', data: body },
            { url: '/student/ui/leads/create/', method: 'POST', data: body },
            { url: '/student/ui/leads/', method: 'POST', data: body },
          ],
          (raw) => parseCreatedLead(raw, data)
        );
      },
      invalidatesTags: ['Lead', 'LeadStats'],
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
      goal?: string;
      preferredDays?: string;
      preferredTime?: string;
      telegramUsername?: string;
      scheduledDate?: string;
      scheduledTime?: string;
      preferredBranchId?: number | string;
    }>({
      queryFn: ({ id, ...rest }, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.leadId(id), method: 'PATCH', data: lidToBody(rest) },
            { url: `/student/ui/leads/${id}/edit/`, method: 'PATCH', data: lidToBody(rest) },
          ],
          (raw) => parseLid(raw as Record<string, unknown>)
        ),
      invalidatesTags: ['Lead', 'LeadStats'],
    }),

    updateLeadStatus: builder.mutation<void, { id: number; status: string }>({
      queryFn: ({ id, status }, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.leadId(id), method: 'PATCH', data: { status } },
            { url: `/student/leads/${id}/`, method: 'PATCH', data: { status } },
          ],
          () => undefined
        ),
      invalidatesTags: ['Lead', 'LeadStats'],
    }),

    deleteLead: builder.mutation<void, number>({
      queryFn: (id, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.leadId(id), method: 'DELETE' },
            { url: `/student/leads/${id}/`, method: 'DELETE' },
          ],
          () => undefined
        ),
      invalidatesTags: ['Lead', 'LeadStats'],
    }),

    getLeadCalls: builder.query<Record<string, unknown>[], number>({
      queryFn: (id, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.leadCall(id) },
            { url: `/student/ui/leads/${id}/calls/` },
          ],
          extractMapList
        ),
      providesTags: ['LeadCalls'],
    }),

    addLeadCall: builder.mutation<Record<string, unknown>, { id: number; note: string }>({
      queryFn: ({ id, note }, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.leadCall(id), method: 'POST', data: { note } },
            { url: `/student/ui/leads/${id}/calls/`, method: 'POST', data: { note } },
          ],
          (raw) => raw as Record<string, unknown>
        ),
      invalidatesTags: ['LeadCalls', 'Lead', 'LeadStats'],
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
      queryFn: ({ id, preferredBranchId, scheduledDate, scheduledTime, ...rest }, _api, _extra, baseQuery) => {
        const moveBody = {
          preferred_branch_id: preferredBranchId,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          goal: rest.goal,
          preferred_days: rest.preferredDays,
          preferred_time: rest.preferredTime,
          comment: rest.comment,
          first_name: rest.firstName,
          telegram_username: rest.telegramUsername,
        };
        return dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.leadMove(id), method: 'POST', data: moveBody },
            { url: `/student/ui/leads/${id}/move-to-waiting/`, method: 'POST', data: moveBody },
          ],
          (raw) => (raw ? parseLid(raw as Record<string, unknown>) : null)
        );
      },
      invalidatesTags: ['Lead', 'LeadStats'],
    }),

    setLeadAttendance: builder.mutation<LidModel | null, {
      id: number;
      attendance: string;
      paid?: boolean;
      groupId?: number;
      tariffId?: number;
      amount?: number;
      paymentMethod?: string;
      bookId?: number | null;
    }>({
      queryFn: ({ id, attendance, paid, groupId, tariffId, amount, paymentMethod, bookId }, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            {
              url: ApiPaths.leadAttendedPayment(id),
              method: 'POST',
              data: {
                paid: paid ?? false,
                group_id: groupId,
                tariff_id: tariffId,
                amount,
                payment_method: paymentMethod,
                book_id: bookId ?? null,
              },
            },
          ],
          (raw) => (raw ? parseLid(raw as Record<string, unknown>) : null)
        ),
      invalidatesTags: ['Lead', 'LeadStats'],
    }),

    archiveLead: builder.mutation<LidModel | null, { id: number; archiveReason: string }>({
      queryFn: ({ id, archiveReason }, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.leadId(id), method: 'PATCH', data: { is_archived: true, archive_reason: archiveReason, status: 'archive' } },
            { url: `/student/ui/leads/${id}/archive/`, method: 'POST', data: { archive_reason: archiveReason } },
          ],
          (raw) => (raw ? parseLid(raw as Record<string, unknown>) : null)
        ),
      invalidatesTags: ['Lead', 'LeadStats'],
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadChoicesQuery,
  useGetLeadPipelineStatsQuery,
  useGetLeadGroupsQuery,
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
