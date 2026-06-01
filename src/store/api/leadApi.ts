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
};

function asInt(v: unknown): number {
  if (typeof v === 'number') return Math.trunc(v);
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : Math.trunc(n);
  }
  return 0;
}

function validLeadId(id: unknown): number | undefined {
  const n = asInt(id);
  return n > 0 ? n : undefined;
}

type BqResult = { data?: unknown; error?: { status?: number; data?: unknown } };

function normalizeStatus(raw: string, fallbackStage?: string): string {
  const s = raw.trim().toLowerCase();
  if (!s && fallbackStage) return fallbackStage;
  return STATUS_ALIASES[s] ?? s;
}

function leadMoveTarget(status?: string): { stage: string; came?: boolean } {
  const raw = String(status ?? 'lead').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (['came', 'arrived', 'attended', 'present'].includes(raw)) {
    return { stage: 'waiting', came: true };
  }
  if (['not_came', 'notcame', 'did_not_come', 'absent', 'missed'].includes(raw)) {
    return { stage: 'waiting', came: false };
  }
  return { stage: normalizeStatus(raw || 'lead') };
}

const LIST_SOURCE_PRIORITY: Record<string, number> = {
  lead: 1,
  waiting: 2,
  call: 3,
  archive: 4,
};

function lidApiDateYmd(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const dm = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(t);
  if (dm) return `${dm[3]}-${dm[2]}-${dm[1]}`;
  const parsed = Date.parse(t);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return t;
}

function lidApiTimeHms(raw: string): string {
  const hm = lidApiTimeHm(raw);
  if (!hm) return hm;
  return /^\d{2}:\d{2}:\d{2}$/.test(hm) ? hm : `${hm}:00`;
}

function lidApiTimeHm(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return t;
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

function normalizeGoalForApi(goal?: string): string | undefined {
  const g = goal?.trim() ?? '';
  if (!g) return undefined;
  if (g === 'level_test') return 'test';
  return g;
}

function pipelineStageRaw(j: Record<string, unknown>): string | undefined {
  const history = j['stage_history'] ?? j['stageHistory'];
  if (Array.isArray(history) && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      const item = history[i];
      if (!isRecord(item)) continue;
      const s = String(
        item['stage'] ?? item['to_stage'] ?? item['to'] ?? item['new_stage'] ?? '',
      ).trim();
      if (s) return s;
    }
  }
  const direct = String(j['stage'] ?? j['pipeline_stage'] ?? j['current_stage'] ?? '').trim();
  return direct || undefined;
}

function normalizeKanbanStatus(opts: {
  status?: string;
  stage?: string;
  isArchived?: boolean;
  archiveReason?: string;
}): string {
  if (opts.isArchived) {
    const ar = (opts.archiveReason ?? '').trim().toLowerCase();
    if (ar === 'no_answer' || ar === 'no_pickup') return 'no_answer';
    if (ar === 'attended') return 'came';
    return 'not_came';
  }
  for (const raw of [opts.stage, opts.status]) {
    const key = raw?.trim().toLowerCase() ?? '';
    if (!key) continue;
    switch (key) {
      case 'leads':
      case 'lead':
      case 'new':
      case 'requests':
        return 'lead';
      case 'waiting':
        return 'waiting';
      case 'call':
      case 'calling':
      case 'calls':
        return 'call';
      case 'archive':
      case 'archived':
        return 'archive';
      case 'no_answer':
        return 'no_answer';
      case 'not_came':
      case 'not_interested':
      case 'no_show':
        return 'not_came';
      case 'attended':
      case 'came':
        return 'came';
      default:
        return normalizeStatus(key);
    }
  }
  return 'lead';
}

function kanbanStatusForListSource(
  listSource: string,
  normalized: string,
  isArchived: boolean,
  archiveReason?: string,
): string {
  const locked = new Set(['waiting', 'call', 'archive', 'no_answer']);
  if (locked.has(normalized)) return normalized;
  if (['not_came', 'came', 'no_answer'].includes(normalized)) return normalized;
  if (isArchived) {
    return normalizeKanbanStatus({ isArchived: true, archiveReason });
  }
  switch (listSource) {
    case 'waiting':
      return 'waiting';
    case 'call':
      return 'call';
    case 'lead':
      return 'lead';
    case 'archive':
      return normalized === 'lead' ? 'not_came' : normalized;
    default:
      return normalized || 'lead';
  }
}

function choicesToMap(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (raw == null) return out;

  if (isRecord(raw)) {
    for (const nk of ['choices', 'options', 'items', 'results', 'data', 'values'] as const) {
      if (raw[nk] != null) {
        const nested = choicesToMap(raw[nk]);
        if (Object.keys(nested).length > 0) return nested;
      }
    }
    for (const [k, v] of Object.entries(raw)) {
      if (v == null || typeof v === 'object') continue;
      const label = String(v).trim();
      const key = k.trim();
      if (key) out[key] = label || key;
    }
    return out;
  }

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (isRecord(item)) {
        const value = String(
          item['value'] ?? item['id'] ?? item['key'] ?? item['code'] ?? item['slug'] ?? '',
        ).trim();
        const label = String(
          item['label'] ?? item['name'] ?? item['title'] ?? item['display'] ?? value,
        ).trim();
        if (value) out[value] = label || value;
      } else if (Array.isArray(item) && item.length >= 2) {
        const value = String(item[0] ?? '').trim();
        const label = String(item[1] ?? '').trim();
        if (value) out[value] = label || value;
      } else if (item != null) {
        const s = String(item).trim();
        if (s) out[s] = s;
      }
    }
  }
  return out;
}

function mapToChoiceItems(map: Record<string, string>): LeadChoiceItem[] {
  return Object.entries(map)
    .filter(([value, label]) => value.trim() && label.trim())
    .map(([value, label]) => ({ value, label }));
}

const PREF_DAY_LABELS: Record<string, string> = {
  mon_wed_fri: 'Mon-Wed-Fri',
  tue_thu_sat: 'Tue-Thu-Sat',
  every_day: 'Every day',
};

const PREF_TIME_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  any_time: 'Any time',
};

function formatTimeField(raw: unknown): string | undefined {
  const s = String(raw ?? '').trim();
  if (!s) return undefined;
  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  return s;
}

function formatPreferredDays(raw: unknown): string | undefined {
  if (raw == null || raw === '') return undefined;
  if (Array.isArray(raw)) {
    const parts = raw.map((v) => String(v).trim()).filter(Boolean);
    return parts.length ? parts.join(', ') : undefined;
  }
  const s = String(raw).trim();
  if (!s || s === '[]') return undefined;
  const key = s.toLowerCase();
  if (PREF_DAY_LABELS[key]) return PREF_DAY_LABELS[key];
  if (s.includes('_') && !s.includes('-')) {
    return s
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('-');
  }
  return s.replace(/_/g, '-');
}

function formatPreferredTimeSlot(raw: unknown): string | undefined {
  const s = String(raw ?? '').trim();
  if (!s) return undefined;
  const key = s.toLowerCase();
  if (PREF_TIME_LABELS[key]) return PREF_TIME_LABELS[key];
  return formatTimeField(s) ?? s;
}

function parseLid(
  j: Record<string, unknown>,
  stage?: string,
  listFilter?: string,
): LidModel {
  const archiveReason = String(j['archive_reason'] ?? j['not_interested_reason'] ?? '').trim();
  const archivedFlag = j['is_archived'] ?? j['isArchived'] ?? j['archived'];
  const isArchived = Boolean(
    archivedFlag === true
      || (archiveReason && archiveReason.length > 0),
  );
  const stageRaw = pipelineStageRaw(j) ?? stage;
  const statusRaw = String(j['status'] ?? '').trim();
  let normalized = normalizeKanbanStatus({
    status: statusRaw,
    stage: stageRaw,
    isArchived,
    archiveReason,
  });
  const stageLower = (stageRaw ?? '').trim().toLowerCase();
  if (stageLower === 'call' || stageLower === 'calling' || stageLower === 'calls') {
    normalized = 'call';
  }
  if (listFilter) {
    normalized = kanbanStatusForListSource(listFilter, normalized, isArchived, archiveReason);
  }

  const trialDate = String(j['trial_date'] ?? j['scheduled_date'] ?? j['date'] ?? '').trim();
  const trialTime = formatTimeField(j['trial_time'] ?? j['scheduled_time']);
  const adminNote = String(j['admin_note'] ?? '').trim();
  const commentRaw = String(j['comment'] ?? j['archive_comment'] ?? '').trim();

  const rawId = j['id'];
  return {
    id: validLeadId(rawId),
    firstName: String(j['first_name'] ?? j['full_name'] ?? j['name'] ?? ''),
    phone: j['phone'] as string | undefined,
    status: normalized,
    statusDisplay: String(j['status_display'] ?? j['stage_display'] ?? j['stage'] ?? j['status'] ?? '').trim() || undefined,
    source: j['source'] as string | undefined,
    comment: adminNote || commentRaw || undefined,
    date: trialDate ? trialDate.slice(0, 10) : undefined,
    branch: asInt(j['branch'] ?? j['branch_id']) || undefined,
    destination: (j['destination'] ?? j['trial_group_name']) as string | undefined,
    gender: j['gender'] as string | undefined,
    course: j['course'] as number | undefined,
    giveBook: (j['give_book'] ?? false) as boolean,
    trialGroup: (j['trial_group'] ?? j['trial_group_id']) as number | string | undefined,
    trialGroupName: String(j['trial_group_name'] ?? '').trim() || undefined,
    callCount: asInt(j['call_count'] ?? j['calls_count'] ?? j['callCount']),
    isArchived,
    came: typeof j['came'] === 'boolean' ? j['came'] : undefined,
    telegramUsername: String(j['telegram_username'] ?? j['telegram'] ?? '').trim() || undefined,
    scheduledDate: trialDate ? trialDate.slice(0, 10) : undefined,
    scheduledTime: trialTime,
    goal: j['goal'] as string | undefined,
    preferredDays: formatPreferredDays(j['preferred_days']),
    preferredTimeSlot: trialTime ?? formatPreferredTimeSlot(j['preferred_time'] ?? j['preferred_time_slot']),
    createdAt: String(j['created_at'] ?? j['created'] ?? '').trim() || undefined,
  };
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

  if (Array.isArray(map['results'])) {
    const rows = (map['results'] as unknown[]).filter(isRecord);
    if (rows.length > 0 || map['count'] != null) {
      return rows.map((item) => parseLid(item));
    }
  }

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

  return [...byId.values(), ...withoutId];
}

type LeadListParams = {
  status?: string;
  source?: string;
  search?: string;
  callFilter?: string;
  branchId?: string;
};

type BaseQueryFn = (
  arg: { url: string; method?: string; data?: unknown; params?: Record<string, unknown> }
) => Promise<BqResult>;

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

async function fetchLeadsFromUrl(
  baseQuery: BaseQueryFn,
  url: string,
  params: Record<string, unknown>
): Promise<LidModel[]> {
  const result = await baseQuery({ url, params });
  if (result.error) {
    throw result.error;
  }
  return extractPipelineLeads(result.data);
}

function parseLeadListResponse(raw: unknown, listFilter: string): LidModel[] {
  const map = unwrapDataMap(raw);
  const rows = Array.isArray(map['results'])
    ? (map['results'] as unknown[]).filter(isRecord)
  : extractMapList(raw);
  return rows.map((item) => parseLid(item, undefined, listFilter));
}

async function fetchLeadColumn(
  baseQuery: BaseQueryFn,
  query: Record<string, unknown>,
  listFilter: string,
): Promise<LidModel[]> {
  const result = await baseQuery({ url: ApiPaths.lead, params: query });
  if (result.error) throw result.error;
  return parseLeadListResponse(result.data, listFilter);
}

/** Same as Flutter: 4 parallel GETs by pipeline column, merge by id with stage priority. */
async function loadPipelineLeads(
  baseQuery: BaseQueryFn,
  params: LeadListParams = {},
): Promise<LidModel[]> {
  const extra = buildLeadQueryParams(params);
  const sources = ['lead', 'waiting', 'call', 'archive'] as const;
  const queries: Record<string, unknown>[] = [
    { ...extra, status: 'lead' },
    { ...extra, status: 'waiting' },
    { ...extra, status: 'call' },
    { ...extra, is_archived: 1 },
  ];

  const columns = await Promise.all(
    sources.map((source, i) => fetchLeadColumn(baseQuery, queries[i], source)),
  );

  const byId = new Map<number, LidModel>();
  const idSource = new Map<number, string>();
  const withoutId: LidModel[] = [];

  for (let i = 0; i < columns.length; i++) {
    const source = sources[i];
    for (const lead of columns[i]) {
      const id = lead.id;
      if (id == null) {
        withoutId.push(lead);
        continue;
      }
      const pri = LIST_SOURCE_PRIORITY[source] ?? 0;
      const prev = idSource.get(id);
      if (prev != null) {
        const prevPri = LIST_SOURCE_PRIORITY[prev] ?? 0;
        if (pri <= prevPri) continue;
      }
      byId.set(id, lead);
      idSource.set(id, source);
    }
  }

  return [...byId.values(), ...withoutId];
}

async function loadAllLeads(
  baseQuery: BaseQueryFn,
  params: LeadListParams = {},
): Promise<LidModel[]> {
  try {
    return await loadPipelineLeads(baseQuery, params);
  } catch {
    const queryParams = buildLeadQueryParams(params);
    const byId = new Map<number, LidModel>();
    const withoutId: LidModel[] = [];
    for (let page = 1; page <= 50; page += 1) {
      const result = await baseQuery({
        url: ApiPaths.lead,
        params: { ...queryParams, page, page_size: 50 },
      });
      if (result.error) {
        if (page === 1) throw result.error;
        break;
      }
      mergeLeads(byId, extractPipelineLeads(result.data), withoutId);
      const map = unwrapDataMap(result.data);
      const total = pickNum(map, ['count']);
      const pageSize = pickNum(map, ['page_size']) || 50;
      if (total > 0 && page * pageSize >= total) break;
    }
    return [...byId.values(), ...withoutId];
  }
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
    if (raw == null) return [];
    if (isRecord(raw) && !Array.isArray(raw)) {
      return Object.entries(raw)
        .map(([k, v]) => {
          const value = String(k).trim();
          const label = String(v ?? k).trim();
          return value && label ? { value, label } : null;
        })
        .filter((item): item is LeadChoiceItem => item != null);
    }
    if (!Array.isArray(raw)) return [];
    return raw
      .map((entry) => {
        if (typeof entry === 'string' || typeof entry === 'number') {
          const s = String(entry).trim();
          return s ? { value: s, label: s } : null;
        }
        if (!isRecord(entry)) return null;
        const value = String(
          entry['value'] ??
            entry['slug'] ??
            entry['code'] ??
            entry['key'] ??
            entry['id'] ??
            '',
        ).trim();
        const label = String(
          entry['label'] ??
            entry['name'] ??
            entry['display'] ??
            entry['title'] ??
            entry['text'] ??
            entry['display_name'] ??
            value,
        ).trim();
        if (!value && !label) return null;
        const v = value || label.toLowerCase().replace(/\s+/g, '_');
        const l = label || value;
        return { value: v, label: l };
      })
      .filter((item): item is LeadChoiceItem => item != null);
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
  const statuses = parseChoiceItems('statuses');
  const stages = parseChoiceItems('stages');
  const root = j;

  const pickCategory = (keys: string[]): LeadChoiceItem[] => {
    for (const key of keys) {
      if (root[key] == null) continue;
      const fromMap = mapToChoiceItems(choicesToMap(root[key]));
      if (fromMap.length) return fromMap;
      const fromList = parseChoiceItems(key);
      if (fromList.length) return fromList;
    }
    return [];
  };

  return {
    groupRequiredStatuses: groupRequired,
    statuses: statuses.length ? statuses : stages,
    sources: parseChoiceItems('sources'),
    genders: pickCategory(['genders', 'gender']),
    goals: pickCategory(['goals', 'goal', 'goal_options', 'purposes']),
    preferredDays: pickCategory(['preferred_days', 'days']),
    preferredTimes: pickCategory(['preferred_times', 'time', 'times']),
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
  goals: [
    { value: 'trial_lesson', label: 'Trial lesson' },
    { value: 'test', label: 'Test' },
    { value: 'consultation', label: 'Consultation' },
  ],
  preferredDays: [
    { value: 'mon_wed_fri', label: 'Mon-Wed-Fri' },
    { value: 'tue_thu_sat', label: 'Tue-Thu-Sat' },
    { value: 'every_day', label: 'Every day' },
  ],
  preferredTimes: [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' },
    { value: 'any_time', label: 'Any time' },
  ],
  groups: [],
  books: [],
};

type LeadStageExtras = Parameters<typeof lidToBody>[0];

/** POST /lead/ — Flutter `LidApiService.createLead` payload. */
function buildDartLeadCreateBody(
  data: LeadStageExtras,
  targetStage: string,
): Record<string, unknown> {
  const tg = data.telegramUsername?.trim().replace(/^@+/, '') ?? '';
  const body: Record<string, unknown> = {
    name: data.firstName,
    phone: data.phone,
  };
  if (tg) body['telegram'] = tg;
  if (data.source?.trim()) body['source'] = data.source.trim();
  if (data.gender?.trim()) body['gender'] = data.gender.trim();
  const comment = data.comment?.trim();
  if (comment) body['comment'] = comment;

  const stage = normalizeStatus(targetStage);
  if (stage === 'lead') return body;

  if (data.branch != null) body['branch'] = data.branch;

  const goalKey = normalizeGoalForApi(data.goal);
  if (goalKey) body['goal'] = goalKey;
  if (data.preferredDays?.trim()) body['preferred_days'] = data.preferredDays.trim();

  const d = data.scheduledDate ? lidApiDateYmd(data.scheduledDate) : '';
  const t = data.scheduledTime ? lidApiTimeHms(data.scheduledTime) : '';

  if (goalKey === 'trial_lesson' && data.trialGroup != null) {
    body['trial_group'] = toNumberIfPossible(data.trialGroup);
  }
  if (goalKey === 'trial_lesson' || goalKey === 'test' || goalKey === 'consultation') {
    if (d) body['trial_date'] = d;
    if (t) body['trial_time'] = t;
  }

  return body;
}

/** POST /lead/{id}/move/ — Flutter `moveLeadStage` body (stage + branch + came + comment). */
function buildDartMoveBody(target: string, extras: LeadStageExtras): Record<string, unknown> {
  const stageKey = normalizeStatus(target);
  const body: Record<string, unknown> = { stage: stageKey };
  if (
    (stageKey === 'waiting' || stageKey === 'call')
    && extras.branch != null
  ) {
    body['branch'] = extras.branch;
  }
  if (stageKey === 'call' || stageKey === 'waiting') {
    body['came'] = extras.came ?? false;
  } else if (extras.came !== undefined) {
    body['came'] = extras.came;
  }
  if (extras.archiveReason?.trim()) body['archive_reason'] = extras.archiveReason.trim();
  const note = extras.comment?.trim();
  if (note) body['comment'] = note;
  return body;
}

async function fetchLeadById(baseQuery: BaseQueryFn, id: number): Promise<LidModel | null> {
  const result = await baseQuery({ url: ApiPaths.leadId(id) });
  if (result.error) return null;
  return parseLid(unwrapEntity(result.data) as Record<string, unknown>);
}

async function applyLeadStage(
  baseQuery: BaseQueryFn,
  id: number,
  stage: string,
  extras: LeadStageExtras = {},
): Promise<LidModel> {
  const target = normalizeStatus(stage);
  const moveBody = buildDartMoveBody(target, extras);
  const moveResult = await baseQuery({
    url: ApiPaths.leadMove(id),
    method: 'POST',
    data: moveBody,
  });
  if (moveResult.error) throw moveResult.error;

  const moveEntity = unwrapEntity(moveResult.data) as Record<string, unknown>;
  const fromMove = parseLid(moveEntity, undefined, target);
  const came = extras.came ?? fromMove.came;

  if (target === 'call') {
    return { ...fromMove, id, status: 'call', came };
  }

  const verified = await fetchLeadById(baseQuery, id);
  const resolved = verified
    ? { ...verified, status: target, id, came: came ?? verified.came }
    : fromMove;

  return {
    ...resolved,
    id,
    status: target,
    came: target === 'waiting' ? (came ?? false) : came,
    isArchived: target === 'archive' ? true : resolved.isArchived,
  };
}

function parseCreatedLead(raw: unknown, fallback: Parameters<typeof lidToBody>[0]): LidModel {
  const entity = unwrapEntity(raw, ['lead', 'item', 'result', 'data']);
  const parsed = parseLid(entity);
  if (parsed.id == null) {
    const map = unwrapDataMap(raw);
    parsed.id = validLeadId(map['id'] ?? entity['id']);
  }
  if (!parsed.firstName?.trim()) parsed.firstName = fallback.firstName ?? '';
  if (!parsed.phone && fallback.phone) parsed.phone = fallback.phone;
  if (fallback.status && !parsed.status) parsed.status = normalizeStatus(fallback.status);
  if (fallback.scheduledDate) parsed.scheduledDate = parsed.scheduledDate ?? fallback.scheduledDate;
  if (fallback.scheduledTime) parsed.scheduledTime = parsed.scheduledTime ?? fallback.scheduledTime;
  if (fallback.trialGroup) parsed.trialGroup = parsed.trialGroup ?? fallback.trialGroup;
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
  trialGroup?: number | string;
  came?: boolean;
  archiveReason?: string;
  testLevel?: string;
  consultationReason?: string;
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
  if (data.comment !== undefined) {
    body['comment'] = data.comment;
    body['admin_note'] = data.comment;
  }
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
  if (data.telegramUsername !== undefined) {
    body['telegram'] = data.telegramUsername;
    body['telegram_username'] = data.telegramUsername;
  }
  if (data.trialGroup !== undefined) body['trial_group'] = toNumberIfPossible(data.trialGroup);
  if (data.scheduledDate !== undefined) {
    body['scheduled_date'] = data.scheduledDate;
    body['trial_date'] = data.scheduledDate;
  }
  if (data.scheduledTime !== undefined) {
    body['scheduled_time'] = data.scheduledTime;
    body['trial_time'] = data.scheduledTime;
  }
  if (data.status !== undefined) body['stage'] = data.status;
  if (data.preferredBranchId !== undefined) body['preferred_branch_id'] = data.preferredBranchId;
  if (data.came !== undefined) body['came'] = data.came;
  return body;
}

function toNumberIfPossible(value: number | string): number | string {
  const n = Number(value);
  return Number.isNaN(n) || String(value).trim() === '' ? value : n;
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

    verifyLeadPersisted: builder.query<LidModel | null, { phone: string; id?: number }>({
      async queryFn({ phone, id }, _api, _extra, baseQuery) {
        const bq = baseQuery as BaseQueryFn;
        const phoneDigits = phone.replace(/\D/g, '');

        const matchesPhone = (l: LidModel) =>
          Boolean(l.phone && l.phone.replace(/\D/g, '') === phoneDigits);

        try {
          if (id != null && validLeadId(id)) {
            const detail = await bq({ url: ApiPaths.leadId(id) });
            if (!detail.error && detail.data) {
              const lead = parseLid(unwrapEntity(detail.data) as Record<string, unknown>);
              if (lead.id != null) return { data: lead };
            }
          }

          const list = await fetchLeadsFromUrl(bq, ApiPaths.lead, {
            search: phone.trim(),
          });
          const match = list.find(
            (l) => (id != null && l.id === id) || matchesPhone(l),
          );
          if (match) return { data: match };

          const all = await loadAllLeads(bq, {});
          const fallback = all.find(
            (l) => (id != null && l.id === id) || matchesPhone(l),
          );
          return { data: fallback ?? null };
        } catch (error) {
          return toLeadQueryError(error);
        }
      },
    }),

    getLeadChoices: builder.query<LeadChoicesModel, void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const bq = baseQuery as BaseQueryFn;
        const choicesResult = await bq({ url: ApiPaths.leadChoices });
        const sourcesResult = await bq({ url: ApiPaths.leadChoicesSources });
        const groupsResult = await bq({ url: ApiPaths.leadGroups });

        let parsed: LeadChoicesModel = { ...DEFAULT_CHOICES };
        if (!choicesResult.error && choicesResult.data) {
          const fromApi = parseLeadChoices(unwrapDataMap(choicesResult.data));
          parsed = {
            ...parsed,
            ...fromApi,
            statuses: fromApi.statuses.length ? fromApi.statuses : parsed.statuses,
            sources: fromApi.sources.length ? fromApi.sources : parsed.sources,
            genders: fromApi.genders.some((g) => g.value?.trim() && g.label?.trim())
              ? fromApi.genders.filter((g) => g.value?.trim() && g.label?.trim())
              : parsed.genders,
            goals: fromApi.goals?.length ? fromApi.goals : parsed.goals,
            preferredDays: fromApi.preferredDays?.length ? fromApi.preferredDays : parsed.preferredDays,
            preferredTimes: fromApi.preferredTimes?.length ? fromApi.preferredTimes : parsed.preferredTimes,
            books: fromApi.books.length ? fromApi.books : parsed.books,
          };
        }
        if (!sourcesResult.error && sourcesResult.data) {
          const fromSources = parseLeadChoices(unwrapDataMap(sourcesResult.data));
          if (fromSources.sources.length) parsed.sources = fromSources.sources;
        }

        const groups = groupsResult.error ? [] : extractMapList(groupsResult.data);
        const parsedGroups: LeadGroupItem[] = groups.map((g) => ({
          id: Number(g['id'] ?? 0),
          name: String(g['name'] ?? ''),
        }));
        if (parsedGroups.length) parsed.groups = parsedGroups;

        return { data: parsed };
      },
    }),

    getLeadPipelineStats: builder.query<LeadPipelineSummary, { branchId?: string } | void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(baseQuery, [{ url: ApiPaths.leadSummary }], parseLeadSummary),
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

    getLeadEdit: builder.query<LidModel, number>({
      queryFn: (id, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [{ url: ApiPaths.leadId(id) }],
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
      trialGroup?: number | string;
      came?: boolean;
      archiveReason?: string;
    }>({
      async queryFn(data, _api, _extra, baseQuery) {
        const bq = baseQuery as BaseQueryFn;
        const targetStage = normalizeStatus(data.status ?? 'lead');
        const body = buildDartLeadCreateBody(data, targetStage);
        const result = await bq({ url: ApiPaths.lead, method: 'POST', data: body });
        if (result.error) {
          return toLeadQueryError(result.error);
        }
        let parsed = parseCreatedLead(result.data, data);
        if (!validLeadId(parsed.id)) {
          return toLeadQueryError({
            status: 400,
            data: { detail: 'Lead was not created — server did not return a valid id.' },
          });
        }

        if (targetStage !== 'lead') {
          try {
            parsed = await applyLeadStage(bq, parsed.id!, targetStage, {
              branch: data.branch,
              came: data.came ?? false,
              comment: data.comment,
              archiveReason: data.archiveReason,
            });
          } catch {
            parsed = { ...parsed, status: targetStage };
          }
        }

        return { data: parsed };
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
      trialGroup?: number | string;
      came?: boolean;
    }>({
      async queryFn({ id, status, ...rest }, _api, _extra, baseQuery) {
        const bq = baseQuery as BaseQueryFn;
        const patchResult = await bq({
          url: ApiPaths.leadId(id),
          method: 'PATCH',
          data: lidToBody(rest),
        });
        if (patchResult.error) return toLeadQueryError(patchResult.error);

        if (status) {
          try {
            return { data: await applyLeadStage(bq, id, status, rest) };
          } catch (error) {
            return toLeadQueryError(error);
          }
        }

        return { data: parseLid(unwrapEntity(patchResult.data) as Record<string, unknown>) };
      },
      invalidatesTags: ['Lead', 'LeadStats'],
    }),

    updateLeadStatus: builder.mutation<void, { id: number; status: string }>({
      async queryFn({ id, status }, _api, _extra, baseQuery) {
        const target = leadMoveTarget(status);
        try {
          await applyLeadStage(baseQuery as BaseQueryFn, id, target.stage, { came: target.came });
          return { data: undefined };
        } catch (error) {
          return toLeadQueryError(error);
        }
      },
      invalidatesTags: ['Lead', 'LeadStats'],
    }),

    deleteLead: builder.mutation<void, number>({
      queryFn: (id, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [{ url: ApiPaths.leadId(id), method: 'DELETE' }],
          () => undefined
        ),
      invalidatesTags: ['Lead', 'LeadStats'],
    }),

    getLeadCalls: builder.query<Record<string, unknown>[], number>({
      queryFn: (id, _api, _extra, baseQuery) =>
        dataWithFallbacks(baseQuery, [{ url: ApiPaths.leadCall(id) }], extractMapList),
      providesTags: ['LeadCalls'],
    }),

    addLeadCall: builder.mutation<Record<string, unknown>, { id: number; note: string }>({
      queryFn: ({ id, note }, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [{ url: ApiPaths.leadCall(id), method: 'POST', data: { note } }],
          (raw) => raw as Record<string, unknown>
        ),
      invalidatesTags: ['LeadCalls', 'Lead', 'LeadStats'],
    }),

    transitionLeadStage: builder.mutation<
      LidModel,
      { id: number; status: string } & LeadStageExtras
    >({
      async queryFn({ id, status, ...extras }, _api, _extra, baseQuery) {
        const bq = baseQuery as BaseQueryFn;
        const raw = String(status ?? '').trim().toLowerCase();
        const target = ['lead', 'waiting', 'call', 'archive'].includes(raw)
          ? { stage: normalizeStatus(raw) }
          : leadMoveTarget(status);
        try {
          const data = await applyLeadStage(bq, id, target.stage, {
            ...extras,
            came: extras.came ?? target.came,
          });
          return { data: { ...data, id, status: target.stage } };
        } catch (error) {
          return toLeadQueryError(error);
        }
      },
      invalidatesTags: ['Lead', 'LeadStats'],
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
      async queryFn({ id, preferredBranchId, comment }, _api, _extra, baseQuery) {
        const branchNum = Number(preferredBranchId);
        const branch = Number.isFinite(branchNum) && branchNum > 0 ? branchNum : undefined;
        try {
          const data = await applyLeadStage(baseQuery as BaseQueryFn, id, 'waiting', {
            branch,
            came: false,
            comment,
          });
          return { data };
        } catch (error) {
          return toLeadQueryError(error);
        }
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

    archiveLead: builder.mutation<LidModel | null, { id: number; archiveReason: string; comment?: string }>({
      async queryFn({ id, archiveReason, comment }, _api, _extra, baseQuery) {
        try {
          const data = await applyLeadStage(baseQuery as BaseQueryFn, id, 'archive', {
            archiveReason,
            comment,
            came: archiveReason === 'attended',
          });
          return { data };
        } catch (error) {
          return toLeadQueryError(error);
        }
      },
      invalidatesTags: ['Lead', 'LeadStats'],
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useVerifyLeadPersistedQuery,
  useLazyVerifyLeadPersistedQuery,
  useGetLeadChoicesQuery,
  useGetLeadPipelineStatsQuery,
  useGetLeadGroupsQuery,
  useGetLeadEditQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useUpdateLeadStatusMutation,
  useDeleteLeadMutation,
  useGetLeadCallsQuery,
  useAddLeadCallMutation,
  useMoveLeadToWaitingMutation,
  useTransitionLeadStageMutation,
  useSetLeadAttendanceMutation,
  useArchiveLeadMutation,
} = leadApi;
