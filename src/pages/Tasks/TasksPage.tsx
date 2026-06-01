import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    AlertCircle,
    Calendar,
    ChevronRight,
    ClipboardList,
    LayoutGrid,
    List,
    Pencil,
    Plus,
    RefreshCw,
    Trash2,
    UserRound,
} from 'lucide-react';
import {
    useCreateTaskMutation,
    useDeleteTaskMutation,
    useGetTasksQuery,
    useUpdateTaskMutation,
    useUpdateTaskStatusMutation,
} from '../../store/api/taskApi';
import { useGetWorkersQuery } from '../../store/api/workerApi';
import ModalShell from '../../components/common/ModalShell';
import CustomSelect from '../../components/common/CustomSelect';
import { useToast } from '../../hooks/useToast';
import { formatApiError } from '../../utils/apiError';
import type { AdminModel, TaskApiModel } from '../../types';

const STATUS_COLUMNS = [
    { id: 'todo', label: 'NEED TO BE DONE', color: '#4C6FFF' },
    { id: 'in_progress', label: 'IN WORK', color: '#ED6A2E' },
    { id: 'review', label: 'UNDER CHECK', color: '#9B59B6' },
    { id: 'done', label: 'COMPLETED', color: '#2ECC81' },
] as const;

const STATUS_OPTIONS = [
    { value: 'todo', label: 'Need to do' },
    { value: 'in_progress', label: 'In work' },
    { value: 'review', label: 'Under check' },
    { value: 'done', label: 'Completed' },
];

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
];

type StatusId = typeof STATUS_COLUMNS[number]['id'];

export default function TasksPage() {
    const { data: tasks = [], isLoading, isFetching, isError, error, refetch } = useGetTasksQuery();
    const [searchParams, setSearchParams] = useSearchParams();
    const [view, setView] = useState<'board' | 'list'>('board');
    const [showCreate, setShowCreate] = useState(false);
    const [editTask, setEditTask] = useState<TaskApiModel | null>(null);
    const [deleteTask, setDeleteTask] = useState<TaskApiModel | null>(null);
    const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
    const [updateStatus] = useUpdateTaskStatusMutation();
    const toast = useToast();

    useEffect(() => {
        if (searchParams.get('create') === '1') {
            setShowCreate(true);
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const columns = useMemo(() => {
        const counts = tasks.reduce((acc, task) => {
            const bucket = taskStatusBucket(task.status);
            acc[bucket] = (acc[bucket] || 0) + 1;
            return acc;
        }, {} as Record<StatusId, number>);

        return STATUS_COLUMNS.map((column) => ({
            ...column,
            count: counts[column.id] || 0,
            tasks: tasks.filter((task) => taskStatusBucket(task.status) === column.id),
        }));
    }, [tasks]);

    const moveTaskForward = async (task: TaskApiModel) => {
        const next = nextStatus(task.status);
        if (next === taskStatusBucket(task.status)) return;

        setMovingTaskId(task.id);
        try {
            await updateStatus({ id: task.id, status: next }).unwrap();
            toast.success('Task status updated');
        } catch (err) {
            toast.error(formatApiError(err, 'Could not update task status.'));
        } finally {
            setMovingTaskId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-[24px] font-extrabold tracking-tight text-[#1A2233]">Tasks</h1>
                    <p className="mt-1 text-[13px] font-bold text-[#8A9BB8]">
                        Today {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                        {columns.map((col) => (
                            <div
                                key={col.id}
                                className="flex items-center gap-2 rounded-xl border border-[#F0F1F5] bg-white px-3 py-1.5 text-[12px] font-black"
                                style={{ color: col.color }}
                            >
                                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                                {col.count}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="flex items-center justify-center gap-2 rounded-xl border border-[#F0F1F5] bg-white px-4 py-2.5 text-[13px] font-black text-[#1A2233] transition-colors hover:border-[#ED6A2E]/30 hover:text-[#ED6A2E]"
                    >
                        <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#ED6A2E] px-5 py-2.5 text-[13px] font-black text-white shadow-[0_4px_12px_rgba(237,106,46,0.3)] transition-all hover:bg-[#D95B24]"
                    >
                        <Plus size={18} strokeWidth={3} />
                        New Task
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 border-b border-[#F0F1F5] pb-1">
                <button
                    type="button"
                    onClick={() => setView('board')}
                    className={`relative flex items-center gap-2 px-4 py-2 text-[13px] font-black transition-all ${view === 'board' ? 'text-[#ED6A2E]' : 'text-[#8A9BB8]'}`}
                >
                    <LayoutGrid size={18} />
                    Board
                    {view === 'board' && <div className="absolute bottom-[-5px] left-0 h-[3px] w-full rounded-full bg-[#ED6A2E]" />}
                </button>
                <button
                    type="button"
                    onClick={() => setView('list')}
                    className={`relative flex items-center gap-2 px-4 py-2 text-[13px] font-black transition-all ${view === 'list' ? 'text-[#ED6A2E]' : 'text-[#8A9BB8]'}`}
                >
                    <List size={18} />
                    List
                    {view === 'list' && <div className="absolute bottom-[-5px] left-0 h-[3px] w-full rounded-full bg-[#ED6A2E]" />}
                </button>
            </div>

            {isError ? (
                <div className="rounded-[20px] border border-[#E74C3C]/20 bg-white p-5 text-[#1A2233] shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-[#E74C3C]/10 p-2 text-[#E74C3C]">
                            <AlertCircle size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-[14px] font-black">Could not load tasks</h2>
                            <p className="mt-1 text-[12px] font-bold text-[#8A9BB8]">
                                {formatApiError(error, 'Check access token, branch header, and task API.')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="rounded-xl bg-[#ED6A2E] px-4 py-2 text-[12px] font-black text-white"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            ) : isLoading ? (
                <div className="py-24 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#ED6A2E]/20 border-t-[#ED6A2E]" />
                </div>
            ) : tasks.length === 0 ? (
                <EmptyTasks onCreate={() => setShowCreate(true)} />
            ) : view === 'board' ? (
                <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {columns.map((col) => (
                        <div key={col.id} className="space-y-4">
                            <div className="flex items-center gap-2 pb-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                                <h3 className="text-[11px] font-black uppercase tracking-[1.2px] text-[#8A9BB8]">{col.label}</h3>
                                <span className="rounded-full bg-[#F4F6FA] px-2 py-0.5 text-[10px] font-black text-[#8A9BB8]">{col.count}</span>
                            </div>

                            <div className="min-h-[440px] space-y-3">
                                {col.tasks.length === 0 ? (
                                    <div className="rounded-[18px] border border-dashed border-[#E4E8F0] bg-white/60 px-4 py-8 text-center text-[12px] font-bold text-[#8A9BB8]">
                                        No tasks
                                    </div>
                                ) : (
                                    col.tasks.map((task) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            isMoving={movingTaskId === task.id}
                                            onMove={() => moveTaskForward(task)}
                                            onEdit={() => setEditTask(task)}
                                            onDelete={() => setDeleteTask(task)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-hidden rounded-[24px] border border-[#F0F1F5] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px]">
                            <thead className="border-b border-[#F0F1F5] bg-[#F7F8FA]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#8A9BB8]">Task Title</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#8A9BB8]">Status</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#8A9BB8]">Assignee</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#8A9BB8]">Date</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[#8A9BB8]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F0F1F5]">
                                {tasks.map((task) => (
                                    <tr key={task.id} className="transition-colors hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <div className="text-[13px] font-bold text-[#1A2233]">{task.title || 'Untitled task'}</div>
                                            {task.description && (
                                                <div className="mt-1 max-w-md truncate text-[12px] font-semibold text-[#8A9BB8]">{task.description}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="rounded-lg border border-[#ED6A2E]/10 bg-[#FFF5F2] px-2.5 py-1 text-[11px] font-black uppercase text-[#ED6A2E]">
                                                {taskStatusText(task)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[12px] font-bold text-[#8A9BB8]">
                                            {task.assignedToName || (task.assignedTo ? `Worker #${task.assignedTo}` : '-')}
                                        </td>
                                        <td className="px-6 py-4 text-[12px] font-bold text-[#8A9BB8]">{formatTaskDate(task.deadline)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <IconButton
                                                    label="Move to next status"
                                                    onClick={() => moveTaskForward(task)}
                                                    disabled={taskStatusBucket(task.status) === 'done' || movingTaskId === task.id}
                                                >
                                                    <ChevronRight size={15} />
                                                </IconButton>
                                                <IconButton label="Edit task" onClick={() => setEditTask(task)}>
                                                    <Pencil size={15} />
                                                </IconButton>
                                                <IconButton label="Delete task" onClick={() => setDeleteTask(task)} danger>
                                                    <Trash2 size={15} />
                                                </IconButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showCreate && <TaskFormDialog onClose={() => setShowCreate(false)} />}
            {editTask && <TaskFormDialog task={editTask} onClose={() => setEditTask(null)} />}
            {deleteTask && <TaskDeleteDialog task={deleteTask} onClose={() => setDeleteTask(null)} />}
        </div>
    );
}

function TaskCard({
    task,
    isMoving,
    onMove,
    onEdit,
    onDelete,
}: {
    task: TaskApiModel;
    isMoving: boolean;
    onMove: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="rounded-[24px] border border-[#F0F1F5] bg-white p-5 shadow-[0_2px_12px_rgba(26,34,51,0.04)] transition-all hover:shadow-md">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 rounded-lg bg-[#F5F5FA] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#1A2233]">
                    {task.tagDisplay || task.tag || 'Global'}
                </div>
                <div className="flex items-center gap-1">
                    <IconButton
                        label="Move to next status"
                        onClick={onMove}
                        disabled={taskStatusBucket(task.status) === 'done' || isMoving}
                    >
                        <ChevronRight size={15} />
                    </IconButton>
                    <IconButton label="Edit task" onClick={onEdit}>
                        <Pencil size={15} />
                    </IconButton>
                    <IconButton label="Delete task" onClick={onDelete} danger>
                        <Trash2 size={15} />
                    </IconButton>
                </div>
            </div>

            <h4 className="mb-1 text-[14px] font-bold leading-tight text-[#1A2233]">{task.title || 'Untitled task'}</h4>
            {task.description && (
                <p className="line-clamp-2 text-[12px] font-medium leading-relaxed text-[#8A9BB8]">{task.description}</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase ${statusClass(task.status)}`}>
                    {taskStatusText(task)}
                </span>
                <span className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase ${priorityClass(task.priority)}`}>
                    {task.priorityDisplay || task.priority || 'Medium'}
                </span>
            </div>

            <div className="mt-4 flex flex-col gap-2 text-[10px] font-bold text-[#8A9BB8]">
                <div className="flex items-center gap-1.5">
                    <UserRound size={12} strokeWidth={2.5} />
                    {task.assignedToName || (task.assignedTo ? `Worker #${task.assignedTo}` : 'No assignee')}
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar size={12} strokeWidth={2.5} />
                    {formatTaskDate(task.deadline)}
                </div>
            </div>
        </div>
    );
}

function TaskFormDialog({ task, onClose }: { task?: TaskApiModel; onClose: () => void }) {
    const isEdit = Boolean(task);
    const { data: workers = [] } = useGetWorkersQuery();
    const [createTask, { isLoading: creating }] = useCreateTaskMutation();
    const [updateTask, { isLoading: updating }] = useUpdateTaskMutation();
    const toast = useToast();
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        title: task?.title ?? '',
        description: task?.description ?? '',
        status: task?.status ?? 'todo',
        priority: task?.priority || 'medium',
        tag: task?.tag ?? '',
        deadline: toDateInputValue(task?.deadline),
        assignedTo: task?.assignedTo ?? '',
    });

    const workerOptions = useMemo(() => {
        const options = workers.map((worker) => ({
            value: String(worker.id),
            label: workerLabel(worker),
        }));

        if (form.assignedTo && !options.some((option) => option.value === form.assignedTo)) {
            options.unshift({
                value: form.assignedTo,
                label: task?.assignedToName || `Worker #${form.assignedTo}`,
            });
        }

        return options;
    }, [form.assignedTo, task?.assignedToName, workers]);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');

        const title = form.title.trim();
        if (!title) {
            setError('Task title is required.');
            return;
        }
        if (!isEdit && !form.assignedTo) {
            setError('Select assignee.');
            return;
        }

        try {
            const payload = {
                title,
                description: form.description.trim(),
                status: form.status,
                priority: form.priority || 'medium',
                tag: form.tag.trim(),
                deadline: form.deadline,
                assignedTo: form.assignedTo,
                isCompleted: form.status === 'done',
            };

            if (isEdit && task) {
                await updateTask({ id: task.id, ...payload }).unwrap();
                toast.success('Task updated successfully');
            } else {
                await createTask({
                    ...payload,
                    tag: payload.tag || undefined,
                    deadline: payload.deadline || undefined,
                    assignedTo: payload.assignedTo || undefined,
                }).unwrap();
                toast.success('Task created successfully');
            }
            onClose();
        } catch (err) {
            const message = formatApiError(err, isEdit ? 'Could not update task.' : 'Could not create task.');
            setError(message);
            toast.error(message);
        }
    };

    const isSaving = creating || updating;

    return (
        <ModalShell title={isEdit ? 'Edit task' : 'New task'} onClose={onClose} maxWidthClass="max-w-lg">
            <form onSubmit={submit} className="space-y-4 p-5">
                {error && (
                    <div className="rounded-xl border border-[#E74C3C]/30 bg-[#E74C3C]/10 px-3 py-2 text-[11px] font-semibold text-[#C0392B]">
                        {error}
                    </div>
                )}
                <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Task title"
                    className={inputClass}
                    required
                />
                <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Description"
                    className={`${inputClass} min-h-24 resize-none`}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <CustomSelect
                        value={form.assignedTo}
                        onChange={(value) => setForm({ ...form, assignedTo: value })}
                        placeholder="Assignee"
                        options={workerOptions}
                    />
                    <CustomSelect
                        value={form.status}
                        onChange={(value) => setForm({ ...form, status: value || 'todo' })}
                        placeholder="Status"
                        options={STATUS_OPTIONS}
                    />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <CustomSelect
                        value={form.priority}
                        onChange={(value) => setForm({ ...form, priority: value || 'medium' })}
                        placeholder="Priority"
                        options={PRIORITY_OPTIONS}
                    />
                    <input
                        type="date"
                        value={form.deadline}
                        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                        className={inputClass}
                    />
                </div>
                <input
                    value={form.tag}
                    onChange={(e) => setForm({ ...form, tag: e.target.value })}
                    placeholder="Tag"
                    className={inputClass}
                />
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#8A9BB8] transition-colors hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving || !form.title.trim()}
                        className="rounded-xl bg-[#ED6A2E] px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#D95B24] disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : isEdit ? 'Save' : 'Create'}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

function TaskDeleteDialog({ task, onClose }: { task: TaskApiModel; onClose: () => void }) {
    const [deleteTask, { isLoading }] = useDeleteTaskMutation();
    const toast = useToast();
    const [error, setError] = useState('');

    const submit = async () => {
        setError('');
        try {
            await deleteTask(task.id).unwrap();
            toast.success('Task deleted successfully');
            onClose();
        } catch (err) {
            const message = formatApiError(err, 'Could not delete task.');
            setError(message);
            toast.error(message);
        }
    };

    return (
        <ModalShell title="Delete task" onClose={onClose}>
            <div className="space-y-4 p-5">
                {error && (
                    <div className="rounded-xl border border-[#E74C3C]/30 bg-[#E74C3C]/10 px-3 py-2 text-[11px] font-semibold text-[#C0392B]">
                        {error}
                    </div>
                )}
                <p className="text-[13px] font-semibold text-[#8A9BB8]">
                    Delete <span className="font-black text-[#1A2233]">{task.title || 'this task'}</span>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#8A9BB8] transition-colors hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={isLoading}
                        className="rounded-xl bg-[#E74C3C] px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#C0392B] disabled:opacity-50"
                    >
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

function EmptyTasks({ onCreate }: { onCreate: () => void }) {
    return (
        <div className="rounded-[24px] border border-[#F0F1F5] bg-white py-16 text-center shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
            <ClipboardList size={42} className="mx-auto mb-3 text-[#8A9BB8] opacity-35" />
            <p className="text-[15px] font-black text-[#1A2233]">No tasks yet</p>
            <button
                type="button"
                onClick={onCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#ED6A2E] px-5 py-2.5 text-[13px] font-black text-white transition-colors hover:bg-[#D95B24]"
            >
                <Plus size={17} />
                New Task
            </button>
        </div>
    );
}

function IconButton({
    label,
    children,
    onClick,
    disabled,
    danger,
}: {
    label: string;
    children: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={label}
            aria-label={label}
            className={`rounded-lg border border-[#F0F1F5] p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                danger
                    ? 'text-[#E74C3C] hover:border-[#E74C3C]/30 hover:bg-[#E74C3C]/5'
                    : 'text-[#8A9BB8] hover:border-[#ED6A2E]/20 hover:bg-[#FFF5F2] hover:text-[#ED6A2E]'
            }`}
        >
            {children}
        </button>
    );
}

const inputClass =
    'w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] px-4 py-3 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none transition-colors focus:border-[#ED6A2E] focus:bg-white';

function taskStatusBucket(status: string): StatusId {
    return STATUS_COLUMNS.some((column) => column.id === status) ? status as StatusId : 'todo';
}

function nextStatus(status: string): StatusId {
    const order = STATUS_COLUMNS.map((column) => column.id);
    const index = order.indexOf(taskStatusBucket(status));
    return order[Math.min(order.length - 1, Math.max(0, index) + 1)];
}

function taskStatusText(task: TaskApiModel): string {
    return task.statusDisplay || STATUS_OPTIONS.find((option) => option.value === taskStatusBucket(task.status))?.label || task.status.replace(/_/g, ' ');
}

function statusClass(status: string): string {
    switch (taskStatusBucket(status)) {
        case 'done':
            return 'bg-[#E9FAF0] text-[#2ECC81]';
        case 'in_progress':
            return 'bg-[#FFF5F2] text-[#ED6A2E]';
        case 'review':
            return 'bg-[#F6EEFB] text-[#9B59B6]';
        default:
            return 'bg-[#EEF2FF] text-[#4C6FFF]';
    }
}

function priorityClass(priority: string): string {
    switch ((priority || '').toLowerCase()) {
        case 'high':
            return 'bg-[#FDECEC] text-[#E74C3C]';
        case 'low':
            return 'bg-[#E9FAF0] text-[#2ECC81]';
        default:
            return 'bg-[#F5F6FA] text-[#8A9BB8]';
    }
}

function toDateInputValue(value?: string): string {
    if (!value) return '';
    return value.slice(0, 10);
}

function formatTaskDate(value?: string): string {
    const date = toDateInputValue(value);
    if (!date) return 'No deadline';
    const parts = date.split('-');
    if (parts.length !== 3) return date;
    const [year, month, day] = parts;
    return `${day}.${month}.${year}`;
}

function workerLabel(worker: AdminModel): string {
    return worker.fullName || `${worker.firstName ?? ''} ${worker.lastName ?? ''}`.trim() || worker.roleDisplay || worker.role || `Worker #${worker.id}`;
}
