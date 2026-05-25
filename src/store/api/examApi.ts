import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import type { ExamModel } from '../../types';

function parseExam(j: Record<string, unknown>): ExamModel {
  return {
    id: String(j['id'] ?? ''),
    title: (j['title'] ?? '') as string,
    group: (j['group'] ?? 0) as number,
    groupName: (j['group_name'] ?? '') as string,
    teacher: (j['teacher'] ?? '') as string,
    teacherName: (j['teacher_name'] ?? '') as string,
    examDate: (j['exam_date'] ?? '') as string,
    startTime: (j['start_time'] ?? '') as string,
    endTime: (j['end_time'] ?? '') as string,
    passScore: (j['pass_score'] ?? 0) as number,
    isPercentage: (j['is_percentage'] ?? false) as boolean,
    isActive: (j['is_active'] ?? true) as boolean,
    createdBy: (j['created_by'] ?? '') as string,
    createdByName: (j['created_by_name'] ?? '') as string,
    createdAt: (j['created_at'] ?? '') as string,
    updatedAt: (j['updated_at'] ?? '') as string,
    status: (j['status'] ?? 'planned') as string,
    resultsCount: (j['results_count'] ?? 0) as number,
    passedCount: (j['passed_count'] ?? 0) as number,
    failedCount: (j['failed_count'] ?? 0) as number,
  };
}

export const examApi = createApi({
  reducerPath: 'examApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Exam'],
  endpoints: (builder) => ({
    getExamDashboard: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: '/exam/exams/dashboard/' }),
      providesTags: ['Exam'],
    }),
    getExamChoices: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: '/exam/exams/ui-choices/' }),
      providesTags: ['Exam'],
    }),
    getExams: builder.query<ExamModel[], void>({
      query: () => ({ url: '/exam/exams/' }),
      providesTags: ['Exam'],
      transformResponse: (raw) => {
        const data = raw as unknown;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : ((data as Record<string, unknown>)?.['results'] as Record<string, unknown>[] ?? []);
        return list.map(parseExam);
      },
    }),
    getExamById: builder.query<ExamModel, string>({
      query: (id) => ({ url: `/exam/exams/${id}/` }),
      providesTags: ['Exam'],
      transformResponse: (raw) => parseExam(raw as Record<string, unknown>),
    }),
    createExam: builder.mutation<void, {
      title: string;
      teacher: string;
      group: number;
      examDate: string;
      startTime: string;
      endTime: string;
      passScore: number;
      isPercentage: boolean;
      isActive: boolean;
      createdBy: string;
    }>({
      query: (data) => ({
        url: '/exam/exams/',
        method: 'POST',
        data: {
          title: data.title,
          group: data.group,
          teacher: data.teacher,
          exam_date: data.examDate,
          start_time: data.startTime,
          end_time: data.endTime,
          pass_score: data.passScore,
          is_percentage: data.isPercentage,
          is_active: data.isActive,
          created_by: data.createdBy,
        },
      }),
      invalidatesTags: ['Exam'],
    }),
    updateExam: builder.mutation<void, {
      id: string;
      title: string;
      teacher: string;
      group: number;
      examDate: string;
      startTime: string;
      endTime: string;
      passScore: number;
      isPercentage: boolean;
      isActive: boolean;
    }>({
      query: (data) => ({
        url: `/exam/exams/${data.id}/`,
        method: 'PATCH',
        data: {
          title: data.title,
          group: data.group,
          teacher: data.teacher,
          exam_date: data.examDate,
          start_time: data.startTime,
          end_time: data.endTime,
          pass_score: data.passScore,
          is_percentage: data.isPercentage,
          is_active: data.isActive,
        },
      }),
      invalidatesTags: ['Exam'],
    }),
    deleteExam: builder.mutation<void, string>({
      query: (id) => ({ url: `/exam/exams/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Exam'],
    }),
    saveExamResults: builder.mutation<void, { examId: string; status: string; results: unknown[] }>({
      query: ({ examId, status, results }) => ({
        url: `/exam/exams/${examId}/results/`,
        method: 'POST',
        data: { status, results },
      }),
    }),
    getExamStudents: builder.query<Record<string, unknown>[], string>({
      query: (examId) => ({ url: `/exam/exams/${examId}/students/` }),
      transformResponse: (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        return ((raw as Record<string, unknown>)?.['results'] as Record<string, unknown>[]) ?? [];
      },
    }),
    bulkSaveExamResults: builder.mutation<void, { examId: string; results: unknown[] }>({
      query: ({ examId, results }) => ({
        url: `/exam/exams/${examId}/bulk-results/`,
        method: 'POST',
        data: { results },
      }),
      invalidatesTags: ['Exam'],
    }),
    finishExam: builder.mutation<void, string>({
      query: (examId) => ({ url: `/exam/exams/${examId}/finish/`, method: 'POST' }),
      invalidatesTags: ['Exam'],
    }),
    toggleExamActive: builder.mutation<void, string>({
      query: (examId) => ({ url: `/exam/exams/${examId}/toggle-active/`, method: 'POST' }),
      invalidatesTags: ['Exam'],
    }),
  }),
});

export const {
  useGetExamDashboardQuery,
  useGetExamChoicesQuery,
  useGetExamsQuery,
  useGetExamByIdQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useSaveExamResultsMutation,
  useGetExamStudentsQuery,
  useBulkSaveExamResultsMutation,
  useFinishExamMutation,
  useToggleExamActiveMutation,
} = examApi;
