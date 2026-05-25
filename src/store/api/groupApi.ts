import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import type { GroupModel } from '../../types';

function parseWeekDays(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((e) => {
        if (typeof e === 'object' && e !== null) {
          return (e as Record<string, unknown>)['name']?.toString()
            ?? (e as Record<string, unknown>)['id']?.toString()
            ?? '';
        }
        return String(e);
      })
      .filter((s) => s.length > 0)
      .join(',');
  }
  return String(raw);
}

function parseGroup(j: Record<string, unknown>): GroupModel {
  return {
    id: j['id'] as number | undefined,
    name: j['name'] as string | undefined,
    level: j['level'] as string | undefined,
    levelDisplay: j['level_display'] as string | undefined,
    teacher: j['teacher'] as string | undefined,
    teacherName: j['teacher_name'] as string | undefined,
    weekDays: parseWeekDays(j['week_days']),
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

export const groupApi = createApi({
  reducerPath: 'groupApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Group', 'StudentGroup', 'GroupChoices'],
  endpoints: (builder) => ({
    getGroups: builder.query<GroupModel[], void>({
      query: () => ({ url: '/group/groups-ui/list/' }),
      providesTags: ['Group'],
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseGroup);
      },
    }),
    getGroupById: builder.query<GroupModel, number>({
      query: (id) => ({ url: `/group/groups-ui/${id}/` }),
      providesTags: ['Group'],
      transformResponse: (raw) => parseGroup(raw as Record<string, unknown>),
    }),
    getGroupsByTeacher: builder.query<GroupModel[], string>({
      query: (teacherId) => ({ url: '/group/groups-ui/list/', params: { teacher: teacherId } }),
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseGroup);
      },
    }),
    getGroupStudents: builder.query<Record<string, unknown>[], number>({
      query: (groupId) => ({ url: '/group/student-groups/', params: { group: groupId } }),
      providesTags: ['StudentGroup'],
      transformResponse: (raw) => {
        const data = raw as unknown;
        if (Array.isArray(data)) return data as Record<string, unknown>[];
        const m = data as Record<string, unknown>;
        return (m['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    getGroupAttendance: builder.query<Record<string, unknown>[], number>({
      query: (groupId) => ({ url: '/group/student-groups/', params: { group: groupId } }),
      transformResponse: (raw) => {
        const data = raw as unknown;
        if (Array.isArray(data)) return data as Record<string, unknown>[];
        const m = data as Record<string, unknown>;
        return (m['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    createGroup: builder.mutation<void, {
      name: string;
      level: string;
      teacher: string;
      room?: number;
      weekDays: number[];
      price: string;
      startDate: string;
      endDate: string;
      startTime: string;
      endTime: string;
      isActive: boolean;
      teacherFixedSalary: string;
    }>({
      query: (data) => {
        const body: Record<string, unknown> = {
          name: data.name,
          level: data.level,
          teacher: data.teacher,
          price: data.price,
          start_time: data.startTime,
          end_time: data.endTime,
          is_active: data.isActive,
          week_days: data.weekDays,
        };
        if (data.room && data.room > 0) body['room'] = data.room;
        if (data.startDate) body['start_date'] = data.startDate;
        if (data.endDate) body['end_date'] = data.endDate;
        const salaryVal = parseFloat(data.teacherFixedSalary) || 0;
        if (salaryVal > 0) body['teacher_fixed_salary'] = data.teacherFixedSalary;
        return { url: '/group/groups-ui/create/', method: 'POST', data: body };
      },
      invalidatesTags: ['Group'],
    }),
    updateGroup: builder.mutation<void, {
      id: number;
      name: string;
      level: string;
      teacher: string;
      room?: number;
      weekDays: number[];
      price: string;
      startDate: string;
      endDate: string;
      startTime: string;
      endTime: string;
      isActive: boolean;
      teacherFixedSalary: string;
    }>({
      query: (data) => {
        const body: Record<string, unknown> = {
          name: data.name,
          level: data.level,
          teacher: data.teacher,
          price: data.price,
          start_time: data.startTime,
          end_time: data.endTime,
          is_active: data.isActive,
          week_days: data.weekDays,
        };
        if (data.room && data.room > 0) body['room'] = data.room;
        if (data.startDate) body['start_date'] = data.startDate;
        if (data.endDate) body['end_date'] = data.endDate;
        const salaryVal = parseFloat(data.teacherFixedSalary) || 0;
        if (salaryVal > 0) body['teacher_fixed_salary'] = data.teacherFixedSalary;
        return { url: `/group/groups-ui/${data.id}/update/`, method: 'PATCH', data: body };
      },
      invalidatesTags: ['Group'],
    }),
    deleteGroup: builder.mutation<void, number>({
      query: (id) => ({ url: `/group/groups-ui/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['Group'],
    }),
    getGroupCreateFormOptions: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: '/group/groups-ui/create-form-options/' }),
      providesTags: ['GroupChoices'],
    }),
    getGroupWeekdays: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: '/group/groups-ui/choices/weekdays/' }),
      providesTags: ['GroupChoices'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    getGroupCourses: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: '/group/groups-ui/choices/courses/' }),
      providesTags: ['GroupChoices'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    getGroupLevels: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: '/group/groups-ui/choices/levels/' }),
      providesTags: ['GroupChoices'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    getGroupRooms: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: '/group/groups-ui/choices/rooms/' }),
      providesTags: ['GroupChoices'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    getGroupTeacherSalaryTypes: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: '/group/groups-ui/choices/teacher-salary-types/' }),
      providesTags: ['GroupChoices'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    getGroupTeachers: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: '/group/groups-ui/choices/teachers/' }),
      providesTags: ['GroupChoices'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
  }),
});

export const {
  useGetGroupsQuery,
  useGetGroupByIdQuery,
  useGetGroupsByTeacherQuery,
  useGetGroupStudentsQuery,
  useGetGroupAttendanceQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useGetGroupCreateFormOptionsQuery,
  useGetGroupWeekdaysQuery,
  useGetGroupCoursesQuery,
  useGetGroupLevelsQuery,
  useGetGroupRoomsQuery,
  useGetGroupTeacherSalaryTypesQuery,
  useGetGroupTeachersQuery,
} = groupApi;
