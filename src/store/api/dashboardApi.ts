import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import { ApiPaths } from '../../api/apiPaths';
import { buildPaymentPayload } from '../../api/paymentPayload';
import { dataWithFallbacks, extractListByKeys, extractMapList, isRecord, unwrapDataMap, type ApiRequest } from '../../api/apiResponse';
import type {
  DashboardStatsModel,
  StudentModelHome,
  SearchModel,
  SearchItemModel,
  FinanceModel,
  WeeklyModel,
  TrialStatsModel,
  AttendanceStatModel,
  RoomModel,
  RoomGroupModel,
  SalesFunnelModel,
  BooksAnalyticsModel,
  BooksAnalyticsStat,
  BooksActionConfig,
  BookCategoryModel,
  BookItemModel,
  BooksModalConfig,
  BooksModalTab,
  BooksModalActions,
  DashboardActionsConfig,
  DashboardActionItem,
  DashboardNotificationConfig,
} from '../../types';

function asInt(v: unknown): number {
  if (typeof v === 'number') return Math.trunc(v);
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function asNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function parseWeekly(raw: unknown[]): WeeklyModel[] {
  return raw.map((e) => {
    const j = e as Record<string, unknown>;
    return {
      date: (j['date'] ?? j['day'] ?? '') as string,
      day: (j['day'] ?? '') as string,
      dayIndex: (j['day_index'] ?? 0) as number,
      count: (j['count'] ?? 0) as number,
      graphCount: (j['graph_count'] ?? 0) as number,
      fillPercent: (j['fill_percent'] ?? 0) as number,
      maxDailyCapacity: (j['max_daily_capacity'] ?? 0) as number,
      overflowCount: (j['overflow_count'] ?? 0) as number,
      leadsCameCount: (j['leads_came_count'] ?? 0) as number,
      trialDoneCount: (j['trial_done_count'] ?? 0) as number,
      leadsStatusCount: (j['leads_status_count'] ?? 0) as number,
      trialsCount: (j['trials_count'] ?? 0) as number,
      trialLeadsCount: (j['trial_leads_count'] ?? 0) as number,
      lessonCount: (j['lesson_count'] ?? 0) as number,
      leadStatus: (j['lead_status'] ?? '') as string,
    };
  });
}

function parseWeeklyFromRaw(raw: unknown): WeeklyModel[] {
  if (Array.isArray(raw)) return parseWeekly(raw);
  const map = unwrapDataMap(raw);
  for (const key of ['weekly', 'chart', 'days', 'items', 'results']) {
    const nested = map[key];
    if (Array.isArray(nested)) return parseWeekly(nested);
    if (isRecord(nested)) {
      const list = parseWeeklyFromRaw(nested);
      if (list.length > 0) return list;
    }
  }
  return [];
}

function parseTrialStats(j: Record<string, unknown>): TrialStatsModel {
  const weeklyList = parseWeeklyFromRaw(j['weekly'] ?? j);
  return {
    title: (j['title'] ?? 'Trial Lessons') as string,
    subtitle: (j['subtitle'] ?? '') as string,
    enrolled: asInt(j['enrolled'] ?? j['trial_registered'] ?? j['registered'] ?? j['enrolled_count']),
    coming: asInt(j['coming'] ?? j['trials_count'] ?? j['coming_count'] ?? j['scheduled']),
    arrived: asInt(j['arrived'] ?? j['trial_came'] ?? j['arrived_count'] ?? j['came']),
    total: asInt(j['total'] ?? j['trial_total'] ?? j['total_count']),
    leads: asInt(j['leads']),
    waiting: asInt(j['waiting']),
    came: asInt(j['came'] ?? j['trial_came']),
    notCame: asInt(j['not_came'] ?? j['trial_not_came']),
    weekly: weeklyList,
  };
}

function parseTrialStatsFromRaw(raw: unknown): TrialStatsModel {
  const map = unwrapDataMap(raw);
  const stats = map['stats'] ?? map['trial'] ?? map['summary'] ?? map['trial_lessons'];
  const source = isRecord(stats) ? stats : map;
  return {
    ...parseTrialStats(source),
    weekly: parseWeeklyFromRaw(map['weekly'] ?? raw),
  };
}

function pickFromStatCards(cards: unknown): Partial<DashboardStatsModel> {
  if (!Array.isArray(cards)) return {};
  const out: Partial<DashboardStatsModel> = {};
  for (const item of cards) {
    if (!isRecord(item)) continue;
    const key = String(item['key'] ?? item['slug'] ?? item['id'] ?? item['title'] ?? item['label'] ?? '').toLowerCase();
    const value = asInt(item['value'] ?? item['count'] ?? item['total'] ?? item['amount']);
    if (key.includes('student') && !key.includes('new')) out.students = value;
    else if (key.includes('new') && key.includes('student')) out.newStudents = value;
    else if (key.includes('lead')) out.leads = value;
    else if (key.includes('wait')) out.waiting = value;
  }
  return out;
}

function parseStats(j: Record<string, unknown>): DashboardStatsModel {
  const stats = unwrapDataMap(j);
  const nested = stats['overview'] ?? stats['stats'] ?? stats['summary'] ?? stats['indicators'];
  const source = isRecord(nested) ? nested : stats;
  const cards = source['cards'];
  const fromCards = isRecord(cards)
    ? {
        students: asInt(cards['active_students'] ?? cards['students'] ?? cards['student_count'] ?? cards['students_count']),
        newStudents: asInt(cards['new_students'] ?? cards['new'] ?? cards['new_students_count']),
        leads: asInt(cards['active_leads'] ?? cards['leads'] ?? cards['total_leads']),
        waiting: asInt(cards['waiting'] ?? cards['waiting_students']),
      }
    : pickFromStatCards(cards);

  return {
    leads: asInt(source['leads'] ?? source['total_leads']) || fromCards.leads || 0,
    students: asInt(
      source['students']
      ?? source['active_students']
      ?? source['total_students']
      ?? source['students_count']
      ?? source['student_count']
    ) || fromCards.students || 0,
    waiting: asInt(source['waiting'] ?? source['waiting_students']) || fromCards.waiting || 0,
    newStudents: asInt(
      source['new_students']
      ?? source['new']
      ?? source['new_students_count']
      ?? source['new_active_students']
    ) || fromCards.newStudents || 0,
  };
}

async function fetchHomeStats(
  baseQuery: (arg: ApiRequest) => Promise<unknown> | unknown,
): Promise<DashboardStatsModel> {
  const urls = [
    ApiPaths.homeOverview,
    ApiPaths.studentsStats,
    ApiPaths.analyticsOverview,
    '/dashboard/stats/',
  ];

  let merged: DashboardStatsModel = { leads: 0, students: 0, waiting: 0, newStudents: 0 };

  for (const url of urls) {
    const result = await baseQuery({ url }) as { data?: unknown; error?: unknown };
    if (result.error) continue;
    const parsed = parseStats(
      isRecord(result.data) ? result.data : { data: result.data } as Record<string, unknown>
    );
    merged = {
      leads: merged.leads || parsed.leads,
      students: merged.students || parsed.students,
      waiting: merged.waiting || parsed.waiting,
      newStudents: merged.newStudents || parsed.newStudents,
    };
    if (merged.students > 0 && merged.newStudents >= 0 && url === ApiPaths.homeOverview) {
      break;
    }
  }

  return merged;
}

function parseFinance(j: Record<string, unknown>): FinanceModel {
  const root = unwrapDataMap(j);
  const source = isRecord(root['financial_plan'])
    ? root['financial_plan'] as Record<string, unknown>
    : isRecord(root['finance'])
      ? root['finance'] as Record<string, unknown>
      : root;
  const expected = Number(source['expected_amount'] ?? source['expected'] ?? source['expected_payment'] ?? source['total_expected'] ?? 0);
  const paid = Number(source['received'] ?? source['paid'] ?? source['collected'] ?? source['income'] ?? source['total_received'] ?? 0);
  const remaining = Number(source['remaining_amount'] ?? source['remaining'] ?? source['balance'] ?? Math.max(0, expected - paid));
  const directProgress = Number(source['collection_progress'] ?? source['progress'] ?? source['collection_progress_percent'] ?? 0);
  return {
    expected,
    paid,
    remaining,
    progress: directProgress || (expected > 0 && paid > 0 ? Math.round((paid / expected) * 100) : 0),
  };
}

function parseStudentFromJson(j: Record<string, unknown>): StudentModelHome {
  return {
    id: (j['id'] ?? -1) as number,
    name: (j['name'] ?? j['full_name'] ?? j['first_name'] ?? '') as string,
    phone: (j['phone'] ?? '') as string,
    group: String(j['group_name'] ?? j['group'] ?? j['date'] ?? ''),
    teacher: String(j['teacher_name'] ?? j['teacher'] ?? ''),
    balance: String(j['balance'] ?? j['debt'] ?? j['scheduled_time'] ?? j['time'] ?? '0'),
    status: (j['status'] ?? j['lead_status'] ?? j['trial_status'] ?? '') as string,
    called: (j['called'] ?? false) as boolean,
    missedLessons: (j['missed_lessons'] ?? 0) as number,
  };
}

function parseQuickList(raw: unknown, keys: string[], parser: (j: Record<string, unknown>) => StudentModelHome = parseStudentFromJson): StudentModelHome[] {
  return extractListByKeys(raw, keys).map(parser);
}

function quickListKeys(type: string): string[] {
  switch (type) {
    case 'active':
    case 'students':
      return ['active', 'active_students', 'students'];
    case 'waiting':
      return ['waiting', 'waiting_students'];
    case 'trial':
      return ['trial_today', 'trial', 'trial_lessons', 'trial_students'];
    case 'debtors':
      return ['debtors', 'debtor_students'];
    case 'absent':
    case 'not_came':
      return ['absent_today', 'absent', 'not_came', 'absent_students'];
    case 'new':
    case 'new_students':
      return ['new_students', 'new', 'new_this_month'];
    case 'leads':
    default:
      return ['leads'];
  }
}

function parseStudentFromTrialJson(j: Record<string, unknown>): StudentModelHome {
  return {
    id: (j['id'] ?? j['trial_lesson_id'] ?? -1) as number,
    name: (j['full_name'] ?? j['name'] ?? '') as string,
    phone: (j['phone'] ?? '') as string,
    group: (j['date'] ?? '') as string,
    teacher: '',
    balance: (j['scheduled_time'] ?? j['time'] ?? '') as string,
    status: (j['trial_status'] ?? '') as string,
    called: false,
    missedLessons: 0,
  };
}

function parseStudentFromAbsentJson(j: Record<string, unknown>): StudentModelHome {
  return {
    id: (j['student_id'] ?? -1) as number,
    name: (j['full_name'] ?? j['name'] ?? '') as string,
    phone: (j['phone'] ?? '') as string,
    group: (j['group_name'] ?? j['group'] ?? '') as string,
    teacher: '',
    balance: (j['date'] ?? '') as string,
    status: 'absent',
    called: false,
    missedLessons: 0,
  };
}

function parseStudentFromDebtorJson(j: Record<string, unknown>): StudentModelHome {
  return {
    id: (j['student_id'] ?? -1) as number,
    name: (j['name'] ?? '') as string,
    phone: '',
    group: (j['group'] ?? '') as string,
    teacher: '',
    balance: String(j['debt'] ?? 0),
    status: 'debtor',
    called: false,
    missedLessons: 0,
  };
}

function parseSearchModel(j: Record<string, unknown>): SearchModel {
  function parse(keys: string[]): SearchItemModel[] {
    for (const key of keys) {
      const val = j[key];
      if (Array.isArray(val) && val.length > 0) {
        return (val as Record<string, unknown>[]).map((e) => ({
          id: e['id'],
          name: (e['name'] ?? e['full_name'] ?? e['username'] ?? '') as string,
          detail: String(e['detail'] ?? ''),
        }));
      }
    }
    return [];
  }
  return {
    students: parse(['students', 'student']),
    leads: parse(['leads', 'lids', 'lid', 'lead']),
    groups: parse(['groups', 'group']),
    exams: parse(['exams', 'exam', 'tests', 'test']),
    teachers: parse(['teachers', 'teacher']),
    workers: parse(['workers', 'worker', 'staff']),
  };
}

function parseAttendanceStat(j: Record<string, unknown>): AttendanceStatModel {
  return {
    date: String(j['date'] ?? ''),
    present: asInt(j['present']),
    attended: asInt(j['attended']),
    absent: asInt(j['absent']),
    total: asInt(j['total']),
    rate: asNum(j['rate']),
  };
}

function parseRoomGroup(j: Record<string, unknown>): RoomGroupModel {
  return {
    groupName: String(j['group_name'] ?? j['name'] ?? ''),
    teacher: String(j['teacher'] ?? ''),
    startTime: String(j['start_time'] ?? ''),
    endTime: String(j['end_time'] ?? ''),
  };
}

function parseRoom(j: Record<string, unknown>): RoomModel {
  const groupsRaw = j['groups'];
  const groups = Array.isArray(groupsRaw)
    ? (groupsRaw as Record<string, unknown>[]).map(parseRoomGroup)
    : [];
  return {
    id: typeof j['id'] === 'number' ? (j['id'] as number) : undefined,
    name: String(j['room_name'] ?? j['name'] ?? ''),
    color: j['color'] as string | undefined,
    startTime: j['start_time'] as string | undefined,
    endTime: j['end_time'] as string | undefined,
    groups,
  };
}

function parseSalesFunnel(j: Record<string, unknown>): SalesFunnelModel {
  return {
    requests: asInt(j['requests']),
    trialArrived: asInt(j['trial_arrived']),
    trialLeft: asInt(j['trial_left']),
    paid: asInt(j['paid']),
    conversion: asNum(j['conversion']),
  };
}

function parseBooksStat(j: Record<string, unknown>): BooksAnalyticsStat {
  return {
    type: String(j['type'] ?? ''),
    label: String(j['label'] ?? ''),
    value: asInt(j['value']),
  };
}

function parseBooksAction(j: Record<string, unknown> | undefined): BooksActionConfig {
  if (!j) return { label: '', endpoint: '', method: '' };
  return {
    label: String(j['label'] ?? ''),
    endpoint: String(j['endpoint'] ?? ''),
    method: String(j['method'] ?? ''),
  };
}

function parseBooksAnalytics(j: Record<string, unknown>): BooksAnalyticsModel {
  const cards = Array.isArray(j['cards'])
    ? (j['cards'] as Record<string, unknown>[]).map(parseBooksStat)
    : [];
  const actions = j['actions'] as Record<string, unknown> | undefined;
  const addBookAction = parseBooksAction(actions?.['add_book'] as Record<string, unknown> | undefined);
  return {
    title: String(j['title'] ?? 'Books Analytics'),
    subtitle: String(j['subtitle'] ?? ''),
    totalBooks: asInt(j['total_books']),
    issuedBooks: asInt(j['issued_books']),
    returnedBooks: asInt(j['returned_books']),
    overdueBooks: asInt(j['overdue_books']),
    cards,
    addBookAction,
  };
}

function parseBookCategory(j: Record<string, unknown>): BookCategoryModel {
  return {
    id: asInt(j['id']),
    name: String(j['name'] ?? ''),
  };
}

function parseBookItem(j: Record<string, unknown>): BookItemModel {
  return {
    id: asInt(j['id']),
    title: String(j['title'] ?? ''),
    author: String(j['author'] ?? ''),
    categoryId: typeof j['category_id'] === 'number' ? (j['category_id'] as number) : undefined,
    category: String(j['category'] ?? ''),
    copies: asInt(j['copies'] ?? j['total']),
    salePrice: String(j['sale_price'] ?? '0.00'),
    code: String(j['code'] ?? ''),
    issued: asInt(j['issued']),
    returned: asInt(j['returned']),
    overdue: asInt(j['overdue']),
  };
}

function parseBooksModalTab(j: Record<string, unknown>): BooksModalTab {
  return { value: String(j['value'] ?? ''), label: String(j['label'] ?? '') };
}

function parseBooksModalActions(j: Record<string, unknown> | undefined): BooksModalActions {
  return {
    searchEndpoint: String(j?.['search_endpoint'] ?? ''),
    categoriesEndpoint: String(j?.['categories_endpoint'] ?? ''),
    submitEndpoint: String(j?.['submit_endpoint'] ?? ''),
  };
}

function parseBooksModalConfig(j: Record<string, unknown>): BooksModalConfig {
  const parseList = <T>(value: unknown, fn: (v: Record<string, unknown>) => T): T[] =>
    Array.isArray(value) ? (value as Record<string, unknown>[]).map(fn) : [];
  return {
    title: String(j['title'] ?? 'Add Book'),
    subtitle: String(j['subtitle'] ?? ''),
    tabs: parseList(j['tabs'], parseBooksModalTab),
    defaultCategories: Array.isArray(j['default_categories'])
      ? (j['default_categories'] as unknown[]).map((e) => String(e))
      : [],
    categories: parseList(j['categories'], parseBookCategory),
    existingBooks: parseList(j['existing_books'], parseBookItem),
    actions: parseBooksModalActions(j['actions'] as Record<string, unknown> | undefined),
  };
}

function parseDashboardActionItem(j: Record<string, unknown>): DashboardActionItem {
  return {
    type: String(j['type'] ?? ''),
    label: String(j['label'] ?? ''),
    method: String(j['method'] ?? ''),
    endpoint: String(j['endpoint'] ?? ''),
    badgeCount: typeof j['badge_count'] === 'number' ? (j['badge_count'] as number) : undefined,
  };
}

function parseDashboardNotificationConfig(j: Record<string, unknown> | undefined): DashboardNotificationConfig {
  return {
    unreadCount: asInt(j?.['unread_count']),
    listEndpoint: String(j?.['list_endpoint'] ?? ''),
    unreadCountEndpoint: String(j?.['unread_count_endpoint'] ?? ''),
    markAllReadEndpoint: String(j?.['mark_all_read_endpoint'] ?? ''),
  };
}

function parseDashboardActionsConfig(raw: unknown): DashboardActionsConfig {
  const j = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const parseItems = (v: unknown): DashboardActionItem[] =>
    Array.isArray(v) ? (v as Record<string, unknown>[]).map(parseDashboardActionItem) : [];
  return {
    searchEndpoint: String(j['search_endpoint'] ?? ''),
    addMenu: parseItems(j['add_menu']),
    topbarButtons: parseItems(j['topbar_buttons']),
    notification: parseDashboardNotificationConfig(j['notification'] as Record<string, unknown> | undefined),
    items: parseItems(j['items']),
  };
}

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Dashboard', 'DashboardRoom', 'DashboardBook'],
  endpoints: (builder) => ({
    getStats: builder.query<DashboardStatsModel, void>({
      queryFn: async (_arg, _api, _extra, baseQuery) => {
        const data = await fetchHomeStats(baseQuery);
        return { data };
      },
    }),
    getStudents: builder.query<StudentModelHome[], { type?: string }>({
      queryFn: ({ type = 'leads' } = {}, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.homeQuickLists },
            { url: '/dashboard/students/', params: { type } },
          ],
          (raw) => parseQuickList(raw, quickListKeys(type))
        ),
    }),
    search: builder.query<SearchModel, string>({
      queryFn: (q, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.studentsSearch, params: { q } },
            { url: '/dashboard/search/', params: { q } },
          ],
          (raw) => parseSearchModel(raw as Record<string, unknown>)
        ),
    }),
    getActions: builder.query<DashboardActionsConfig, void>({
      query: () => ({ url: '/dashboard/actions/' }),
      transformResponse: (raw) => parseDashboardActionsConfig(raw),
    }),
    getTrialLessons: builder.query<StudentModelHome[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.homeQuickLists },
            { url: '/dashboard/trial/' },
          ],
          (raw) => parseQuickList(raw, ['trial_today', 'trial', 'trial_lessons', 'trial_students'], parseStudentFromTrialJson)
        ),
    }),
    getAbsent: builder.query<StudentModelHome[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.homeQuickLists },
            { url: '/dashboard/not-came/' },
          ],
          (raw) => parseQuickList(raw, ['absent_today', 'absent', 'not_came', 'absent_students'], parseStudentFromAbsentJson)
        ),
    }),
    getDebtors: builder.query<StudentModelHome[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.homeQuickLists },
            { url: '/dashboard/debtors/' },
          ],
          (raw) => parseQuickList(raw, ['debtors', 'debtor_students', 'students'], parseStudentFromDebtorJson)
        ),
    }),
    getFinance: builder.query<FinanceModel, void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.homeFinancialPlan },
            { url: ApiPaths.analyticsFinance },
            { url: '/dashboard/finance/' },
          ],
          (raw) => parseFinance(raw as Record<string, unknown>)
        ),
    }),
    getWeekly: builder.query<WeeklyModel[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.homeTrialLessonsWeek },
            { url: '/dashboard/weekly/', params: { tz: 'Asia/Tashkent' } },
          ],
          parseWeeklyFromRaw
        ),
    }),
    getTrialStats: builder.query<TrialStatsModel, void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.homeTrialLessonsWeek },
            { url: '/dashboard/trial/stats/', params: { tz: 'Asia/Tashkent' } },
          ],
          parseTrialStatsFromRaw
        ),
    }),

    getAttendance: builder.query<AttendanceStatModel[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.homeAttendanceStats },
            { url: ApiPaths.analyticsAttendance },
            { url: '/dashboard/attendance/' },
          ],
          (raw) => extractMapList(raw).map(parseAttendanceStat)
        ),
    }),

    getDashboardRooms: builder.query<RoomModel[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsRooms },
            { url: '/dashboard/rooms/' },
          ],
          (raw) => extractMapList(raw).map(parseRoom)
        ),
      providesTags: ['DashboardRoom'],
    }),
    createDashboardRoom: builder.mutation<RoomModel, {
      name: string;
      color: string;
      startTime: string;
      endTime: string;
    }>({
      queryFn: (data, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            {
              url: ApiPaths.analyticsRooms,
              method: 'POST',
              data: {
                name: data.name,
                color: data.color,
                start_time: data.startTime,
                end_time: data.endTime,
              },
            },
            {
              url: '/dashboard/rooms/',
              method: 'POST',
              data: {
                name: data.name,
                color: data.color,
                start_time: data.startTime,
                end_time: data.endTime,
              },
            },
          ],
          (raw) => parseRoom(raw as Record<string, unknown>)
        ),
      invalidatesTags: ['DashboardRoom'],
    }),

    getSalesFunnel: builder.query<SalesFunnelModel, void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsSalesFunnel },
            { url: '/dashboard/sales-funnel/' },
          ],
          (raw) => parseSalesFunnel(raw as Record<string, unknown>)
        ),
    }),

    createDashboardPayment: builder.mutation<void, {
      studentId: number;
      amount: string;
      payWith: string;
      groupId?: string;
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
    }),
    sendReminders: builder.mutation<void, { audience: 'active' | 'new' }>({
      query: (data) => ({
        url: ApiPaths.homeSendReminders,
        method: 'POST',
        data,
      }),
    }),

    getBooksAnalytics: builder.query<BooksAnalyticsModel, void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsOverview },
            { url: '/dashboard/books/analytics/' },
          ],
          (raw) => parseBooksAnalytics(raw as Record<string, unknown>)
        ),
      providesTags: ['DashboardBook'],
    }),
    getBookCategories: builder.query<BookCategoryModel[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsBookCategories },
            { url: '/dashboard/books/categories/' },
          ],
          (raw) => extractMapList(raw).map(parseBookCategory)
        ),
      providesTags: ['DashboardBook'],
    }),
    getBooksModalConfig: builder.query<BooksModalConfig, void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsBooks },
            { url: '/dashboard/books/modal/' },
          ],
          (raw) => parseBooksModalConfig(raw as Record<string, unknown>)
        ),
    }),
    searchBooks: builder.query<BookItemModel[], string>({
      queryFn: (q, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsBooks, params: q.trim() ? { q: q.trim() } : undefined },
            { url: '/dashboard/books/search', params: q.trim() ? { q: q.trim() } : undefined },
          ],
          (raw) => extractMapList(raw).map(parseBookItem)
        ),
    }),
    addBook: builder.mutation<BookItemModel, {
      title: string;
      author: string;
      categoryName: string;
      code?: string;
      salePrice?: string;
      copies?: number;
    }>({
      queryFn: (data, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            {
              url: ApiPaths.analyticsBooks,
              method: 'POST',
              data: {
                title: data.title,
                author: data.author,
                category_name: data.categoryName,
                code: data.code ?? '',
                sale_price: data.salePrice ?? '0.00',
                copies: data.copies ?? 1,
              },
            },
          ],
          (raw) => {
            const response = raw as Record<string, unknown>;
            const book = (response['book'] && typeof response['book'] === 'object'
              ? response['book']
              : response) as Record<string, unknown>;
            return parseBookItem(book);
          }
        ),
      invalidatesTags: ['DashboardBook'],
    }),
    addBookCopies: builder.mutation<BookItemModel, { bookId: number; copies: number }>({
      queryFn: (data, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsBooksAddCopies, method: 'POST', data: { book_id: data.bookId, copies: data.copies } },
            { url: '/dashboard/books/add/', method: 'POST', data: { mode: 'existing', book_id: data.bookId, copies: data.copies } },
          ],
          (raw) => {
            const response = raw as Record<string, unknown>;
            const book = (response['book'] && typeof response['book'] === 'object'
              ? response['book']
              : response) as Record<string, unknown>;
            return parseBookItem(book);
          }
        ),
      invalidatesTags: ['DashboardBook'],
    }),
    createBookCategory: builder.mutation<BookCategoryModel, string>({
      queryFn: (name, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsBookCategories, method: 'POST', data: { name } },
            { url: '/dashboard/books/categories/', method: 'POST', data: { name } },
          ],
          (raw) => parseBookCategory(raw as Record<string, unknown>)
        ),
      invalidatesTags: ['DashboardBook'],
    }),
  }),
});

export const {
  useGetStatsQuery,
  useGetStudentsQuery,
  useSearchQuery,
  useGetActionsQuery,
  useGetTrialLessonsQuery,
  useGetAbsentQuery,
  useGetDebtorsQuery,
  useGetFinanceQuery,
  useGetWeeklyQuery,
  useGetTrialStatsQuery,
  useGetAttendanceQuery,
  useGetDashboardRoomsQuery,
  useCreateDashboardRoomMutation,
  useGetSalesFunnelQuery,
  useCreateDashboardPaymentMutation,
  useSendRemindersMutation,
  useGetBooksAnalyticsQuery,
  useGetBookCategoriesQuery,
  useGetBooksModalConfigQuery,
  useSearchBooksQuery,
  useAddBookMutation,
  useAddBookCopiesMutation,
  useCreateBookCategoryMutation,
} = dashboardApi;
