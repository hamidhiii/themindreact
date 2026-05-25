import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
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
      leadsCameCount: (j['leads_came_count'] ?? 0) as number,
      trialDoneCount: (j['trial_done_count'] ?? 0) as number,
      leadsStatusCount: (j['leads_status_count'] ?? 0) as number,
      trialsCount: (j['trials_count'] ?? 0) as number,
      lessonCount: (j['lesson_count'] ?? 0) as number,
      leadStatus: (j['lead_status'] ?? '') as string,
    };
  });
}

function parseTrialStats(j: Record<string, unknown>): TrialStatsModel {
  const weeklyList = Array.isArray(j['weekly']) ? parseWeekly(j['weekly'] as unknown[]) : [];
  return {
    title: (j['title'] ?? 'Trial Lessons') as string,
    subtitle: (j['subtitle'] ?? '') as string,
    enrolled: (j['enrolled'] ?? 0) as number,
    coming: (j['coming'] ?? 0) as number,
    arrived: (j['arrived'] ?? 0) as number,
    total: (j['total'] ?? 0) as number,
    leads: (j['leads'] ?? 0) as number,
    waiting: (j['waiting'] ?? 0) as number,
    came: (j['came'] ?? 0) as number,
    notCame: (j['not_came'] ?? 0) as number,
    weekly: weeklyList,
  };
}

function parseStats(j: Record<string, unknown>): DashboardStatsModel {
  return {
    leads: (j['leads'] ?? 0) as number,
    students: (j['students'] ?? 0) as number,
    waiting: (j['waiting'] ?? 0) as number,
    newStudents: (j['new_students'] ?? 0) as number,
  };
}

function parseFinance(j: Record<string, unknown>): FinanceModel {
  return {
    expected: Number(j['expected_amount'] ?? 0),
    paid: Number(j['received'] ?? 0),
    remaining: Number(j['remaining_amount'] ?? 0),
    progress: (j['collection_progress'] ?? 0) as number,
  };
}

function parseStudentFromJson(j: Record<string, unknown>): StudentModelHome {
  return {
    id: (j['id'] ?? -1) as number,
    name: (j['name'] ?? '') as string,
    phone: (j['phone'] ?? '') as string,
    group: (j['group'] ?? '') as string,
    teacher: (j['teacher'] ?? '') as string,
    balance: String(j['balance'] ?? '0'),
    status: (j['status'] ?? '') as string,
    called: (j['called'] ?? false) as boolean,
    missedLessons: (j['missed_lessons'] ?? 0) as number,
  };
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
      query: () => ({ url: '/dashboard/stats/' }),
      transformResponse: (raw) => parseStats(raw as Record<string, unknown>),
    }),
    getStudents: builder.query<StudentModelHome[], { type?: string }>({
      query: ({ type = 'leads' } = {}) => ({
        url: '/dashboard/students/',
        params: { type },
      }),
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseStudentFromJson);
      },
    }),
    search: builder.query<SearchModel, string>({
      query: (q) => ({ url: '/dashboard/search/', params: { q } }),
      transformResponse: (raw) => parseSearchModel(raw as Record<string, unknown>),
    }),
    getActions: builder.query<DashboardActionsConfig, void>({
      query: () => ({ url: '/dashboard/actions/' }),
      transformResponse: (raw) => parseDashboardActionsConfig(raw),
    }),
    getTrialLessons: builder.query<StudentModelHome[], void>({
      query: () => ({ url: '/dashboard/trial/' }),
      transformResponse: (raw) => {
        const list = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
        return list.map(parseStudentFromTrialJson);
      },
    }),
    getAbsent: builder.query<StudentModelHome[], void>({
      query: () => ({ url: '/dashboard/not-came/' }),
      transformResponse: (raw) => {
        const list = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
        return list.map(parseStudentFromAbsentJson);
      },
    }),
    getDebtors: builder.query<StudentModelHome[], void>({
      query: () => ({ url: '/dashboard/debtors/' }),
      transformResponse: (raw) => {
        const data = raw as Record<string, unknown>;
        const list = Array.isArray(raw)
          ? (raw as Record<string, unknown>[])
          : ((data['students'] as Record<string, unknown>[]) ?? []);
        return list.map(parseStudentFromDebtorJson);
      },
    }),
    getFinance: builder.query<FinanceModel, void>({
      query: () => ({ url: '/dashboard/finance/' }),
      transformResponse: (raw) => parseFinance(raw as Record<string, unknown>),
    }),
    getWeekly: builder.query<WeeklyModel[], void>({
      query: () => ({ url: '/dashboard/weekly/', params: { tz: 'Asia/Tashkent' } }),
      transformResponse: (raw) => {
        if (!Array.isArray(raw)) return [];
        return parseWeekly(raw as unknown[]);
      },
    }),
    getTrialStats: builder.query<TrialStatsModel, void>({
      query: () => ({ url: '/dashboard/trial/stats/', params: { tz: 'Asia/Tashkent' } }),
      transformResponse: (raw) => parseTrialStats(raw as Record<string, unknown>),
    }),

    getAttendance: builder.query<AttendanceStatModel[], void>({
      query: () => ({ url: '/dashboard/attendance/' }),
      transformResponse: (raw) => {
        if (!Array.isArray(raw)) return [];
        return (raw as Record<string, unknown>[]).map(parseAttendanceStat);
      },
    }),

    getDashboardRooms: builder.query<RoomModel[], void>({
      query: () => ({ url: '/dashboard/rooms/' }),
      providesTags: ['DashboardRoom'],
      transformResponse: (raw) => {
        const data = raw as Record<string, unknown>;
        const list = Array.isArray(raw)
          ? (raw as Record<string, unknown>[])
          : ((data['rooms'] as Record<string, unknown>[]) ?? []);
        return list.map(parseRoom);
      },
    }),
    createDashboardRoom: builder.mutation<RoomModel, {
      name: string;
      color: string;
      startTime: string;
      endTime: string;
    }>({
      query: (data) => ({
        url: '/dashboard/rooms/',
        method: 'POST',
        data: {
          name: data.name,
          color: data.color,
          start_time: data.startTime,
          end_time: data.endTime,
        },
      }),
      invalidatesTags: ['DashboardRoom'],
      transformResponse: (raw) => parseRoom(raw as Record<string, unknown>),
    }),

    getSalesFunnel: builder.query<SalesFunnelModel, void>({
      query: () => ({ url: '/dashboard/sales-funnel/' }),
      transformResponse: (raw) => parseSalesFunnel(raw as Record<string, unknown>),
    }),

    createDashboardPayment: builder.mutation<void, {
      studentId: number;
      amount: string;
      payWith: string;
      groupId?: string;
    }>({
      query: (data) => ({
        url: '/dashboard/payment/create/',
        method: 'POST',
        data: {
          student_id: data.studentId,
          amount: data.amount,
          pay_with: data.payWith,
          group_id: data.groupId ?? null,
        },
      }),
    }),

    getBooksAnalytics: builder.query<BooksAnalyticsModel, void>({
      query: () => ({ url: '/dashboard/books/analytics/' }),
      providesTags: ['DashboardBook'],
      transformResponse: (raw) => parseBooksAnalytics(raw as Record<string, unknown>),
    }),
    getBookCategories: builder.query<BookCategoryModel[], void>({
      query: () => ({ url: '/dashboard/books/categories/' }),
      providesTags: ['DashboardBook'],
      transformResponse: (raw) => {
        if (!Array.isArray(raw)) return [];
        return (raw as Record<string, unknown>[]).map(parseBookCategory);
      },
    }),
    getBooksModalConfig: builder.query<BooksModalConfig, void>({
      query: () => ({ url: '/dashboard/books/modal/' }),
      transformResponse: (raw) => parseBooksModalConfig(raw as Record<string, unknown>),
    }),
    searchBooks: builder.query<BookItemModel[], string>({
      query: (q) => ({
        url: '/dashboard/books/search',
        params: q.trim() ? { q: q.trim() } : undefined,
      }),
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseBookItem);
      },
    }),
    addBook: builder.mutation<BookItemModel, {
      title: string;
      author: string;
      categoryName: string;
      code?: string;
      salePrice?: string;
      copies?: number;
    }>({
      query: (data) => ({
        url: '/dashboard/books/add/',
        method: 'POST',
        data: {
          mode: 'new',
          title: data.title,
          author: data.author,
          category_name: data.categoryName,
          code: data.code ?? '',
          sale_price: data.salePrice ?? '0.00',
          copies: data.copies ?? 1,
        },
      }),
      invalidatesTags: ['DashboardBook'],
      transformResponse: (raw) => {
        const data = raw as Record<string, unknown>;
        const book = (data['book'] && typeof data['book'] === 'object'
          ? data['book']
          : data) as Record<string, unknown>;
        return parseBookItem(book);
      },
    }),
    addBookCopies: builder.mutation<BookItemModel, { bookId: number; copies: number }>({
      query: (data) => ({
        url: '/dashboard/books/add/',
        method: 'POST',
        data: { mode: 'existing', book_id: data.bookId, copies: data.copies },
      }),
      invalidatesTags: ['DashboardBook'],
      transformResponse: (raw) => {
        const data = raw as Record<string, unknown>;
        const book = (data['book'] && typeof data['book'] === 'object'
          ? data['book']
          : data) as Record<string, unknown>;
        return parseBookItem(book);
      },
    }),
    createBookCategory: builder.mutation<BookCategoryModel, string>({
      query: (name) => ({
        url: '/dashboard/books/categories/',
        method: 'POST',
        data: { name },
      }),
      invalidatesTags: ['DashboardBook'],
      transformResponse: (raw) => parseBookCategory(raw as Record<string, unknown>),
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
  useGetBooksAnalyticsQuery,
  useGetBookCategoriesQuery,
  useGetBooksModalConfigQuery,
  useSearchBooksQuery,
  useAddBookMutation,
  useAddBookCopiesMutation,
  useCreateBookCategoryMutation,
} = dashboardApi;
