import type { AdminModel, TeacherModel } from '../types';

export function normalizePersonName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function workerDisplayName(worker: AdminModel): string {
  const name = worker.fullName || `${worker.firstName ?? ''} ${worker.lastName ?? ''}`.trim();
  return name || worker.roleDisplay || '';
}

export function extractLinkedUserId(raw: Record<string, unknown>): string {
  const user = raw['user'];
  if (user && typeof user === 'object') {
    return String((user as Record<string, unknown>)['id'] ?? '').trim();
  }
  return String(raw['user_id'] ?? raw['worker_id'] ?? user ?? '').trim();
}

export function extractLinkedTeacherId(raw: Record<string, unknown>): string {
  const teacher = raw['teacher'];
  if (teacher && typeof teacher === 'object') {
    return String((teacher as Record<string, unknown>)['id'] ?? '').trim();
  }
  return String(raw['teacher_id'] ?? teacher ?? '').trim();
}

export function teacherProfileForWorker(
  worker: AdminModel,
  teachers: TeacherModel[],
): TeacherModel | undefined {
  if (worker.teacherId) {
    const byId = teachers.find((t) => t.id === worker.teacherId);
    if (byId) return byId;
  }

  const byUser = teachers.find((t) => t.userId && t.userId === worker.id);
  if (byUser) return byUser;

  const workerName = normalizePersonName(workerDisplayName(worker));
  if (!workerName) return undefined;

  return teachers.find((t) => normalizePersonName(t.fullName) === workerName);
}

export function teacherWorkersWithoutProfile(
  workers: AdminModel[],
  teachers: TeacherModel[],
): AdminModel[] {
  return workers.filter((worker) => {
    if ((worker.role ?? '').toLowerCase() !== 'teacher') return false;
    return !teacherProfileForWorker(worker, teachers);
  });
}
