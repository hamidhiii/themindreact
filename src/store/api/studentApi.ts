import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import { ApiPaths } from '../../api/apiPaths';
import { dataWithFallbacks, extractMapList, isRecord, unwrapDataMap, unwrapEntity } from '../../api/apiResponse';
import { getSelectedBranchId } from '../../utils/branchContext';
import type {
  StudentModel,
  PaymentModel,
  StudentHistoryModel,
  HistoryItemModel,
  JournalModel,
  StudentRecordModel,
  DashboardModel,
} from '../../types';

function validStudentId(id: unknown): number | undefined {
  if (typeof id === 'number' && Number.isFinite(id) && id > 0) return Math.trunc(id);
  if (typeof id === 'string') {
    const n = Number(id);
    if (!Number.isNaN(n) && n > 0) return Math.trunc(n);
  }
  return undefined;
}

function parseStudent(j: Record<string, unknown>): StudentModel {
  const fullName = String(j['full_name'] ?? j['name'] ?? '').trim();
  const [fallbackFirst = '', ...fallbackLastParts] = fullName.split(/\s+/).filter(Boolean);
  const fallbackLast = fallbackLastParts.join(' ');

  return {
    id: validStudentId(j['id']),
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

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]/g, '');
    const n = Number(normalized);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function pickDashboardCards(cards: unknown): Partial<DashboardModel['cards']> {
  if (!Array.isArray(cards)) return {};
  const picked: Partial<DashboardModel['cards']> = {};

  for (const item of cards) {
    if (!isRecord(item)) continue;
    const key = String(item['key'] ?? item['slug'] ?? item['type'] ?? item['title'] ?? item['label'] ?? '').toLowerCase();
    const rawValue = item['value'] ?? item['count'] ?? item['total'] ?? item['amount'];
    const value = asNumber(rawValue) ?? 0;

    if (key.includes('total') && key.includes('debt')) picked.totalDebt = String(rawValue ?? value);
    else if (key.includes('lead')) picked.activeLeads = value;
    else if (key.includes('student')) picked.activeStudents = value;
    else if (key.includes('debtor') || key.includes('debt')) picked.debtors = value;
    else if (key.includes('group')) picked.groups = value;
  }

  return picked;
}

function dashboardSource(raw: unknown): Record<string, unknown> {
  const root = unwrapDataMap(raw);
  for (const key of ['cards', 'stats', 'summary', 'overview', 'data']) {
    const nested = root[key];
    if (isRecord(nested)) return nested;
  }
  return root;
}

function readNumber(source: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = asNumber(source[key]);
    if (value !== undefined) return value;
  }
  return fallback;
}

function readString(source: Record<string, unknown>, keys: string[], fallback = '0'): string {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  return fallback;
}

function parseDashboard(raw: unknown): DashboardModel {
  const root = unwrapDataMap(raw);
  const source = dashboardSource(raw);
  const fromArray = pickDashboardCards(root['cards']);
  return {
    month: String(source['month'] ?? root['month'] ?? ''),
    cards: {
      activeLeads: fromArray.activeLeads ?? readNumber(source, ['active_leads', 'activeLeads', 'leads', 'total_leads', 'lead_count']),
      activeStudents: fromArray.activeStudents ?? readNumber(source, ['active_students', 'activeStudents', 'students', 'total_students', 'student_count', 'students_count']),
      debtors: fromArray.debtors ?? readNumber(source, ['debtors', 'debtor_students', 'debtors_count', 'debtor_count']),
      totalDebt: fromArray.totalDebt ?? readString(source, ['total_debt', 'totalDebt', 'debt_total', 'debt_sum', 'debt']),
      groups: fromArray.groups ?? readNumber(source, ['groups', 'active_groups', 'total_groups', 'group_count', 'groups_count']),
    },
  };
}

type StudentBodyInput = {
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
  telegram?: string;
  branchId?: string | number;
};

function studentToBody(data: StudentBodyInput): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const first = data.firstName?.trim() ?? '';
  const last = data.lastName?.trim() ?? '';
  const fullName = [first, last].filter(Boolean).join(' ');

  if (first) body['first_name'] = first;
  if (last) body['last_name'] = last;
  if (fullName) {
    body['full_name'] = fullName;
    body['name'] = fullName;
  }
  if (data.phone !== undefined) body['phone'] = data.phone;
  if (data.parentPhone !== undefined) {
    body['parent_phone'] = data.parentPhone;
    body['additional_phone'] = data.parentPhone;
  }
  if (data.status !== undefined) body['status'] = data.status;
  if (data.birthDate !== undefined) body['birth_date'] = data.birthDate;
  if (data.gender !== undefined) body['gender'] = data.gender;
  if (data.district !== undefined) body['district'] = data.district;
  if (data.source !== undefined) body['source'] = data.source;
  if (data.notes !== undefined) body['notes'] = data.notes;
  if (data.telegram !== undefined) {
    body['telegram'] = data.telegram;
    body['telegram_username'] = data.telegram;
  }
  if (data.groupId !== undefined && data.groupId !== '') {
    const groupId = Number(data.groupId);
    const value = Number.isNaN(groupId) ? data.groupId : groupId;
    body['group'] = value;
    body['group_id'] = value;
  }
  if (data.balance !== undefined) body['balance'] = data.balance;

  const branchRaw = data.branchId ?? getSelectedBranchId();
  if (branchRaw != null && branchRaw !== '') {
    const branchNum = Number(branchRaw);
    const branch = Number.isNaN(branchNum) ? branchRaw : branchNum;
    body['branch'] = branch;
    body['branch_id'] = branch;
  }

  return body;
}

function parseCreatedStudent(raw: unknown, fallback: StudentBodyInput): StudentModel {
  const entity = unwrapEntity(raw, ['student', 'item', 'result', 'data']);
  const parsed = parseStudent(entity);
  if (parsed.id == null) {
    const map = unwrapDataMap(raw);
    parsed.id = validStudentId(map['id'] ?? entity['id']);
  }
  if (!parsed.firstName?.trim() && fallback.firstName) parsed.firstName = fallback.firstName;
  if (!parsed.lastName?.trim() && fallback.lastName) parsed.lastName = fallback.lastName;
  if (!parsed.phone && fallback.phone) parsed.phone = fallback.phone;
  if (!parsed.status && fallback.status) parsed.status = fallback.status;
  return parsed;
}

type StudentQueryError = { status: number | undefined; data: {} };

function toStudentQueryError(error: unknown): { error: StudentQueryError } {
  return { error: error as StudentQueryError };
}

export const studentApi = createApi({
  reducerPath: 'studentApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Student', 'Payment', 'Journal', 'StudentUi', 'StudentGroup'],
  endpoints: (builder) => ({
    getStudents: builder.query<StudentModel[], { name?: string; phone?: string; status?: string; group?: number } | void>({
      queryFn: (params = {}, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.students, params: params ?? {} },
            { url: '/student/ui/students/', params: params ?? {} },
          ],
          (raw) => extractMapList(raw).map(parseStudent)
        ),
      providesTags: ['Student'],
    }),
    getStudentById: builder.query<StudentModel, string | number>({
      queryFn: (id, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.student(id) },
            { url: `/student/ui/${id}/profile/` },
          ],
          (raw) => parseStudent(raw as Record<string, unknown>)
        ),
      providesTags: ['Student'],
    }),
    getStudentFinance: builder.query<Record<string, unknown>, string | number>({
      queryFn: (id, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.studentTransactions(id) },
            { url: `/student/ui/${id}/finance/` },
          ],
          (raw) => Array.isArray(raw) ? { transactions: raw } : raw as Record<string, unknown>
        ),
      providesTags: ['StudentUi'],
    }),
    getStudentGrades: builder.query<Record<string, unknown>, string | number>({
      queryFn: (id, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.studentAcademic(id) },
            { url: `/student/ui/${id}/grades/` },
          ],
          (raw) => raw as Record<string, unknown>
        ),
      providesTags: ['StudentUi'],
    }),
    getStudentActivity: builder.query<Record<string, unknown>[], string | number>({
      queryFn: (id, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.studentActivity(id) },
            { url: ApiPaths.studentCalendar(id) },
            { url: `/student/ui/${id}/activity/` },
          ],
          (raw) => extractMapList(raw)
        ),
      providesTags: ['StudentUi'],
    }),
    getStudentHistory: builder.query<StudentHistoryModel, string | number>({
      queryFn: (id, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.studentAcademic(id) },
            { url: `/student/students/${id}/history/` },
          ],
          (raw) => parseStudentHistory(raw as Record<string, unknown>)
        ),
    }),
    getStudentDashboard: builder.query<DashboardModel, void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.studentsStats },
            { url: '/student/ui/dashboard/' },
          ],
          parseDashboard
        ),
      providesTags: ['StudentUi'],
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
      groupId?: string;
      balance?: string;
      telegram?: string;
      branchId?: string | number;
    }>({
      async queryFn(data, _api, _extra, baseQuery) {
        const body = studentToBody(data);
        const result = await baseQuery({
          url: ApiPaths.students,
          method: 'POST',
          data: body,
        });
        if (result.error) {
          return toStudentQueryError(result.error);
        }
        const parsed = parseCreatedStudent(result.data, data);
        if (parsed.id == null) {
          return toStudentQueryError({
            status: 400,
            data: { detail: 'Student was not created — server did not return a valid id.' },
          });
        }
        return { data: parsed };
      },
      invalidatesTags: ['Student', 'StudentUi'],
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
      queryFn: ({ id, ...rest }, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.student(id), method: 'PATCH', data: studentToBody(rest) },
            { url: `/student/students/${id}/`, method: 'PATCH', data: studentToBody(rest) },
          ],
          (raw) => parseStudent(raw as Record<string, unknown>)
        ),
      invalidatesTags: ['Student', 'StudentUi'],
    }),
    deleteStudent: builder.mutation<void, string | number>({
      queryFn: (id, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.student(id), method: 'DELETE' },
            { url: `/student/students/${id}/`, method: 'DELETE' },
          ],
          () => undefined
        ),
      invalidatesTags: ['Student', 'StudentUi'],
    }),
    getStudentPayments: builder.query<PaymentModel[], string | number>({
      queryFn: (studentId, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.studentTransactions(studentId) },
            { url: '/student/payments/', params: { student: studentId } },
          ],
          (raw) => extractMapList(raw).map(parsePayment)
        ),
      providesTags: ['Payment'],
    }),
    assignGroupToStudent: builder.mutation<void, { studentId: number; groupId: number }>({
      queryFn: ({ studentId, groupId }, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            {
              url: ApiPaths.groupStudents(groupId),
              method: 'POST',
              data: { student_id: studentId },
            },
            {
              url: ApiPaths.groupStudents(groupId),
              method: 'POST',
              data: { student: studentId },
            },
          ],
          () => undefined
        ),
      invalidatesTags: ['Student', 'StudentGroup'],
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
