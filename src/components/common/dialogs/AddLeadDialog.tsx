import { useMemo, useState } from 'react';
import {
    X, UserPlus, User, Phone, MessageCircle, Check, ChevronDown,
    Calendar, Clock,
} from 'lucide-react';
import {
    useCreateLeadMutation,
    useGetLeadChoicesQuery,
    useLazyVerifyLeadPersistedQuery,
} from '../../../store/api/leadApi';
import { useGetBranchesQuery } from '../../../store/api/settingsApi';
import { getSelectedBranchId, getSelectedBranchName } from '../../../utils/branchContext';
import { formatApiError } from '../../../utils/apiError';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '../modalStyles';
import CustomSelect from '../CustomSelect';
import UzbekPhoneInput from '../UzbekPhoneInput';
import { useToast } from '../../../hooks/useToast';
import type { LidModel } from '../../../types';
import {
    formatUzbekPhoneForApi,
    isUzbekPhoneComplete,
} from '../../../utils/uzbekPhone';

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
    const [verifyLead] = useLazyVerifyLeadPersistedQuery();
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
        trialGroupId: '',
        date: '',
        time: '',
        note: '',
    });
    const [error, setError] = useState('');
    const toast = useToast();

    const sources = (choices?.sources?.length
        ? choices.sources
        : [
              { value: 'telegram', label: 'Telegram' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'walk_in', label: 'Walk in' },
          ]
    ).filter((s) => s.value?.trim() && s.label?.trim());

    const defaultGenders = [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
    ];
    const apiGenders = (choices?.genders ?? []).filter(
        (g) => g.value?.trim() && g.label?.trim(),
    );
    const genders = apiGenders.length ? apiGenders : defaultGenders;

    const statuses = (choices?.statuses?.length
        ? choices.statuses
        : [
              { value: 'lead', label: 'Lead' },
              { value: 'waiting', label: 'Waiting' },
              { value: 'call', label: 'Call' },
              { value: 'archive', label: 'Archive' },
          ]
    ).filter((s) => s.value?.trim() && s.label?.trim());

    const trialGroups = (choices?.groups ?? [])
        .map((g) => ({ value: String(g.id), label: g.name }))
        .filter((g) => g.value && g.label);

    const branches = useMemo(() => {
        if (branchesRaw.length === 0) return FALLBACK_BRANCHES;
        return branchesRaw.map((b) => ({
            id: String(b['id'] ?? b['branch_id'] ?? ''),
            name: String(b['name'] ?? b['title'] ?? 'Branch'),
        }));
    }, [branchesRaw]);

    const canSubmit = !!form.name.trim() && isUzbekPhoneComplete(form.phone);

    const isLoading = creating;

    const submit = async () => {
        if (!canSubmit) return;
        setError('');

        const headerBranchId = getSelectedBranchId() || '1';
        const branchId = headerBranchId;
        const branchNum = Number(branchId);
        if (!branchNum || Number.isNaN(branchNum)) {
            setError('Select a valid branch (same as in the top bar).');
            return;
        }

        try {
        const commentParts: string[] = [];
        if (form.note.trim()) commentParts.push(form.note.trim());

        const selectedStatus = (form.status || 'lead').toLowerCase();
        const target = selectedLeadTarget(selectedStatus);
        const needsQualification = target.stage === 'waiting' || target.stage === 'call';
        const withTrialSchedule = needsQualification && Boolean(form.date && form.time);
        if (needsQualification && !form.branchId) {
            setError('Select branch for Waiting or Call status.');
            return;
        }
        if (needsQualification && form.goal === 'trial_lesson' && !form.trialGroupId) {
            setError('Select trial group.');
            return;
        }
        if (needsQualification && (!form.date || !form.time)) {
            setError('Date and time are required for Waiting or Call.');
            return;
        }

        const phoneApi = formatUzbekPhoneForApi(form.phone);
        if (!phoneApi) {
            setError('Enter a valid 9-digit phone number.');
            return;
        }

        const saved = await createLead({
            firstName: form.name.trim(),
            phone: phoneApi,
            status: selectedStatus,
            source: form.source || undefined,
            gender: form.gender || undefined,
            branch: needsQualification || target.stage !== 'lead' ? branchNum : undefined,
            comment: commentParts.join('\n') || undefined,
            goal: needsQualification ? form.goal : undefined,
            preferredDays: needsQualification ? form.prefDays : undefined,
            preferredTime: needsQualification ? form.prefTime : undefined,
            telegramUsername: form.telegram.trim() || undefined,
            scheduledDate: withTrialSchedule ? form.date : undefined,
            scheduledTime: withTrialSchedule ? form.time : undefined,
            trialGroup:
                needsQualification && form.goal === 'trial_lesson'
                    ? Number(form.trialGroupId) || form.trialGroupId
                    : undefined,
            came: target.came,
            giveBook: false,
        }).unwrap();

        if (saved?.id == null || saved.id <= 0) {
            throw new Error('Server did not return a valid lead id. API may not be connected.');
        }

        const verified = await verifyLead({
            phone: phoneApi,
            id: saved.id,
        }).unwrap();

        if (!verified) {
            throw new Error(
                `Lead #${saved.id} was created but not found in branch "${getSelectedBranchName() ?? branchId}". ` +
                'Check the branch in the top bar matches the form.',
            );
        }

        const finalStatus = (saved.status ?? selectedStatus).toLowerCase();
        const displayLead = {
            ...verified,
            status: finalStatus,
            came: saved.came ?? verified.came ?? target.came,
            isArchived: finalStatus === 'archive' || verified.isArchived,
        };

        /*
            toast.info(
                `Lead #${saved.id} created. Backend kept stage "${finalStatus}" — ` +
                'only POST /lead/{id}/move/ can change stage on server.',
            );
        */

        onCreated?.(displayLead);
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
                        <UzbekPhoneInput
                            icon={Phone}
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

                    {/* Trial group */}
                    <FieldLabel label="Trial group">
                        <SelectBox
                            placeholder="Select trial group"
                            value={form.trialGroupId}
                            onChange={(v) => setForm({ ...form, trialGroupId: v })}
                            options={trialGroups}
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

function selectedLeadTarget(status: string): { stage: string; came?: boolean } {
    const raw = status.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (['came', 'arrived', 'attended', 'present'].includes(raw)) {
        return { stage: 'waiting', came: true };
    }
    if (['not_came', 'notcame', 'did_not_come', 'absent', 'missed'].includes(raw)) {
        return { stage: 'waiting', came: false };
    }
    if (['scheduled', 'pending', 'in_waiting', 'on_hold'].includes(raw)) {
        return { stage: 'waiting' };
    }
    if (['new', 'leads'].includes(raw)) {
        return { stage: 'lead' };
    }
    if (['calling', 'calls'].includes(raw)) {
        return { stage: 'call' };
    }
    if (raw === 'archived') {
        return { stage: 'archive' };
    }
    return { stage: raw || 'lead' };
}

function leadMatchesSelectedStatus(lead: LidModel, selectedStatus: string): boolean {
    const target = selectedLeadTarget(selectedStatus);
    const actual = selectedLeadTarget(lead.status ?? '').stage;
    if (target.came !== undefined) {
        return actual === target.stage && lead.came === target.came;
    }
    return actual === target.stage;
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
                <div className="absolute left-0 right-0 top-14 z-[200] rounded-xl border border-gray-100 bg-white shadow-lg max-h-56 overflow-y-auto">
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
