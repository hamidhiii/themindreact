import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import type {
  MainDashboardStatsModel,
  SalesFunnelModel,
  FinanceAnalyticsModel,
  IncomeSeriesPoint,
  RoomModel,
  RoomScheduleResponse,
  RoomScheduleRoomModel,
  RoomGroupModel,
  AttendanceEntity,
  BooksAnalyticsModel,
  BookItemModel,
} from '../../types';

function parseMainStats(j: Record<string, unknown>): MainDashboardStatsModel {
  return {
    leads: Number(j['leads'] ?? 0),
    students: Number(j['students'] ?? 0),
    trial: Number(j['trial'] ?? 0),
    debtors: Number(j['debtors'] ?? 0),
    groups: Number(j['groups'] ?? 0),
    books: Number(j['books'] ?? 0),
  };
}

function parseSalesFunnel(j: Record<string, unknown>): SalesFunnelModel {
  return {
    requests: Number(j['requests'] ?? 0),
    trialArrived: Number(j['trial_arrived'] ?? 0),
    trialLeft: Number(j['trial_left'] ?? 0),
    paid: Number(j['paid'] ?? 0),
    conversion: Number(j['conversion'] ?? 0),
  };
}

function parseIncomeSeriesPoint(j: Record<string, unknown>): IncomeSeriesPoint {
  return {
    label: (j['label'] ?? j['month'] ?? j['date'] ?? '') as string,
    value: Number(j['value'] ?? j['amount'] ?? 0),
  };
}

function parseFinanceAnalytics(j: Record<string, unknown>): FinanceAnalyticsModel {
  const total = Number(j['total'] ?? 0);
  const cash = Number(j['cash'] ?? 0);
  const card = Number(j['card'] ?? 0);
  const online = Number(j['online'] ?? 0);
  const yearSeriesRaw = Array.isArray(j['year_series']) ? (j['year_series'] as Record<string, unknown>[]) : [];
  const monthSeriesRaw = Array.isArray(j['month_series']) ? (j['month_series'] as Record<string, unknown>[]) : [];
  return {
    studentNew: Number(j['student_new'] ?? j['new_students'] ?? 0),
    studentExisting: Number(j['student_existing'] ?? j['existing_students'] ?? 0),
    cash,
    card,
    online,
    total,
    cashPercent: total > 0 ? cash / total : 0,
    cardPercent: total > 0 ? card / total : 0,
    onlinePercent: total > 0 ? online / total : 0,
    yearSeries: yearSeriesRaw.map(parseIncomeSeriesPoint),
    monthSeries: monthSeriesRaw.map(parseIncomeSeriesPoint),
    incomeYear: Number(j['income_year'] ?? 0),
    incomeMonth: Number(j['income_month'] ?? 0),
  };
}

function parseRoom(j: Record<string, unknown>): RoomModel {
  return {
    id: Number(j['id'] ?? 0),
    name: String(j['name'] ?? j['room_name'] ?? ''),
    capacity: j['capacity'] as number | undefined,
    color: j['color'] as string | undefined,
    startTime: j['start_time'] as string | undefined,
    endTime: j['end_time'] as string | undefined,
  };
}

function parseRoomGroupModel(j: Record<string, unknown>): RoomGroupModel {
  return {
    groupName: (j['group_name'] ?? j['name'] ?? '') as string,
    teacher: (j['teacher'] ?? j['teacher_name'] ?? '') as string,
    startTime: (j['start_time'] ?? '') as string,
    endTime: (j['end_time'] ?? '') as string,
  };
}

function parseRoomScheduleRoom(j: Record<string, unknown>): RoomScheduleRoomModel {
  const groupsRaw = Array.isArray(j['groups']) ? (j['groups'] as Record<string, unknown>[]) : [];
  return {
    roomName: (j['room_name'] ?? j['name'] ?? '') as string,
    colorHex: j['color_hex'] as string | undefined,
    groups: groupsRaw.map(parseRoomGroupModel),
  };
}

function parseRoomSchedule(raw: unknown): RoomScheduleResponse {
  const j = raw as Record<string, unknown>;
  if (Array.isArray(j['rooms'])) {
    return { rooms: (j['rooms'] as Record<string, unknown>[]).map(parseRoomScheduleRoom) };
  }
  if (Array.isArray(raw)) {
    return { rooms: (raw as Record<string, unknown>[]).map(parseRoomScheduleRoom) };
  }
  return { rooms: [] };
}

function parseAttendance(j: Record<string, unknown>): AttendanceEntity {
  return {
    date: new Date((j['date'] ?? '') as string),
    attended: Number(j['attended'] ?? 0),
    absent: Number(j['absent'] ?? 0),
  };
}

function parseBooksAnalytics(j: Record<string, unknown>): BooksAnalyticsModel {
  return {
    title: (j['title'] ?? 'Books') as string,
    subtitle: (j['subtitle'] ?? '') as string,
    totalBooks: Number(j['total_books'] ?? 0),
    issuedBooks: Number(j['issued_books'] ?? 0),
    returnedBooks: Number(j['returned_books'] ?? 0),
    overdueBooks: Number(j['overdue_books'] ?? 0),
    cards: [],
    addBookAction: { label: '', endpoint: '', method: '' },
  };
}

function parseBookItem(j: Record<string, unknown>): BookItemModel {
  return {
    id: Number(j['id'] ?? 0),
    title: (j['title'] ?? '') as string,
    author: String(j['author'] ?? ''),
    categoryId: typeof j['category_id'] === 'number' ? (j['category_id'] as number) : undefined,
    category: (j['category'] ?? '') as string,
    copies: Number(j['copies'] ?? j['total'] ?? 0),
    salePrice: String(j['sale_price'] ?? '0.00'),
    code: String(j['code'] ?? ''),
    issued: Number(j['issued'] ?? 0),
    returned: Number(j['returned'] ?? 0),
    overdue: Number(j['overdue'] ?? 0),
  };
}

export const mainTheMindApi = createApi({
  reducerPath: 'mainTheMindApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['MainStats', 'Room', 'Book'],
  endpoints: (builder) => ({
    getMainStats: builder.query<MainDashboardStatsModel, void>({
      query: () => ({ url: '/dashboard/stats/' }),
      providesTags: ['MainStats'],
      transformResponse: (raw) => parseMainStats(raw as Record<string, unknown>),
    }),
    getSalesFunnel: builder.query<SalesFunnelModel, void>({
      query: () => ({ url: '/dashboard/sales-funnel/' }),
      transformResponse: (raw) => parseSalesFunnel(raw as Record<string, unknown>),
    }),
    getFinanceAnalytics: builder.query<FinanceAnalyticsModel, void>({
      query: () => ({ url: '/dashboard/finance/' }),
      transformResponse: (raw) => parseFinanceAnalytics(raw as Record<string, unknown>),
    }),
    getRooms: builder.query<RoomModel[], void>({
      query: () => ({ url: '/group/rooms/' }),
      providesTags: ['Room'],
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseRoom);
      },
    }),
    createRoom: builder.mutation<RoomModel, { name: string; capacity?: number; color?: string; start_time?: string; end_time?: string }>({
      query: (data) => ({
        url: '/group/rooms/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Room'],
      transformResponse: (raw) => parseRoom(raw as Record<string, unknown>),
    }),
    getRoomSchedule: builder.query<RoomScheduleResponse, string | void>({
      query: (date) => ({
        url: '/dashboard/rooms/',
        params: date ? { date } : undefined,
      }),
      transformResponse: (raw) => parseRoomSchedule(raw),
    }),
    getAttendanceLast30Days: builder.query<AttendanceEntity[], void>({
      query: () => ({ url: '/dashboard/attendance/' }),
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseAttendance);
      },
    }),
    getBooksAnalytics: builder.query<BooksAnalyticsModel, void>({
      query: () => ({ url: '/dashboard/books/analytics/' }),
      transformResponse: (raw) => parseBooksAnalytics(raw as Record<string, unknown>),
    }),
    getBooks: builder.query<BookItemModel[], void>({
      query: () => ({ url: '/student/books/' }),
      providesTags: ['Book'],
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseBookItem);
      },
    }),
    addBook: builder.mutation<BookItemModel, { title: string; category: string; total: number }>({
      query: (data) => ({
        url: '/student/books/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Book'],
      transformResponse: (raw) => parseBookItem(raw as Record<string, unknown>),
    }),
  }),
});

export const {
  useGetMainStatsQuery,
  useGetSalesFunnelQuery,
  useGetFinanceAnalyticsQuery,
  useGetRoomsQuery,
  useCreateRoomMutation,
  useGetRoomScheduleQuery,
  useGetAttendanceLast30DaysQuery,
  useGetBooksAnalyticsQuery,
  useGetBooksQuery,
  useAddBookMutation,
} = mainTheMindApi;
