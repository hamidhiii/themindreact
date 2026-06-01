import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import { ApiPaths } from '../../api/apiPaths';
import { dataWithFallbacks, extractMapList, unwrapDataMap, unwrapEntity } from '../../api/apiResponse';
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
  const map = unwrapDataMap(j);
  const nested = map['overview'] ?? map['stats'] ?? map['summary'];
  const source = nested && typeof nested === 'object' && !Array.isArray(nested)
    ? nested as Record<string, unknown>
    : map;
  return {
    leads: Number(source['leads'] ?? source['total_leads'] ?? 0),
    students: Number(source['students'] ?? source['active_students'] ?? source['total_students'] ?? 0),
    trial: Number(source['trial'] ?? source['trial_lessons'] ?? source['trials'] ?? 0),
    debtors: Number(source['debtors'] ?? source['debtor_students'] ?? 0),
    groups: Number(source['groups'] ?? source['total_groups'] ?? 0),
    books: Number(source['books'] ?? source['total_books'] ?? 0),
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
  const source = unwrapDataMap(j);
  const total = Number(source['total'] ?? source['income'] ?? 0);
  const cash = Number(source['cash'] ?? source['cash_total'] ?? 0);
  const card = Number(source['card'] ?? source['card_total'] ?? 0);
  const online = Number(source['online'] ?? source['online_total'] ?? 0);
  const yearSeriesRaw = Array.isArray(source['year_series']) ? (source['year_series'] as Record<string, unknown>[]) : [];
  const monthSeriesRaw = Array.isArray(source['month_series']) ? (source['month_series'] as Record<string, unknown>[]) : [];
  return {
    studentNew: Number(source['student_new'] ?? source['new_students'] ?? 0),
    studentExisting: Number(source['student_existing'] ?? source['existing_students'] ?? 0),
    cash,
    card,
    online,
    total,
    cashPercent: total > 0 ? cash / total : 0,
    cardPercent: total > 0 ? card / total : 0,
    onlinePercent: total > 0 ? online / total : 0,
    yearSeries: yearSeriesRaw.map(parseIncomeSeriesPoint),
    monthSeries: monthSeriesRaw.map(parseIncomeSeriesPoint),
    incomeYear: Number(source['income_year'] ?? 0),
    incomeMonth: Number(source['income_month'] ?? 0),
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
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsOverview },
            { url: '/dashboard/stats/' },
          ],
          (raw) => parseMainStats(raw as Record<string, unknown>)
        ),
      providesTags: ['MainStats'],
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
    getFinanceAnalytics: builder.query<FinanceAnalyticsModel, void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsFinance },
            { url: '/dashboard/finance/' },
          ],
          (raw) => parseFinanceAnalytics(raw as Record<string, unknown>)
        ),
    }),
    getRooms: builder.query<RoomModel[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsRooms },
            { url: '/group/rooms/' },
          ],
          (raw) => extractMapList(raw).map(parseRoom)
        ),
      providesTags: ['Room'],
    }),
    createRoom: builder.mutation<RoomModel, { name: string; capacity?: number; color?: string; start_time?: string; end_time?: string }>({
      queryFn: (data, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsRooms, method: 'POST', data },
            { url: '/group/rooms/', method: 'POST', data },
          ],
          (raw) => parseRoom(raw as Record<string, unknown>)
        ),
      invalidatesTags: ['Room'],
    }),
    getRoomSchedule: builder.query<RoomScheduleResponse, string | void>({
      queryFn: (date, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsRoomSchedule, params: date ? { date } : undefined },
            { url: '/dashboard/rooms/', params: date ? { date } : undefined },
          ],
          parseRoomSchedule
        ),
    }),
    getAttendanceLast30Days: builder.query<AttendanceEntity[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsAttendance },
            { url: '/dashboard/attendance/' },
          ],
          (raw) => extractMapList(raw).map(parseAttendance)
        ),
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
    }),
    getBooks: builder.query<BookItemModel[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.analyticsBooks },
            { url: '/student/books/' },
          ],
          (raw) => extractMapList(raw).map(parseBookItem)
        ),
      providesTags: ['Book'],
    }),
    addBook: builder.mutation<BookItemModel, { title: string; category: string; total: number; author?: string }>({
      queryFn: (data, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            {
              url: ApiPaths.analyticsBooks,
              method: 'POST',
              data: {
                title: data.title,
                author: data.author ?? '',
                category_name: data.category,
                copies: data.total,
              },
            },
          ],
          (raw) => parseBookItem(unwrapEntity(raw, ['book', 'item', 'result']) as Record<string, unknown>)
        ),
      invalidatesTags: ['Book'],
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
