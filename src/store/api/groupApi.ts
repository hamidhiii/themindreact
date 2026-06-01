import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import { ApiPaths } from '../../api/apiPaths';
import { dataWithFallbacks, extractMapList } from '../../api/apiResponse';
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
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.group },
            { url: '/group/groups-ui/list/' },
          ],
          (raw) => extractMapList(raw).map(parseGroup)
        ),
      providesTags: ['Group'],
    }),
    getGroupById: builder.query<GroupModel, number>({
      queryFn: (id, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.groupId(id) },
            { url: `/group/groups-ui/${id}/` },
          ],
          (raw) => parseGroup(raw as Record<string, unknown>)
        ),
      providesTags: ['Group'],
    }),
    getGroupsByTeacher: builder.query<GroupModel[], string>({
      queryFn: (teacherId, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.group, params: { teacher: teacherId } },
            { url: '/group/groups-ui/list/', params: { teacher: teacherId } },
          ],
          (raw) => extractMapList(raw).map(parseGroup)
        ),
    }),
    getGroupStudents: builder.query<Record<string, unknown>[], number>({
      queryFn: (groupId, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.groupStudents(groupId) },
            { url: '/group/student-groups/', params: { group: groupId } },
          ],
          extractMapList
        ),
      providesTags: ['StudentGroup'],
    }),
    getGroupAttendance: builder.query<Record<string, unknown>[], number>({
      queryFn: (groupId, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.groupStudents(groupId) },
            { url: '/group/student-groups/', params: { group: groupId } },
          ],
          extractMapList
        ),
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
      queryFn: (data, _api, _extra, baseQuery) => {
        const teacherId = Number(data.teacher);
        const body: Record<string, unknown> = {
          name: data.name,
          level: data.level,
          price: data.price,
          start_time: data.startTime,
          end_time: data.endTime,
          is_active: data.isActive,
          week_days: data.weekDays,
        };
        if (!Number.isNaN(teacherId) && teacherId > 0) {
          body['teacher'] = teacherId;
          body['teacher_id'] = teacherId;
        } else if (data.teacher) {
          body['teacher'] = data.teacher;
        }
        if (data.room && data.room > 0) body['room'] = data.room;
        if (data.startDate) body['start_date'] = data.startDate;
        if (data.endDate) body['end_date'] = data.endDate;
        const salaryVal = parseFloat(data.teacherFixedSalary) || 0;
        if (salaryVal > 0) body['teacher_fixed_salary'] = data.teacherFixedSalary;

        return dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.group, method: 'POST', data: body },
          ],
          () => undefined
        );
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
        return { url: ApiPaths.groupId(data.id), method: 'PATCH', data: body };
      },
      invalidatesTags: ['Group'],
    }),
    deleteGroup: builder.mutation<void, number>({
      query: (id) => ({ url: ApiPaths.groupId(id), method: 'DELETE' }),
      invalidatesTags: ['Group'],
    }),
    getGroupCreateFormOptions: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: '/group/groups-ui/create-form-options/' }),
      providesTags: ['GroupChoices'],
    }),
    getGroupWeekdays: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: ApiPaths.groupChoice('weekdays') }),
      providesTags: ['GroupChoices'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    getGroupCourses: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: ApiPaths.groupChoice('courses') }),
      providesTags: ['GroupChoices'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    getGroupLevels: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: ApiPaths.groupChoice('levels') }),
      providesTags: ['GroupChoices'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    getGroupRooms: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: ApiPaths.groupRooms }),
      providesTags: ['GroupChoices'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    getGroupTeacherSalaryTypes: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: ApiPaths.groupChoice('teacher-salary-types') }),
      providesTags: ['GroupChoices'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    getGroupTeachers: builder.query<Record<string, unknown>[], void>({
      query: () => ({ url: ApiPaths.teacher }),
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
