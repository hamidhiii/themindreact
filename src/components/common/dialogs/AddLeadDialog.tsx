import { useMemo, useState } from 'react';
import {
    X, UserPlus, User, Phone, MessageCircle, Check, ChevronDown,
    Calendar, Clock,
} from 'lucide-react';
import {
    useCreateLeadMutation,
    useGetLeadChoicesQuery,
    useMoveLeadToWaitingMutation,
    useUpdateLeadStatusMutation,
} from '../../../store/api/leadApi';
import { useGetBranchesQuery } from '../../../store/api/settingsApi';
import { getSelectedBranchId } from '../../../utils/branchContext';
import { formatApiError } from '../../../utils/apiError';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '../modalStyles';
import CustomSelect from '../CustomSelect';
import { useToast } from '../../../hooks/useToast';
import type { LidModel } from '../../../types';

type Goal = 'trial_lesson' | 'level_test' | 'consultation';
type PrefDay = 'mon_wed_fri' | 'tue_thu_sat' | 'every_day';
type PrefTime = 'morning' | 'afternoon' | 'evening' | 'any_time';

const GOALS: { value: Goal; label: string }[] = [
    { value: 'trial_lesson', label: 'Trial lesson' },
    { value: 'level_test', label: 'Test' },
    { value: 'consultation', label: 'Consultation' },
];

const PREF_DAYS: { value: PrefDay; label: string }[] = [
    { value: 'mon_wed_fri', label: 'Mon-Wed-Fri' },
    { value: 'tue_thu_sat', label: 'Tue-Thu-Sat' },
    { value: 'every_day', label: 'Every day' },
];

const PREF_TIMES: { value: PrefTime; label: string }[] = [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' },
    { value: 'any_time', label: 'Any time' },
];

const FALLBACK_BRANCHES = [
    { id: '1', name: 'Main' },
    { id: '2', name: 'C1' },
    { id: '3', name: 'Chilanzar' },
    { id: '4', name: 'Yunusabad' },
    { id: '5', name: 'Sergeli' },
    { id: '6', name: 'Almazar' },
];

export default function AddLeadDialog({
    onClose,
    onSuccess,
    onRefetch,
    onCreated,
}: {
    onClose: () => void;
    onSuccess?: () => void;
    onRefetch?: () => Promise<unknown>;
    onCreated?: (lead: LidModel) => void;
}) {
    const [createLead, { isLoading: creating }] = useCreateLeadMutation();
    const [moveLeadToWaiting, { isLoading: moving }] = useMoveLeadToWaitingMutation();
    const [updateLeadStatus, { isLoading: updatingStatus }] = useUpdateLeadStatusMutation();
    const { data: choices } = useGetLeadChoicesQuery();
    const { data: branchesRaw = [] } = useGetBranchesQuery();

    const [form, setForm] = useState({
        name: '',
        phone: '',
        telegram: '',
        source: '',
        gender: '',
        branchId: getSelectedBranchId() ?? '',
        status: 'lead',
        goal: 'trial_lesson' as Goal,
        prefDays: 'mon_wed_fri' as PrefDay,
        prefTime: 'afternoon' as PrefTime,
        whichBranchId: '',
        date: '',
        time: '',
        note: '',
    });
    const [error, setError] = useState('');
    const toast = useToast();

    const sources = choices?.sources?.length
        ? choices.sources
        : [
              { value: 'telegram', label: 'Telegram' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'walk_in', label: 'Walk in' },
          ];

    const genders = choices?.genders?.length
        ? choices.genders
        : [
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
          ];

    const statuses = choices?.statuses?.length
        ? choices.statuses
        : [
              { value: 'lead', label: 'Lead' },
              { value: 'waiting', label: 'Waiting' },
              { value: 'call', label: 'Call' },
              { value: 'came', label: 'Came' },
          ];

    const branches = useMemo(() => {
        if (branchesRaw.length === 0) return FALLBACK_BRANCHES;
        return branchesRaw.map((b) => ({
            id: String(b['id'] ?? b['branch_id'] ?? ''),
            name: String(b['name'] ?? b['title'] ?? 'Branch'),
        }));
    }, [branchesRaw]);

    const canSubmit = !!form.name.trim() && !!form.phone.trim();

    const isLoading = creating || moving || updatingStatus;

    const submit = async () => {
        if (!canSubmit) return;
        setError('');

        const headerBranchId = getSelectedBranchId() || '1';
        const branchId = headerBranchId;
        const preferredBranchId = form.whichBranchId || form.branchId || headerBranchId;
        const branchNum = Number(branchId);
        if (!branchNum || Number.isNaN(branchNum)) {
            setError('Select a valid branch (same as in the top bar).');
            return;
        }

        try {
        const commentParts: string[] = [];
        if (form.note.trim()) commentParts.push(form.note.trim());

        const initialStatus = form.status || 'lead';
        const hasSchedule = Boolean(form.date && form.time);

        const created = await createLead({
            firstName: form.name.trim(),
            phone: form.phone.trim(),
            status: hasSchedule ? 'lead' : initialStatus,
            source: form.source || undefined,
            gender: form.gender || undefined,
            branch: branchNum,
            comment: commentParts.join('\n') || undefined,
            goal: form.goal,
            preferredDays: form.prefDays,
            preferredTime: form.prefTime,
            telegramUsername: form.telegram.trim() || undefined,
            scheduledDate: form.date || undefined,
            scheduledTime: form.time || undefined,
            preferredBranchId,
            giveBook: false,
        }).unwrap();

        if (created?.id == null) {
            throw new Error('Lead was saved but the server did not return an id. Click Refresh.');
        }

        if (hasSchedule) {
            try {
                await moveLeadToWaiting({
                    id: created.id,
                    preferredBranchId,
                    scheduledDate: form.date,
                    scheduledTime: form.time,
                    goal: form.goal,
                    preferredDays: form.prefDays,
                    preferredTime: form.prefTime,
                    comment: commentParts.join('\n') || undefined,
                    firstName: form.name.trim(),
                    telegramUsername: form.telegram.trim() || undefined,
                }).unwrap();
            } catch {
                await updateLeadStatus({ id: created.id, status: 'waiting' }).unwrap();
            }
        } else if (initialStatus === 'waiting') {
            await updateLeadStatus({ id: created.id, status: 'waiting' }).unwrap();
        } else if (initialStatus !== 'lead') {
            await updateLeadStatus({ id: created.id, status: initialStatus }).unwrap();
        }

        const finalStatus = hasSchedule ? 'waiting' : (initialStatus || 'lead');

        onCreated?.({
            id: created.id,
            firstName: form.name.trim(),
            phone: form.phone.trim(),
            status: finalStatus,
            source: form.source || undefined,
            comment: commentParts.join('\n') || undefined,
            branch: branchNum,
            gender: form.gender || undefined,
            giveBook: false,
            goal: form.goal,
            preferredDays: form.prefDays.replace(/_/g, '-'),
            preferredTimeSlot: form.prefTime,
            telegramUsername: form.telegram.trim() || undefined,
            scheduledDate: form.date || undefined,
            scheduledTime: form.time || undefined,
            createdAt: new Date().toISOString(),
        });

        await onRefetch?.();
        onSuccess?.();
        toast.success('Lead created successfully');
        onClose();
        } catch (err) {
            setError(formatApiError(err, 'Could not create lead.'));
            toast.error(formatApiError(err, 'Could not create lead.'));
        }
    };

    return (
        <div className={MODAL_OVERLAY_CLASS}>
            <div className={`w-full max-w-lg rounded-3xl ${MODAL_PANEL_CLASS} animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#ED6A2E]/10 flex items-center justify-center">
                            <UserPlus size={20} className="text-[#ED6A2E]" />
                        </div>
                        <div>
                            <h2 className="text-[18px] font-extrabold text-[#1A2233]">New Lead</h2>
                            <p className="text-[12px] font-bold text-[#8A9BB8] mt-0.5">Fill in the lead details</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-[#8A9BB8] hover:bg-gray-50 hover:text-[#1A2233]"
                    >
                        <X size={18} />
                    </button>
                </div>

                {error && (
                    <div className="mx-5 mb-2 rounded-xl border border-[#E74C3C]/30 bg-[#E74C3C]/10 px-3 py-2 text-[11px] font-semibold text-[#C0392B]">
                        {error}
                    </div>
                )}

                {/* Body */}
                <div className="px-5 flex-1 overflow-y-auto min-h-0 space-y-4">
                    {/* Name + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputBox
                            icon={User}
                            placeholder="Name"
                            value={form.name}
                            onChange={(v) => setForm({ ...form, name: v })}
                            autoFocus
                        />
                        <InputBox
                            icon={Phone}
                            placeholder="Phone"
                            value={form.phone}
                            onChange={(v) => setForm({ ...form, phone: v })}
                        />
                    </div>

                    {/* Telegram */}
                    <InputBox
                        icon={MessageCircle}
                        iconColor="#229ED9"
                        placeholder="Telegram (optional)"
                        value={form.telegram}
                        onChange={(v) => setForm({ ...form, telegram: v })}
                    />

                    {/* Source / Gender */}
                    <div className="grid grid-cols-2 gap-3">
                        <FieldLabel label="Source">
                            <SelectBox
                                placeholder="Select source"
                                value={form.source}
                                onChange={(v) => setForm({ ...form, source: v })}
                                options={sources}
                            />
                        </FieldLabel>
                        <FieldLabel label="Gender">
                            <SelectBox
                                placeholder="Select gender"
                                value={form.gender}
                                onChange={(v) => setForm({ ...form, gender: v })}
                                options={genders}
                            />
                        </FieldLabel>
                    </div>

                    {/* Branch / Status */}
                    <div className="grid grid-cols-2 gap-3">
                        <FieldLabel label="Branch">
                            <SelectBox
                                placeholder="Select branch"
                                value={form.branchId}
                                onChange={(v) => setForm({ ...form, branchId: v })}
                                options={branches.map((b) => ({ value: b.id, label: b.name }))}
                            />
                        </FieldLabel>
                        <FieldLabel label="Status">
                            <StatusChip
                                value={form.status}
                                options={statuses}
                                onChange={(v) => setForm({ ...form, status: v })}
                                onClear={() => setForm({ ...form, status: 'lead' })}
                            />
                        </FieldLabel>
                    </div>

                    {/* Goal pills */}
                    <FieldLabel label="Goal">
                        <PillRow
                            value={form.goal}
                            options={GOALS}
                            onChange={(v) => setForm({ ...form, goal: v as Goal })}
                        />
                    </FieldLabel>

                    {/* Preferred days */}
                    <FieldLabel label="Preferred days">
                        <PillRow
                            value={form.prefDays}
                            options={PREF_DAYS}
                            onChange={(v) => setForm({ ...form, prefDays: v as PrefDay })}
                        />
                    </FieldLabel>

                    {/* Preferred time */}
                    <FieldLabel label="Preferred time">
                        <PillRow
                            value={form.prefTime}
                            options={PREF_TIMES}
                            onChange={(v) => setForm({ ...form, prefTime: v as PrefTime })}
                        />
                    </FieldLabel>

                    {/* Which branch */}
                    <FieldLabel label="Which branch?">
                        <PillRow
                            value={form.whichBranchId}
                            options={branches.map((b) => ({ value: b.id, label: b.name }))}
                            onChange={(v) => setForm({ ...form, whichBranchId: v })}
                        />
                    </FieldLabel>

                    {/* Date / Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <InputBox
                            icon={Calendar}
                            placeholder="Date *"
                            type="date"
                            value={form.date}
                            onChange={(v) => setForm({ ...form, date: v })}
                        />
                        <InputBox
                            icon={Clock}
                            placeholder="Time *"
                            type="time"
                            value={form.time}
                            onChange={(v) => setForm({ ...form, time: v })}
                        />
                    </div>

                    {/* Note */}
                    <textarea
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        placeholder="Additional note (optional)"
                        rows={3}
                        className="w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] px-4 py-3 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none focus:border-[#ED6A2E]/50 focus:bg-white transition-colors resize-y min-h-20"
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#F0F1F5] shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#8A9BB8] hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={isLoading || !canSubmit}
                        className="rounded-xl bg-[#ED6A2E] px-6 py-2.5 text-[13px] font-black text-white hover:bg-[#D95B24] disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function FieldLabel({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <div className="text-[12px] font-bold text-[#5A6376] px-1">{label}</div>
            {children}
        </div>
    );
}

function InputBox({
    icon: Icon,
    placeholder,
    value,
    onChange,
    type = 'text',
    autoFocus,
    iconColor,
}: {
    icon: typeof User;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    autoFocus?: boolean;
    iconColor?: string;
}) {
    return (
        <div className="relative">
            <Icon
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: iconColor ?? '#8A9BB8' }}
            />
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className="w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] pl-11 pr-4 py-3 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none focus:border-[#ED6A2E]/50 focus:bg-white transition-colors"
            />
        </div>
    );
}

function SelectBox({
    value,
    onChange,
    options,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}) {
    return (
        <CustomSelect
            value={value}
            onChange={onChange}
            options={options}
            placeholder={placeholder ?? 'Select…'}
        />
    );
}

function StatusChip({
    value,
    options,
    onChange,
    onClear,
}: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
    onClear: () => void;
}) {
    const [open, setOpen] = useState(false);
    const current = options.find((o) => o.value === value);
    return (
        <div className="relative">
            <div className="w-full flex items-center rounded-xl border-2 border-[#F37021] bg-white overflow-hidden">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="flex-1 px-4 py-2.5 text-left text-[11px] font-extrabold text-[#F37021]"
                >
                    {current?.label ?? 'Lead'}
                </button>
                <button
                    type="button"
                    onClick={onClear}
                    className="px-3 py-2.5 text-[#F37021] hover:bg-[#F37021]/10 transition-colors"
                    aria-label="Clear status"
                >
                    <X size={13} />
                </button>
            </div>
            {open && (
                <div className="absolute left-0 right-0 top-14 z-10 rounded-xl border border-gray-100 bg-white shadow-lg">
                    {options.map((o) => (
                        <button
                            key={o.value}
                            type="button"
                            onClick={() => {
                                onChange(o.value);
                                setOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-[13px] font-bold transition-colors hover:bg-[#F8F9FB] ${
                                o.value === value ? 'text-[#ED6A2E]' : 'text-[#1A2233]'
                            }`}
                        >
                            <span>{o.label}</span>
                            {o.value === value && <Check size={14} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function PillRow({
    value,
    options,
    onChange,
}: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((o) => {
                const active = o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        onClick={() => onChange(o.value)}
                        className={`px-4 py-2 rounded-xl border text-[12px] font-bold transition-all ${
                            active
                                ? 'border-[#ED6A2E] bg-[#ED6A2E]/10 text-[#ED6A2E]'
                                : 'border-[#F0F1F5] bg-white text-[#5A6376] hover:border-gray-200'
                        }`}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}
