import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import type {
  TeacherModel,
  TeacherDashboardModel,
  TeacherGroupItemModel,
  TodayLessonModel,
  TeacherHistorySummary,
  TeacherHistoryItem,
  TeacherFinancialModel,
  GroupModel,
} from '../../types';

function parseTeacher(j: Record<string, unknown>): TeacherModel {
  return {
    id: String(j['id'] ?? ''),
    fullName: String(j['full_name'] ?? j['name'] ?? ''),
    username: (j['username'] ?? '') as string,
    phoneNumber: (j['phone_number'] ?? '') as string,
    isActive: (j['is_active'] ?? true) as boolean,
    isSupport: (j['is_support'] ?? false) as boolean,
    experienceYear: Number(j['experience_year'] ?? 0),
    education: (j['education'] ?? '') as string,
    createdAt: (j['created_at'] ?? '') as string,
  };
}

function parseTeacherGroupItem(j: Record<string, unknown>): TeacherGroupItemModel {
  return {
    id: Number(j['id'] ?? 0),
    name: (j['name'] ?? '') as string,
    studentCount: Number(j['student_count'] ?? 0),
  };
}

function parseTodayLesson(j: Record<string, unknown>): TodayLessonModel {
  return {
    id: j['id'] as number | undefined,
    time: (j['time'] ?? '') as string,
    name: (j['name'] ?? '') as string,
    subtitle: (j['subtitle'] ?? '') as string,
    type: (j['type'] ?? '') as string,
    status: (j['status'] ?? '') as string,
    isGroup: (j['is_group'] ?? false) as boolean,
  };
}

function parseTeacherHistorySummary(j: Record<string, unknown>): TeacherHistorySummary {
  return {
    totalLessons: Number(j['total_lessons'] ?? 0),
    ownLessons: Number(j['own_lessons'] ?? 0),
    substituteLessons: Number(j['substitute_lessons'] ?? 0),
    totalAmount: String(j['total_amount'] ?? '0'),
  };
}

function parseTeacherHistoryItem(j: Record<string, unknown>): TeacherHistoryItem {
  return {
    journalId: j['journal_id'] as number | undefined,
    lessonId: j['lesson_id'] as number | undefined,
    lessonDate: (j['lesson_date'] ?? '') as string,
    groupId: Number(j['group_id'] ?? 0),
    groupName: (j['group_name'] ?? '') as string,
    studentCount: Number(j['student_count'] ?? 0),
    salaryType: (j['salary_type'] ?? '') as string,
    salaryValue: Number(j['salary_value'] ?? 0),
    lessonAmount: Number(j['lesson_amount'] ?? 0),
    isSubstitute: (j['is_substitute'] ?? false) as boolean,
  };
}

function parseTeacherDashboard(j: Record<string, unknown>): TeacherDashboardModel {
  const groupsRaw = Array.isArray(j['groups']) ? (j['groups'] as Record<string, unknown>[]) : [];
  const todayRaw = Array.isArray(j['today_lessons']) ? (j['today_lessons'] as Record<string, unknown>[]) : [];
  const historyRaw = Array.isArray(j['history']) ? (j['history'] as Record<string, unknown>[]) : [];
  const summaryRaw = j['history_summary'] as Record<string, unknown> | undefined;

  return {
    balance: String(j['balance'] ?? '0'),
    fine: String(j['fine'] ?? '0'),
    fineReason: j['fine_reason'] as string | undefined,
    lessonsThisMonth: Number(j['lessons_this_month'] ?? 0),
    studentsCount: Number(j['students_count'] ?? 0),
    groups: groupsRaw.map(parseTeacherGroupItem),
    todayLessons: todayRaw.map(parseTodayLesson),
    historySummary: summaryRaw ? parseTeacherHistorySummary(summaryRaw) : undefined,
    history: historyRaw.map(parseTeacherHistoryItem),
  };
}

function parseTeacherFinancial(j: Record<string, unknown>): TeacherFinancialModel {
  return {
    teacherName: (j['teacher_name'] ?? j['full_name'] ?? '') as string,
    studentsCount: Number(j['students_count'] ?? 0),
    income: Number(j['income'] ?? 0),
    salary: Number(j['salary'] ?? 0),
    profit: Number(j['profit'] ?? 0),
  };
}

function parseGroup(j: Record<string, unknown>): GroupModel {
  return {
    id: j['id'] as number | undefined,
    name: j['name'] as string | undefined,
    level: j['level'] as string | undefined,
    levelDisplay: j['level_display'] as string | undefined,
    teacher: j['teacher'] as string | undefined,
    teacherName: j['teacher_name'] as string | undefined,
    studentCount: j['student_count'] as number | undefined,
    room: j['room'] as number | undefined,
    roomName: j['room_name'] as string | undefined,
    price: j['price']?.toString(),
    startDate: j['start_date'] as string | undefined,
    endDate: j['end_date'] as string | undefined,
    startTime: j['start_time'] as string | undefined,
    endTime: j['end_time'] as string | undefined,
    isActive: j['is_active'] as boolean | undefined,
    createdAt: j['created_at'] as string | undefined,
    teacherFixedSalary: j['teacher_fixed_salary']?.toString(),
  };
}

export const teacherApi = createApi({
  reducerPath: 'teacherApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Teacher'],
  endpoints: (builder) => ({
    getTeacherChoices: builder.query<TeacherModel[], void>({
      query: () => ({ url: '/teacher/choices/' }),
      providesTags: ['Teacher'],
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseTeacher);
      },
    }),
    getTeachers: builder.query<TeacherModel[], void>({
      query: () => ({ url: '/teacher/teachers/' }),
      providesTags: ['Teacher'],
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseTeacher);
      },
    }),
    getTeacherDetail: builder.query<TeacherDashboardModel, string>({
      query: (id) => ({ url: `/teacher/teachers/${id}/detail/` }),
      transformResponse: (raw) => parseTeacherDashboard(raw as Record<string, unknown>),
    }),
    getTeacherHistory: builder.query<Record<string, unknown>[], string>({
      query: (id) => ({ url: `/teacher/teachers/${id}/detail/history/` }),
      transformResponse: (raw) => {
        const data = raw as unknown;
        if (Array.isArray(data)) return data as Record<string, unknown>[];
        return ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    getTeacherTodayLessons: builder.query<TodayLessonModel[], string>({
      query: (id) => ({ url: `/teacher/teachers/${id}/detail/today-lessons/` }),
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseTodayLesson);
      },
    }),
    getTeacherDashboard: builder.query<TeacherDashboardModel, void>({
      query: () => ({ url: '/teacher/dashboard/' }),
      transformResponse: (raw) => parseTeacherDashboard(raw as Record<string, unknown>),
    }),
    getTeacherGroups: builder.query<GroupModel[], string>({
      query: (teacherId) => ({ url: '/group/groups/', params: { teacher: teacherId } }),
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseGroup);
      },
    }),
    getTeacherFinancial: builder.query<TeacherFinancialModel, string>({
      query: (id) => ({ url: `/teacher/teachers/${id}/financial` }),
      transformResponse: (raw) => parseTeacherFinancial(raw as Record<string, unknown>),
    }),
    updateTeacherStatus: builder.mutation<void, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/teacher/teachers/${id}/`,
        method: 'PATCH',
        data: { is_active: isActive },
      }),
      invalidatesTags: ['Teacher'],
    }),
    deleteTeacher: builder.mutation<void, string>({
      query: (id) => ({ url: `/teacher/teachers/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Teacher'],
    }),
    getGroupJournal: builder.query<Record<string, unknown>, { groupId: number; lessonDate?: string; teacherId?: string }>({
      query: ({ groupId, lessonDate, teacherId }) => ({
        url: `/teacher/groups/${groupId}/journal/`,
        params: {
          ...(lessonDate ? { lesson_date: lessonDate } : {}),
          ...(teacherId ? { teacher_id: teacherId } : {}),
        },
      }),
    }),
    saveJournal: builder.mutation<void, { groupId: number; lessonDate: string; teacherId: string; students: unknown[] }>({
      query: ({ groupId, lessonDate, teacherId, students }) => ({
        url: `/teacher/groups/${groupId}/journal/save/`,
        method: 'POST',
        data: { lesson_date: lessonDate, teacher_id: teacherId, students },
      }),
    }),
  }),
});

export const {
  useGetTeacherChoicesQuery,
  useGetTeachersQuery,
  useGetTeacherDetailQuery,
  useGetTeacherHistoryQuery,
  useGetTeacherTodayLessonsQuery,
  useGetTeacherDashboardQuery,
  useGetTeacherGroupsQuery,
  useGetTeacherFinancialQuery,
  useUpdateTeacherStatusMutation,
  useDeleteTeacherMutation,
  useGetGroupJournalQuery,
  useSaveJournalMutation,
} = teacherApi;
