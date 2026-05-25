import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import type {
  StudentModel,
  PaymentModel,
  StudentHistoryModel,
  HistoryItemModel,
  JournalModel,
  StudentRecordModel,
  DashboardModel,
} from '../../types';

function parseStudent(j: Record<string, unknown>): StudentModel {
  const fullName = String(j['full_name'] ?? j['name'] ?? '').trim();
  const [fallbackFirst = '', ...fallbackLastParts] = fullName.split(/\s+/).filter(Boolean);
  const fallbackLast = fallbackLastParts.join(' ');

  return {
    id: j['id'] as number | undefined,
    firstName: String(j['first_name'] ?? fallbackFirst),
    lastName: String(j['last_name'] ?? fallbackLast),
    phone: j['phone'] as string | undefined,
    parentPhone: j['parent_phone'] as string | undefined,
    status: (j['status'] ?? '') as string,
    statusDisplay: j['status_display'] as string | undefined,
    birthDate: j['birth_date'] as string | undefined,
    gender: j['gender'] as string | undefined,
    district: j['district'] as number | undefined,
    source: j['source'] as string | undefined,
    notes: j['notes'] as string | undefined,
    joinedAt: j['joined_at'] as string | undefined,
    createdAt: j['created_at'] as string | undefined,
    groupId: j['group'] as string | undefined,
    groupName: j['group_name'] as string | undefined,
    teacherId: j['teacher'] as string | undefined,
    teacherName: j['teacher_name'] as string | undefined,
    courseId: j['course'] as string | undefined,
    courseName: j['course_name'] as string | undefined,
    groupPrice: j['group_price'] as string | undefined,
    discountAmount: j['discount_amount'] as string | undefined,
    finalPrice: j['final_price'] as string | undefined,
    paidAmount: j['paid_amount'] as string | undefined,
    balance: String(j['balance'] ?? '0'),
    debtStatus: j['debt_status'] as string | undefined,
  };
}

function parsePayment(j: Record<string, unknown>): PaymentModel {
  return {
    id: j['id'] as number | undefined,
    studentId: (j['student'] ?? -1) as number,
    groupId: String(j['group'] ?? ''),
    administratorId: String(j['administrator'] ?? ''),
    amount: String(j['amount'] ?? '0'),
    payWith: (j['pay_with'] ?? '') as string,
    paymentMonth: (j['payment_month'] ?? '') as string,
    checkGiven: (j['check_given'] ?? false) as boolean,
    studentName: j['student_name'] as string | undefined,
    groupName: j['group_name'] as string | undefined,
    administratorName: j['administrator_name'] as string | undefined,
    createdAt: j['created_at'] as string | undefined,
  };
}

function parseHistoryItem(j: Record<string, unknown>): HistoryItemModel {
  return {
    type: (j['type'] ?? '') as string,
    date: (j['date'] ?? '') as string,
    title: (j['title'] ?? '') as string,
    description: (j['description'] ?? '') as string,
    icon: (j['icon'] ?? '') as string,
    color: (j['color'] ?? '') as string,
  };
}

function parseStudentHistory(j: Record<string, unknown>): StudentHistoryModel {
  const results = Array.isArray(j['results'])
    ? (j['results'] as Record<string, unknown>[]).map(parseHistoryItem)
    : [];
  return {
    studentId: String(j['student_id'] ?? j['id'] ?? ''),
    count: Number(j['count'] ?? results.length),
    results,
  };
}

function parseStudentRecord(j: Record<string, unknown>): StudentRecordModel {
  return {
    studentId: Number(j['student_id'] ?? j['student'] ?? 0),
    firstName: (j['first_name'] ?? '') as string,
    lastName: (j['last_name'] ?? '') as string,
    fullName: (j['full_name'] ?? `${j['first_name'] ?? ''} ${j['last_name'] ?? ''}`.trim()) as string,
    classScore: j['class_score'] as number | undefined,
    homeworkScore: j['homework_score'] as number | undefined,
    attendance: (j['attendance'] ?? '') as string,
    absenceReason: (j['absence_reason'] ?? '') as string,
  };
}

function parseJournal(j: Record<string, unknown>): JournalModel {
  const records = Array.isArray(j['student_records'])
    ? (j['student_records'] as Record<string, unknown>[]).map(parseStudentRecord)
    : [];
  return {
    id: j['id'] as number | undefined,
    group: Number(j['group'] ?? 0),
    groupName: (j['group_name'] ?? '') as string,
    lessonDate: (j['lesson_date'] ?? '') as string,
    notes: (j['notes'] ?? '') as string,
    studentRecords: records,
  };
}

function parseDashboard(j: Record<string, unknown>): DashboardModel {
  const cards = (j['cards'] ?? j) as Record<string, unknown>;
  return {
    month: (j['month'] ?? '') as string,
    cards: {
      activeLeads: Number(cards['active_leads'] ?? cards['activeLeads'] ?? 0),
      activeStudents: Number(cards['active_students'] ?? cards['activeStudents'] ?? 0),
      debtors: Number(cards['debtors'] ?? 0),
      totalDebt: String(cards['total_debt'] ?? cards['totalDebt'] ?? '0'),
      groups: Number(cards['groups'] ?? 0),
    },
  };
}

function studentToBody(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  parentPhone?: string;
  status?: string;
  birthDate?: string;
  gender?: string;
  district?: number;
  source?: string;
  notes?: string;
  groupId?: string;
  balance?: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.firstName !== undefined) body['first_name'] = data.firstName;
  if (data.lastName !== undefined) body['last_name'] = data.lastName;
  if (data.phone !== undefined) body['phone'] = data.phone;
  if (data.parentPhone !== undefined) body['parent_phone'] = data.parentPhone;
  if (data.status !== undefined) body['status'] = data.status;
  if (data.birthDate !== undefined) body['birth_date'] = data.birthDate;
  if (data.gender !== undefined) body['gender'] = data.gender;
  if (data.district !== undefined) body['district'] = data.district;
  if (data.source !== undefined) body['source'] = data.source;
  if (data.notes !== undefined) body['notes'] = data.notes;
  if (data.groupId !== undefined) body['group'] = data.groupId;
  if (data.balance !== undefined) body['balance'] = data.balance;
  return body;
}

export const studentApi = createApi({
  reducerPath: 'studentApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Student', 'Payment', 'Journal', 'StudentUi'],
  endpoints: (builder) => ({
    getStudents: builder.query<StudentModel[], { name?: string; phone?: string; status?: string; group?: number } | void>({
      query: (params = {}) => ({
        url: '/student/ui/students/',
        params: params ?? {},
      }),
      providesTags: ['Student'],
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseStudent);
      },
    }),
    getStudentById: builder.query<StudentModel, string | number>({
      query: (id) => ({ url: `/student/ui/${id}/profile/` }),
      providesTags: ['Student'],
      transformResponse: (raw) => parseStudent(raw as Record<string, unknown>),
    }),
    getStudentFinance: builder.query<Record<string, unknown>, string | number>({
      query: (id) => ({ url: `/student/ui/${id}/finance/` }),
      providesTags: ['StudentUi'],
    }),
    getStudentGrades: builder.query<Record<string, unknown>, string | number>({
      query: (id) => ({ url: `/student/ui/${id}/grades/` }),
      providesTags: ['StudentUi'],
    }),
    getStudentActivity: builder.query<Record<string, unknown>[], string | number>({
      query: (id) => ({ url: `/student/ui/${id}/activity/` }),
      providesTags: ['StudentUi'],
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    getStudentHistory: builder.query<StudentHistoryModel, string | number>({
      query: (id) => ({ url: `/student/students/${id}/history/` }),
      transformResponse: (raw) => parseStudentHistory(raw as Record<string, unknown>),
    }),
    getStudentDashboard: builder.query<DashboardModel, void>({
      query: () => ({ url: '/student/ui/dashboard/' }),
      transformResponse: (raw) => parseDashboard(raw as Record<string, unknown>),
    }),
    getStudentFilters: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: '/student/ui/filters/' }),
      providesTags: ['StudentUi'],
    }),
    getStudentBooksSummary: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: '/student/ui/books/summary/' }),
      providesTags: ['StudentUi'],
    }),
    createStudent: builder.mutation<StudentModel, {
      firstName: string;
      lastName: string;
      phone?: string;
      parentPhone?: string;
      status?: string;
      birthDate?: string;
      gender?: string;
      district?: number;
      source?: string;
      notes?: string;
      balance?: string;
    }>({
      query: (data) => ({
        url: '/dashboard/students/create/',
        method: 'POST',
        data: studentToBody(data),
      }),
      invalidatesTags: ['Student'],
      transformResponse: (raw) => parseStudent(raw as Record<string, unknown>),
    }),
    updateStudent: builder.mutation<StudentModel, {
      id: string | number;
      firstName?: string;
      lastName?: string;
      phone?: string;
      parentPhone?: string;
      status?: string;
      birthDate?: string;
      gender?: string;
      district?: number;
      source?: string;
      notes?: string;
      balance?: string;
    }>({
      query: ({ id, ...rest }) => ({
        url: `/student/students/${id}/`,
        method: 'PATCH',
        data: studentToBody(rest),
      }),
      invalidatesTags: ['Student'],
      transformResponse: (raw) => parseStudent(raw as Record<string, unknown>),
    }),
    deleteStudent: builder.mutation<void, string | number>({
      query: (id) => ({ url: `/student/students/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Student'],
    }),
    getStudentPayments: builder.query<PaymentModel[], string | number>({
      query: (studentId) => ({
        url: '/student/payments/',
        params: { student: studentId },
      }),
      providesTags: ['Payment'],
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parsePayment);
      },
    }),
    assignGroupToStudent: builder.mutation<void, { studentId: number; groupId: number }>({
      query: ({ studentId, groupId }) => ({
        url: '/group/student-groups/',
        method: 'POST',
        data: { student: studentId, group: groupId },
      }),
      invalidatesTags: ['Student'],
    }),
    getJournal: builder.query<JournalModel, { groupId: number; lessonDate?: string; teacherId?: string }>({
      query: ({ groupId, lessonDate, teacherId }) => ({
        url: `/teacher/groups/${groupId}/journal/`,
        params: {
          ...(lessonDate ? { lesson_date: lessonDate } : {}),
          ...(teacherId ? { teacher_id: teacherId } : {}),
        },
      }),
      providesTags: ['Journal'],
      transformResponse: (raw) => parseJournal(raw as Record<string, unknown>),
    }),
    saveJournal: builder.mutation<void, {
      groupId: number;
      lessonDate: string;
      teacherId: string;
      students: unknown[];
    }>({
      query: ({ groupId, lessonDate, teacherId, students }) => ({
        url: `/teacher/groups/${groupId}/journal/save/`,
        method: 'POST',
        data: { lesson_date: lessonDate, teacher_id: teacherId, students },
      }),
      invalidatesTags: ['Journal'],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useGetStudentFinanceQuery,
  useGetStudentGradesQuery,
  useGetStudentActivityQuery,
  useGetStudentHistoryQuery,
  useGetStudentDashboardQuery,
  useGetStudentFiltersQuery,
  useGetStudentBooksSummaryQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useGetStudentPaymentsQuery,
  useAssignGroupToStudentMutation,
  useGetJournalQuery,
  useSaveJournalMutation,
} = studentApi;
