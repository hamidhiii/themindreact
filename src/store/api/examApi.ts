import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import { ApiPaths } from '../../api/apiPaths';
import { dataWithFallbacks, extractMapList } from '../../api/apiResponse';
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
      query: () => ({ url: ApiPaths.exam }),
      providesTags: ['Exam'],
    }),
    getExamChoices: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: '/exam/ui-choices/' }),
      providesTags: ['Exam'],
    }),
    getExams: builder.query<ExamModel[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.exam },
            { url: '/exam/exams/' },
          ],
          (raw) => extractMapList(raw).map(parseExam)
        ),
      providesTags: ['Exam'],
    }),
    getExamById: builder.query<ExamModel, string>({
      queryFn: (id, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: ApiPaths.examId(id) },
            { url: `/exam/exams/${id}/` },
          ],
          (raw) => parseExam(raw as Record<string, unknown>)
        ),
      providesTags: ['Exam'],
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
        url: ApiPaths.exam,
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
        url: ApiPaths.examId(data.id),
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
      query: (id) => ({ url: ApiPaths.examId(id), method: 'DELETE' }),
      invalidatesTags: ['Exam'],
    }),
    saveExamResults: builder.mutation<void, { examId: string; status: string; results: unknown[] }>({
      query: ({ examId, status, results }) => ({
        url: ApiPaths.examResults(examId),
        method: 'POST',
        data: { status, results },
      }),
    }),
    getExamStudents: builder.query<Record<string, unknown>[], string>({
      query: (examId) => ({ url: ApiPaths.examResults(examId) }),
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
