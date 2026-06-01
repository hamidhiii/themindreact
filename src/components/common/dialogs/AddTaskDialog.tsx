import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
    X, CheckCircle2, Type, User, UserPlus2, Calendar, ChevronDown, Check,
} from 'lucide-react';
import { useCreateTaskMutation } from '../../../store/api/taskApi';
import { useGetWorkersQuery } from '../../../store/api/workerApi';
import { formatApiError } from '../../../utils/apiError';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '../modalStyles';
import { useToast } from '../../../hooks/useToast';
import type { RootState } from '../../../store/store';

type Priority = 'low' | 'medium' | 'high';

interface AddTaskDialogProps {
    onClose: () => void;
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: '#2ECC8A' },
    { value: 'medium', label: 'Medium', color: '#ED6A2E' },
    { value: 'high', label: 'High', color: '#E74C3C' },
];

export default function AddTaskDialog({ onClose }: AddTaskDialogProps) {
    const { username } = useSelector((s: RootState) => s.auth);
    const { data: workers = [] } = useGetWorkersQuery();
    const [createTask, { isLoading }] = useCreateTaskMutation();
    const toast = useToast();

    const [title, setTitle] = useState('');
    const [recipientId, setRecipientId] = useState('');
    const [recipientOpen, setRecipientOpen] = useState(false);
    const [priority, setPriority] = useState<Priority>('medium');
    const [deadline, setDeadline] = useState('');
    const [showRecipientError, setShowRecipientError] = useState(false);
    const [error, setError] = useState('');

    const recipientName = workers.find((w) => String(w.id) === recipientId);
    const recipientLabel = recipientName
        ? `${recipientName.firstName ?? ''} ${recipientName.lastName ?? ''}`.trim() || recipientName.roleDisplay || recipientName.role
        : '';

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!title.trim()) return;
        if (!recipientId) {
            setShowRecipientError(true);
            return;
        }
        try {
            await createTask({
                title: title.trim(),
                description: '',
                status: 'todo',
                priority,
                deadline: deadline || undefined,
                assignedTo: recipientId,
                isCompleted: false,
            }).unwrap();
            toast.success('Task created successfully');
            onClose();
        } catch (err) {
            setError(formatApiError(err, 'Could not create task.'));
            toast.error(formatApiError(err, 'Could not create task.'));
        }
    };

    const priorityColor = PRIORITIES.find((p) => p.value === priority)?.color ?? '#ED6A2E';

    return (
        <div className={MODAL_OVERLAY_CLASS}>
            <div className={`w-full max-w-md rounded-3xl ${MODAL_PANEL_CLASS} animate-in zoom-in-95 duration-200`}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#ED6A2E]/10 flex items-center justify-center">
                            <CheckCircle2 size={20} className="text-[#ED6A2E]" />
                        </div>
                        <div>
                            <h2 className="text-[18px] font-extrabold text-[#1A2233] leading-tight">New Task</h2>
                            <p className="text-[12px] font-bold text-[#8A9BB8] mt-0.5">Fill in the task details</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-[#8A9BB8] hover:bg-gray-50 hover:text-[#1A2233] transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit} className="p-5 pt-3 space-y-4">
                    {error && (
                        <div className="rounded-xl border border-[#E74C3C]/30 bg-[#E74C3C]/10 px-3 py-2 text-[11px] font-semibold text-[#C0392B]">
                            {error}
                        </div>
                    )}
                    <Field icon={Type} label="TASK TITLE">
                        <div className="relative">
                            <Type
                                size={16}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8] pointer-events-none"
                            />
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter title..."
                                className="w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] pl-11 pr-4 py-3 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none focus:border-[#ED6A2E]/50 focus:bg-white transition-colors"
                                autoFocus
                                required
                            />
                        </div>
                    </Field>

                    <Field icon={User} label="FROM">
                        <div className="flex items-center gap-2 rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] px-4 py-3">
                            <User size={16} className="text-[#8A9BB8]" />
                            <span className="text-[13px] font-bold text-[#1A2233]">
                                {username || 'You'}
                            </span>
                        </div>
                    </Field>

                    <Field icon={UserPlus2} label="FOR" error={showRecipientError && !recipientId ? 'Select recipient' : undefined}>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setRecipientOpen((v) => !v)}
                                className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-white px-4 py-3 text-left transition-colors ${
                                    showRecipientError && !recipientId
                                        ? 'border-[#ED6A2E] bg-[#ED6A2E]/5'
                                        : 'border-[#F0F1F5] hover:border-[#ED6A2E]/40'
                                }`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <UserPlus2
                                        size={16}
                                        className={recipientId ? 'text-[#ED6A2E]' : 'text-[#8A9BB8]'}
                                    />
                                    <span className={`text-[13px] font-bold truncate ${recipientId ? 'text-[#1A2233]' : 'text-[#8A9BB8]'}`}>
                                        {recipientLabel || 'Who is this task for?'}
                                    </span>
                                </div>
                                <ChevronDown size={14} className="text-[#8A9BB8] shrink-0" />
                            </button>
                            {recipientOpen && (
                                <div className="absolute left-0 right-0 top-14 z-10 max-h-64 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg">
                                    {workers.length === 0 ? (
                                        <div className="px-4 py-3 text-[12px] font-bold text-[#8A9BB8] text-center">
                                            No workers
                                        </div>
                                    ) : (
                                        workers.map((w) => {
                                            const label = `${w.firstName ?? ''} ${w.lastName ?? ''}`.trim() || w.roleDisplay || w.role;
                                            return (
                                                <button
                                                    key={w.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setRecipientId(String(w.id));
                                                        setRecipientOpen(false);
                                                        setShowRecipientError(false);
                                                    }}
                                                    className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[13px] font-bold text-[#1A2233] hover:bg-[#F8F9FB] transition-colors"
                                                >
                                                    <span>{label}</span>
                                                    {String(w.id) === recipientId && <Check size={14} className="text-[#ED6A2E]" />}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </Field>

                    <Field icon={undefined} label="PRIORITY">
                        <div className="grid grid-cols-3 gap-2">
                            {PRIORITIES.map((p) => {
                                const active = priority === p.value;
                                return (
                                    <button
                                        key={p.value}
                                        type="button"
                                        onClick={() => setPriority(p.value)}
                                        className={`relative flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 text-[12px] font-black transition-all ${
                                            active
                                                ? 'bg-white shadow-sm'
                                                : 'bg-[#F8F9FB] border-transparent text-[#8A9BB8] hover:border-gray-200'
                                        }`}
                                        style={{
                                            borderColor: active ? p.color : undefined,
                                            color: active ? p.color : undefined,
                                        }}
                                    >
                                        <span
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ backgroundColor: p.color }}
                                        />
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>
                    </Field>

                    <Field icon={Calendar} label="DEADLINE">
                        <div className="relative">
                            <Calendar
                                size={16}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8] pointer-events-none"
                            />
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                placeholder="Select date..."
                                className="w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] pl-11 pr-4 py-3 text-[13px] font-bold text-[#1A2233] outline-none focus:border-[#ED6A2E]/50 focus:bg-white transition-colors"
                            />
                        </div>
                    </Field>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[#F0F1F5]">
                    <span
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider"
                        style={{
                            backgroundColor: `${priorityColor}1A`,
                            color: priorityColor,
                        }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: priorityColor }}
                        />
                        {PRIORITIES.find((p) => p.value === priority)?.label}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#8A9BB8] hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={submit}
                            disabled={isLoading || !title.trim()}
                            className="flex items-center gap-1.5 rounded-xl bg-[#ED6A2E] px-5 py-2.5 text-[13px] font-black text-white hover:bg-[#D95B24] disabled:opacity-50 transition-all"
                        >
                            <Check size={14} strokeWidth={3} />
                            {isLoading ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const inputClass =
    'w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] px-4 py-3 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none focus:border-[#ED6A2E]/50 focus:bg-white transition-colors';

function Field({
    label,
    children,
    error,
}: {
    label: string;
    icon?: typeof User;
    children: React.ReactNode;
    error?: string;
}) {
    return (
        <div className="space-y-1.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#8A9BB8] px-1">
                {label}
            </div>
            {children}
            {error && (
                <p className="text-[11px] font-bold text-[#ED6A2E] px-1">{error}</p>
            )}
        </div>
    );
}
