import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import { ApiPaths } from '../../api/apiPaths';
import { extractMapList } from '../../api/apiResponse';
import type { TaskApiModel, TaskNotificationModel } from '../../types';

function parseTaskNotification(j: Record<string, unknown>): TaskNotificationModel {
  return {
    id: String(j['id'] ?? ''),
    createdAt: String(j['created_at'] ?? ''),
    updatedAt: j['updated_at'] as string | undefined,
    message: String(j['message'] ?? ''),
    isRead: j['is_read'] === true,
    createdBy: j['created_by'] != null ? String(j['created_by']) : undefined,
    modifiedBy: j['modified_by'] != null ? String(j['modified_by']) : undefined,
    user: j['user'] != null ? String(j['user']) : undefined,
  };
}

function parseTask(j: Record<string, unknown>): TaskApiModel {
  return {
    id: String(j['id'] ?? ''),
    title: (j['title'] ?? '') as string,
    description: (j['description'] ?? '') as string,
    status: (j['status'] ?? 'todo') as string,
    statusDisplay: (j['status_display'] ?? '') as string,
    tag: j['tag'] as string | undefined,
    tagDisplay: j['tag_display'] as string | undefined,
    priority: (j['priority'] ?? '') as string,
    priorityDisplay: (j['priority_display'] ?? '') as string,
    deadline: (j['deadline'] ?? j['due_date']) as string | undefined,
    isCompleted: (j['is_completed'] ?? false) as boolean,
    assignedTo: j['assigned_to'] as string | undefined,
    createdAt: (j['created_at'] ?? '') as string,
  };
}

export const taskApi = createApi({
  reducerPath: 'taskApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Task', 'TaskNotification'],
  endpoints: (builder) => ({
    getTaskMeta: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: '/task/meta/' }),
    }),
    getTasks: builder.query<TaskApiModel[], { status?: string; assignedTo?: string } | void>({
      query: (params = {}) => ({
        url: ApiPaths.task,
        params: params ?? {},
      }),
      providesTags: ['Task'],
      transformResponse: (raw) => extractMapList(raw).map(parseTask),
    }),
    getMyTasks: builder.query<TaskApiModel[], { status?: string } | void>({
      query: (params = {}) => ({
        url: '/task/my/',
        params: params ?? {},
      }),
      providesTags: ['Task'],
      transformResponse: (raw) => extractMapList(raw).map(parseTask),
    }),
    createTask: builder.mutation<TaskApiModel, {
      title: string;
      description: string;
      status: string;
      tag?: string;
      priority: string;
      deadline?: string;
      isCompleted?: boolean;
      assignedTo?: string;
    }>({
      query: (data) => {
        const body: Record<string, unknown> = {
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          is_completed: data.isCompleted ?? false,
        };
        if (data.tag) body['tag'] = data.tag;
        if (data.deadline) body['due_date'] = data.deadline;
        if (data.assignedTo) {
          const assignee = Number(data.assignedTo);
          body['assigned_to'] = Number.isNaN(assignee) ? data.assignedTo : assignee;
        }
        return { url: ApiPaths.task, method: 'POST', data: body };
      },
      invalidatesTags: ['Task'],
      transformResponse: (raw) => parseTask(raw as Record<string, unknown>),
    }),
    updateTask: builder.mutation<TaskApiModel, {
      id: string;
      title?: string;
      description?: string;
      status?: string;
      tag?: string;
      priority?: string;
      deadline?: string;
      isCompleted?: boolean;
      assignedTo?: string;
    }>({
      query: ({ id, ...rest }) => {
        const body: Record<string, unknown> = {};
        if (rest.title !== undefined) body['title'] = rest.title;
        if (rest.description !== undefined) body['description'] = rest.description;
        if (rest.status !== undefined) body['status'] = rest.status;
        if (rest.tag !== undefined) body['tag'] = rest.tag;
        if (rest.priority !== undefined) body['priority'] = rest.priority;
        if (rest.deadline !== undefined) body['due_date'] = rest.deadline;
        if (rest.isCompleted !== undefined) body['is_completed'] = rest.isCompleted;
        if (rest.assignedTo !== undefined) body['assigned_to'] = rest.assignedTo;
        return { url: ApiPaths.taskById(id), method: 'PATCH', data: body };
      },
      invalidatesTags: ['Task'],
      transformResponse: (raw) => parseTask(raw as Record<string, unknown>),
    }),
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({ url: ApiPaths.taskById(id), method: 'DELETE' }),
      invalidatesTags: ['Task'],
    }),
    updateTaskStatus: builder.mutation<void, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: ApiPaths.taskStatusById(id), method: 'PATCH', data: { status } }),
      invalidatesTags: ['Task'],
    }),

    getNotifications: builder.query<TaskNotificationModel[], void>({
      query: () => ({ url: ApiPaths.taskNotifications }),
      providesTags: ['TaskNotification'],
      transformResponse: (raw) => extractMapList(raw).map(parseTaskNotification),
    }),
    getUnreadNotificationCount: builder.query<number, void>({
      query: () => ({ url: '/task/notifications/unread-count/' }),
      providesTags: ['TaskNotification'],
      transformResponse: (raw) => {
        const j = (raw as Record<string, unknown>) ?? {};
        const v = j['unread_count'];
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          const n = parseInt(v, 10);
          return Number.isNaN(n) ? 0 : n;
        }
        return 0;
      },
    }),
    readAllNotifications: builder.mutation<void, void>({
      query: () => ({ url: ApiPaths.taskNotificationsMarkAllRead, method: 'POST' }),
      invalidatesTags: ['TaskNotification'],
    }),
    readNotification: builder.mutation<void, string>({
      query: (id) => ({ url: ApiPaths.taskNotification(id), method: 'PATCH', data: { is_read: true } }),
      invalidatesTags: ['TaskNotification'],
    }),
  }),
});

export const {
  useGetTaskMetaQuery,
  useGetTasksQuery,
  useGetMyTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskStatusMutation,
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useReadAllNotificationsMutation,
  useReadNotificationMutation,
} = taskApi;
