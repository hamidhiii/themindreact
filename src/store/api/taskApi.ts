import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';
import { ApiPaths } from '../../api/apiPaths';
import { dataWithFallbacks, extractMapList, isRecord, requestWithFallbacks, unwrapEntity } from '../../api/apiResponse';
import type { TaskApiModel, TaskNotificationModel } from '../../types';

const STATUS_LABELS: Record<string, string> = {
  todo: 'Need to do',
  in_progress: 'In work',
  review: 'Under check',
  done: 'Completed',
};

function asString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function asOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function asBool(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function normalizeTaskStatus(value: unknown, completed?: unknown): string {
  const raw = asString(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (['done', 'completed', 'complete', 'finished', 'closed'].includes(raw) || asBool(completed)) return 'done';
  if (['in_progress', 'progress', 'in_work', 'working', 'doing', 'process'].includes(raw)) return 'in_progress';
  if (['review', 'under_check', 'checking', 'check', 'qa'].includes(raw)) return 'review';
  if (['todo', 'to_do', 'new', 'new_task', 'need_to_be_done', 'need_to_do', 'pending', 'open'].includes(raw)) return 'todo';
  return raw || 'todo';
}

function normalizePriority(value: unknown): string {
  const raw = asString(value, 'medium').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (['urgent', 'high'].includes(raw)) return 'high';
  if (['low'].includes(raw)) return 'low';
  if (['normal', 'medium', 'middle'].includes(raw)) return 'medium';
  return raw || 'medium';
}

function entityId(value: unknown): string | undefined {
  if (isRecord(value)) {
    return asOptionalString(value['id'] ?? value['user_id'] ?? value['worker_id']);
  }
  return asOptionalString(value);
}

function entityLabel(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  return asOptionalString(
    value['full_name'] ??
    value['name'] ??
    value['username'] ??
    value['title'] ??
    value['label']
  );
}

function hasTaskShape(value: Record<string, unknown>): boolean {
  return Boolean(value['id'] && (value['title'] || value['task_title'] || value['name'] || value['status']));
}

function extractTasks(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (!isRecord(raw)) return [];
  if (hasTaskShape(raw)) return [raw];

  const direct = extractMapList(raw);
  if (direct.length > 0) return direct;

  const keys = [
    'results',
    'items',
    'data',
    'tasks',
    'task_list',
    'my_tasks',
    'assigned_tasks',
    'created_tasks',
    'todo',
    'to_do',
    'in_progress',
    'in_work',
    'review',
    'under_check',
    'done',
    'completed',
  ];

  for (const key of keys) {
    const nested = raw[key];
    if (Array.isArray(nested)) return nested.filter(isRecord);
    if (isRecord(nested)) {
      const nestedList = extractTasks(nested);
      if (nestedList.length > 0) return nestedList;
    }
  }

  const bucketed: Record<string, unknown>[] = [];
  for (const [key, value] of Object.entries(raw)) {
    const normalizedKey = normalizeTaskStatus(key);
    if (!STATUS_LABELS[normalizedKey] || !Array.isArray(value)) continue;
    bucketed.push(...value.filter(isRecord).map((item) => ({ status: normalizedKey, ...item })));
  }

  return bucketed;
}

function extractNotifications(raw: unknown): Record<string, unknown>[] {
  const direct = extractMapList(raw);
  if (direct.length > 0) return direct;

  if (!isRecord(raw)) return [];
  for (const key of ['notifications', 'notification_list', 'unread', 'read']) {
    const nested = raw[key];
    if (Array.isArray(nested)) return nested.filter(isRecord);
    if (isRecord(nested)) {
      const nestedList = extractNotifications(nested);
      if (nestedList.length > 0) return nestedList;
    }
  }

  return [];
}

function parseTaskNotification(j: Record<string, unknown>): TaskNotificationModel {
  const title = String(j['title'] ?? j['task_title'] ?? '').trim();
  const message = String(j['message'] ?? j['body'] ?? j['text'] ?? title ?? '').trim();
  return {
    id: String(j['id'] ?? ''),
    title: title || undefined,
    type: j['type'] != null ? String(j['type']) : (j['notification_type'] != null ? String(j['notification_type']) : undefined),
    createdAt: String(j['created_at'] ?? j['created'] ?? j['timestamp'] ?? ''),
    updatedAt: j['updated_at'] as string | undefined,
    message,
    isRead: asBool(j['is_read'] ?? j['read']),
    createdBy: j['created_by'] != null ? String(j['created_by']) : undefined,
    modifiedBy: j['modified_by'] != null ? String(j['modified_by']) : undefined,
    user: j['user'] != null ? String(j['user']) : undefined,
    task: j['task'] != null ? String(j['task']) : undefined,
    taskTitle: j['task_title'] != null ? String(j['task_title']) : undefined,
  };
}

function parseTask(j: Record<string, unknown>): TaskApiModel {
  const completed = j['is_completed'] ?? j['completed'];
  const status = normalizeTaskStatus(j['status'] ?? j['state'] ?? j['task_status'], completed);
  const assigned = j['assigned_to'] ?? j['assignee'] ?? j['assigned_user'] ?? j['user'] ?? j['worker'];
  const tag = j['tag'] ?? j['tag_name'] ?? j['task_type'] ?? j['category'];
  const tagText = isRecord(tag) ? entityLabel(tag) : asOptionalString(tag);
  const priority = normalizePriority(j['priority'] ?? j['task_priority']);

  return {
    id: String(j['id'] ?? ''),
    title: asString(j['title'] ?? j['task_title'] ?? j['name'] ?? j['subject']).trim(),
    description: asString(j['description'] ?? j['body'] ?? j['text']).trim(),
    status,
    statusDisplay: asOptionalString(j['status_display'] ?? j['state_display'] ?? j['task_status_display']) ?? STATUS_LABELS[status] ?? status,
    tag: tagText,
    tagDisplay: asOptionalString(j['tag_display'] ?? j['task_type_display'] ?? j['category_display']) ?? tagText,
    priority,
    priorityDisplay: asOptionalString(j['priority_display'] ?? j['task_priority_display']) ?? priority,
    deadline: asOptionalString(j['deadline'] ?? j['due_date'] ?? j['dueDate'] ?? j['deadline_date']),
    isCompleted: asBool(completed) || status === 'done',
    assignedTo: entityId(assigned),
    assignedToName: asOptionalString(j['assigned_to_name'] ?? j['assignee_name'] ?? j['worker_name'] ?? j['user_name']) ?? entityLabel(assigned),
    createdAt: asString(j['created_at'] ?? j['created'] ?? ''),
  };
}

function taskEntity(raw: unknown): Record<string, unknown> {
  return unwrapEntity(raw, ['task', 'item', 'result']);
}

function toAssigneeValue(value: string): string | number {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric;
}

function buildTaskBody(data: {
  title?: string;
  description?: string;
  status?: string;
  tag?: string;
  priority?: string;
  deadline?: string;
  isCompleted?: boolean;
  assignedTo?: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.title !== undefined) body['title'] = data.title;
  if (data.description !== undefined) body['description'] = data.description;
  if (data.status !== undefined) {
    body['status'] = data.status;
    body['is_completed'] = data.status === 'done';
  }
  if (data.priority !== undefined) body['priority'] = data.priority;
  if (data.isCompleted !== undefined) body['is_completed'] = data.isCompleted;
  if (data.tag !== undefined) body['tag'] = data.tag;
  if (data.deadline !== undefined) body['due_date'] = data.deadline || null;
  if (data.assignedTo !== undefined) body['assigned_to'] = data.assignedTo ? toAssigneeValue(data.assignedTo) : null;
  return body;
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
      queryFn: (params = {}, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [{ url: ApiPaths.task, params: params ?? {} }],
          (raw) => extractTasks(raw).map(parseTask)
        ),
      providesTags: ['Task'],
    }),
    getMyTasks: builder.query<TaskApiModel[], { status?: string } | void>({
      queryFn: (params = {}, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [
            { url: '/task/my/', params: params ?? {} },
            { url: ApiPaths.task, params: params ?? {} },
          ],
          (raw) => extractTasks(raw).map(parseTask)
        ),
      providesTags: ['Task'],
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
      queryFn: (data, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [{ url: ApiPaths.task, method: 'POST', data: buildTaskBody(data) }],
          (raw) => parseTask(taskEntity(raw))
        ),
      invalidatesTags: ['Task'],
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
      queryFn: ({ id, ...rest }, _api, _extra, baseQuery) =>
        dataWithFallbacks(
          baseQuery,
          [{ url: ApiPaths.taskById(id), method: 'PATCH', data: buildTaskBody(rest) }],
          (raw) => parseTask(taskEntity(raw))
        ),
      invalidatesTags: ['Task'],
    }),
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({ url: ApiPaths.taskById(id), method: 'DELETE' }),
      invalidatesTags: ['Task'],
    }),
    updateTaskStatus: builder.mutation<void, { id: string; status: string }>({
      async queryFn({ id, status }, _api, _extra, baseQuery) {
        const result = await requestWithFallbacks(baseQuery, [
          { url: ApiPaths.taskStatusById(id), method: 'PATCH', data: { status } },
          { url: ApiPaths.taskById(id), method: 'PATCH', data: buildTaskBody({ status }) },
        ]);
        if ('error' in result) return { error: result.error as any };
        return { data: undefined };
      },
      invalidatesTags: ['Task'],
    }),

    getNotifications: builder.query<TaskNotificationModel[], void>({
      query: () => ({ url: ApiPaths.taskNotifications }),
      providesTags: ['TaskNotification'],
      transformResponse: (raw) => extractNotifications(raw).map(parseTaskNotification),
    }),
    getUnreadNotificationCount: builder.query<number, void>({
      query: () => ({ url: ApiPaths.taskNotifications }),
      providesTags: ['TaskNotification'],
      transformResponse: (raw) => {
        if (isRecord(raw)) {
          const v = raw['unread_count'] ?? raw['unread'];
          if (typeof v === 'number') return v;
          if (typeof v === 'string') {
            const n = parseInt(v, 10);
            if (!Number.isNaN(n)) return n;
          }
        }
        return extractNotifications(raw).map(parseTaskNotification).filter((n) => !n.isRead).length;
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
    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({ url: ApiPaths.taskNotification(id), method: 'DELETE' }),
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
  useDeleteNotificationMutation,
} = taskApi;
