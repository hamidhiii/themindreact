import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    Plus, Search, RotateCcw,
    Clock, PhoneIncoming, Archive, Zap,
} from 'lucide-react';
import {
    useGetLeadsQuery,
    useDeleteLeadMutation,
    useUpdateLeadMutation,
    useUpdateLeadStatusMutation,
    useGetLeadChoicesQuery,
    useArchiveLeadMutation,
    useMoveLeadToWaitingMutation,
} from '../../store/api/leadApi';
import ModalShell from '../../components/common/ModalShell';
import CustomSelect from '../../components/common/CustomSelect';
import AddLeadDialog from '../../components/common/dialogs/AddLeadDialog';
import LeadCard from '../../components/leads/LeadCard';
import { useToast } from '../../hooks/useToast';
import type { LidModel, LeadPipelineSummary } from '../../types';
import { getSelectedBranchId, subscribeBranch } from '../../utils/branchContext';

interface LeadColumn {
    id: string;
    matchStatuses: string[];
    label: string;
    description: string;
    color: string;
    gradientFrom: string;
    icon: LucideIcon;
}

const COLUMNS: LeadColumn[] = [
    {
        id: 'lead',
        matchStatuses: ['lead', 'new'],
        label: 'Leads',
        description: 'New contacts waiting for the first touch.',
        color: '#F37021',
        gradientFrom: '#FFF5F0',
        icon: Zap,
    },
    {
        id: 'waiting',
        matchStatuses: ['waiting', 'trial_lesson', 'trial', 'scheduled', 'pending'],
        label: 'Waiting',
        description: 'Pending confirmation and next follow up.',
        color: '#9B59B6',
        gradientFrom: '#F5F0FF',
        icon: Clock,
    },
    {
        id: 'call',
        matchStatuses: ['call', 'calling'],
        label: 'Call',
        description: 'Each lead needs 3 logged calls before final decision.',
        color: '#4C6FFF',
        gradientFrom: '#EEF2FF',
        icon: PhoneIncoming,
    },
    {
        id: 'archive',
        matchStatuses: ['archive', 'archived', 'came', 'not_came', 'no_answer'],
        label: 'Archive',
        description: 'Closed leads stored with outcome codes.',
        color: '#8A9BB8',
        gradientFrom: '#F5F6FA',
        icon: Archive,
    },
];

const CALL_FILTERS = [
    { id: 'all', label: 'All calls' },
    { id: 'none', label: 'Not called' },
    { id: '1', label: '1 call' },
    { id: '2', label: '2 call' },
    { id: '3', label: '3 calls' },
] as const;

type CallFilter = (typeof CALL_FILTERS)[number]['id'];

function isStatusInColumn(status: string, col: LeadColumn): boolean {
    return col.matchStatuses.includes(status);
}

function leadPlacedElsewhere(lead: LidModel): boolean {
    const status = lead.status?.toLowerCase() ?? '';
    if (!status) return false;
    return COLUMNS.some((c) => c.id !== 'lead' && isStatusInColumn(status, c));
}

function leadInColumn(lead: LidModel, col: LeadColumn): boolean {
    const status = lead.status?.toLowerCase() ?? '';
    const hasSchedule = Boolean(lead.scheduledDate || lead.scheduledTime);

    if (col.id === 'archive') {
        return Boolean(lead.isArchived) || isStatusInColumn(status, col);
    }

    if (col.id === 'waiting') {
        if (isStatusInColumn(status, col)) return true;
        if (hasSchedule && !['call', 'calling', 'archive', 'archived'].includes(status)) return true;
        return false;
    }

    if (col.id === 'call') {
        return isStatusInColumn(status, col);
    }

    if (lead.isArchived) return false;
    if (hasSchedule) return false;
    if (isStatusInColumn(status, col)) return true;
    if (!status || status === 'lead' || status === 'new') return true;
    return !leadPlacedElsewhere(lead);
}

function matchesCallFilter(lead: LidModel, filter: CallFilter): boolean {
    const count = lead.callCount ?? 0;
    if (filter === 'all') return true;
    if (filter === 'none') return count === 0;
    return count === Number(filter);
}

function countByColumn(leads: LidModel[], col: LeadColumn): number {
    return leads.filter((l) => leadInColumn(l, col)).length;
}

export default function LeadsPage() {
    const [search, setSearch] = useState('');
    const [callFilter, setCallFilter] = useState<CallFilter>('all');
    const [branchId, setBranchId] = useState(() => getSelectedBranchId() ?? '1');
    const [optimisticLeads, setOptimisticLeads] = useState<LidModel[]>([]);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingLead, setEditingLead] = useState<LidModel | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const { success: toastSuccess, error: toastError } = useToast();

    useEffect(() => {
        return subscribeBranch(() => setBranchId(getSelectedBranchId() ?? '1'));
    }, []);

    const { data: leads = [], isLoading, isFetching, refetch } = useGetLeadsQuery(
        {
            branchId,
            search: search.trim() || undefined,
            callFilter,
        },
        { refetchOnMountOrArgChange: true },
    );

    useEffect(() => {
        if (!optimisticLeads.length) return;
        setOptimisticLeads((prev) =>
            prev.filter((o) => o.id == null || !leads.some((l) => l.id === o.id)),
        );
    }, [leads, optimisticLeads.length]);
    const { data: choices } = useGetLeadChoicesQuery();
    const [updateLead] = useUpdateLeadMutation();
    const [deleteLead] = useDeleteLeadMutation();
    const [updateLeadStatus] = useUpdateLeadStatusMutation();
    const [archiveLead] = useArchiveLeadMutation();
    const [moveLeadToWaiting] = useMoveLeadToWaitingMutation();

    const mergedLeads = useMemo(() => {
        const byId = new Map<number, LidModel>();
        for (const lead of leads) {
            if (lead.id != null) byId.set(lead.id, lead);
        }
        for (const lead of optimisticLeads) {
            if (lead.id != null) byId.set(lead.id, lead);
        }
        const extras = optimisticLeads.filter((l) => l.id == null);
        return [...byId.values(), ...extras];
    }, [leads, optimisticLeads]);

    const visibleLeads = useMemo(
        () =>
            mergedLeads.filter((lead) => {
                const haystack = `${lead.firstName ?? ''} ${lead.phone ?? ''} ${lead.source ?? ''} ${lead.comment ?? ''}`.toLowerCase();
                const matchesSearch = !search.trim() || haystack.includes(search.toLowerCase());
                return matchesSearch && matchesCallFilter(lead, callFilter);
            }),
        [mergedLeads, search, callFilter],
    );

    const summary: LeadPipelineSummary = useMemo(
        () => ({
            leads: countByColumn(visibleLeads, COLUMNS[0]),
            waiting: countByColumn(visibleLeads, COLUMNS[1]),
            calling: countByColumn(visibleLeads, COLUMNS[2]),
            archived: countByColumn(visibleLeads, COLUMNS[3]),
        }),
        [visibleLeads],
    );

    const summaryCards = [
        { key: 'leads', label: 'Leads', value: summary.leads, icon: Zap, filled: true, color: '#F37021' },
        { key: 'waiting', label: 'Waiting', value: summary.waiting, icon: Clock, filled: false, color: '#9B59B6' },
        { key: 'calling', label: 'Calling', value: summary.calling, icon: PhoneIncoming, filled: false, color: '#4C6FFF' },
        { key: 'archived', label: 'Archived', value: summary.archived, icon: Archive, filled: false, color: '#8A9BB8' },
    ];

    const notify = (msg: string) => {
        if (/could not|failed/i.test(msg)) toastError(msg);
        else toastSuccess(msg);
    };

    const handleStatusChange = async (lead: LidModel, nextStatus: string) => {
        if (lead.id == null || lead.status === nextStatus) return;
        try {
            if (nextStatus === 'archive') {
                await archiveLead({ id: lead.id, archiveReason: 'Moved to archive' }).unwrap();
            } else if (nextStatus === 'waiting') {
                if (lead.scheduledDate && lead.scheduledTime) {
                    await moveLeadToWaiting({
                        id: lead.id,
                        preferredBranchId: lead.branch ?? branchId,
                        scheduledDate: lead.scheduledDate,
                        scheduledTime: lead.scheduledTime,
                        firstName: lead.firstName,
                        comment: lead.comment,
                    }).unwrap();
                } else {
                    await updateLeadStatus({ id: lead.id, status: 'waiting' }).unwrap();
                }
            } else {
                await updateLeadStatus({ id: lead.id, status: nextStatus }).unwrap();
            }
            notify('Status updated');
        } catch {
            notify('Could not update lead status');
        }
    };

    return (
        <div className="flex h-full flex-col gap-5 animate-in fade-in duration-500 pb-4">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div className="min-w-[260px] max-w-xl">
                    <span className="inline-block rounded-lg bg-[#FFF5F0] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#F37021] mb-2">
                        Admissions Board
                    </span>
                    <h1 className="text-[24px] font-extrabold text-[#1A2233] tracking-tight leading-tight">
                        Lead Pipeline
                    </h1>
                    <p className="text-[11px] text-[#8A9BB8] font-semibold mt-1.5 leading-relaxed">
                        Incoming leads, follow-ups and missed visits are grouped into a cleaner sales flow with better density.
                    </p>
                </div>

                <div className="flex flex-col gap-2.5 w-full xl:max-w-[560px] shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-[#F0F1F5] rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-semibold text-[#1A2233] placeholder-[#8A9BB8] outline-none shadow-sm focus:border-[#F37021]/40 transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-between">
                        <div className="flex flex-wrap gap-1.5">
                            {CALL_FILTERS.map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setCallFilter(f.id)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                        callFilter === f.id
                                            ? 'bg-[#4C6FFF] text-white shadow-sm'
                                            : 'bg-white border border-[#F0F1F5] text-[#5A6376] hover:border-gray-200'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => refetch()}
                                disabled={isFetching}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#F0F1F5] bg-white text-[#5A6376] text-[11px] font-bold hover:border-[#F37021]/30 transition-all disabled:opacity-50"
                            >
                                <RotateCcw size={13} className={isFetching ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddDialog(true)}
                                className="flex items-center gap-1.5 bg-[#F37021] text-white px-3.5 py-2 rounded-xl text-[11px] font-black hover:bg-[#E0651A] transition-all shadow-[0_4px_12px_rgba(243,112,33,0.3)]"
                            >
                                <Plus size={15} strokeWidth={3} />
                                Add Lead
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {summaryCards.map((s) => {
                    const Icon = s.icon;
                    if (s.filled) {
                        return (
                            <div
                                key={s.key}
                                className="rounded-[14px] p-4 flex items-center justify-between text-white shadow-[0_8px_24px_rgba(243,112,33,0.22)]"
                                style={{ backgroundColor: s.color }}
                            >
                                <div>
                                    <p className="text-[24px] font-black leading-none mb-0.5">{s.value}</p>
                                    <p className="text-[11px] font-bold text-white/90">{s.label}</p>
                                </div>
                                <Icon size={24} className="text-white/75" />
                            </div>
                        );
                    }
                    return (
                        <div
                            key={s.key}
                            className="bg-white rounded-[14px] border border-[#F0F1F5] p-4 flex items-center justify-between shadow-[0_2px_12px_rgba(26,34,51,0.04)]"
                        >
                            <div>
                                <p className="text-[24px] font-black text-[#1A2233] leading-none mb-0.5">{s.value}</p>
                                <p className="text-[11px] font-bold text-[#8A9BB8]">{s.label}</p>
                            </div>
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${s.color}1A` }}
                            >
                                <Icon size={18} style={{ color: s.color }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Kanban */}
            <div className="flex-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
                <div className="flex gap-3 min-w-max pb-2">
                    {COLUMNS.map((col, colIndex) => {
                        const Icon = col.icon;
                        const columnLeads = visibleLeads.filter((l) => leadInColumn(l, col));
                        const badgeCount = columnLeads.length;
                        const columnConfig = { id: col.id, label: col.label, color: col.color };

                        return (
                            <div
                                key={col.id}
                                className="w-[300px] shrink-0 bg-white rounded-[18px] border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] overflow-hidden flex flex-col max-h-[calc(100vh-300px)]"
                            >
                                <div
                                    className="p-3.5 border-b border-[#F0F1F5]"
                                    style={{ background: `linear-gradient(180deg, ${col.gradientFrom} 0%, #ffffff 85%)` }}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2 min-w-0">
                                            <div
                                                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                                style={{ backgroundColor: `${col.color}18` }}
                                            >
                                                <Icon size={14} style={{ color: col.color }} />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-[13px] font-extrabold leading-none" style={{ color: col.color }}>
                                                    {col.label}
                                                </h3>
                                                <p className="text-[10px] font-semibold text-[#8A9BB8] leading-snug mt-1">
                                                    {col.description}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className="shrink-0 min-w-[26px] h-[26px] px-1 rounded-full flex items-center justify-center text-[11px] font-black"
                                            style={{ backgroundColor: `${col.color}18`, color: col.color }}
                                        >
                                            {badgeCount}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[220px]">
                                    {isLoading ? (
                                        Array.from({ length: 2 }).map((_, i) => (
                                            <div key={i} className="h-[130px] rounded-xl bg-[#F8F9FB] animate-pulse" />
                                        ))
                                    ) : columnLeads.length > 0 ? (
                                        columnLeads.map((lead) => (
                                            <LeadCard
                                                key={lead.id ?? `${col.id}-${lead.firstName}-${lead.phone}`}
                                                lead={lead}
                                                column={columnConfig}
                                                columnIndex={colIndex}
                                                allColumns={COLUMNS.map((c) => ({ id: c.id, label: c.label, color: c.color }))}
                                                onDelete={(id) => setConfirmDeleteId(id)}
                                                onEdit={(item) => {
                                                    setEditingLead(item);
                                                    setShowEditModal(true);
                                                }}
                                                onChangeStatus={handleStatusChange}
                                            />
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
                                            <Icon size={28} className="text-[#E5E7EB] mb-2" />
                                            <p className="text-[11px] font-semibold text-[#8A9BB8] leading-relaxed">
                                                No leads here yet. New items will appear in this stage.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showAddDialog && (
                <AddLeadDialog
                    onClose={() => setShowAddDialog(false)}
                    onRefetch={() => refetch()}
                    onCreated={(lead) => {
                        setOptimisticLeads((prev) => {
                            const without = lead.id != null ? prev.filter((l) => l.id !== lead.id) : prev;
                            return [lead, ...without];
                        });
                    }}
                    onSuccess={() => notify('Lead created')}
                />
            )}

            {showEditModal && editingLead && (
                <LeadEditDialog
                    lead={editingLead}
                    statuses={choices?.statuses ?? []}
                    sources={choices?.sources ?? []}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingLead(null);
                    }}
                    onSubmit={async (payload) => {
                        if (editingLead.id != null) {
                            await updateLead({ id: editingLead.id, ...payload }).unwrap();
                            notify('Lead updated');
                        }
                    }}
                />
            )}

            {confirmDeleteId != null && (
                <ModalShell title="Delete lead" onClose={() => setConfirmDeleteId(null)}>
                    <div className="p-5">
                        <p className="text-[11px] font-semibold text-[#5A6376]">
                            This lead will be permanently removed.
                        </p>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setConfirmDeleteId(null)} className="rounded-xl px-4 py-2 text-[11px] font-bold text-[#8A9BB8] hover:bg-gray-50">
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        await deleteLead(confirmDeleteId).unwrap();
                                        setConfirmDeleteId(null);
                                        notify('Lead deleted');
                                    } catch {
                                        notify('Could not delete lead');
                                    }
                                }}
                                className="rounded-xl bg-red-500 px-4 py-2 text-[11px] font-bold text-white hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </ModalShell>
            )}

        </div>
    );
}

interface ChoiceItem {
    value: string;
    label: string;
}

function LeadEditDialog({
    lead,
    statuses,
    sources,
    onClose,
    onSubmit,
}: {
    lead: LidModel;
    statuses: ChoiceItem[];
    sources: ChoiceItem[];
    onClose: () => void;
    onSubmit: (payload: {
        firstName: string;
        phone?: string;
        status?: string;
        source?: string;
        gender?: string;
        destination?: string;
        comment?: string;
        giveBook?: boolean;
    }) => Promise<void>;
}) {
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        firstName: lead.firstName ?? '',
        phone: lead.phone ?? '',
        status: lead.status ?? 'lead',
        source: lead.source ?? '',
        destination: lead.destination ?? '',
        comment: lead.comment ?? '',
        giveBook: lead.giveBook ?? false,
    });

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.firstName.trim()) return;
        setIsSaving(true);
        try {
            await onSubmit({
                firstName: form.firstName.trim(),
                phone: form.phone.trim() || undefined,
                status: form.status,
                source: form.source || undefined,
                destination: form.destination.trim() || undefined,
                comment: form.comment.trim() || undefined,
                giveBook: form.giveBook,
            });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ModalShell title="Edit lead" onClose={onClose} maxWidthClass="max-w-lg">
            <form onSubmit={submit} className="space-y-3 p-5 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Name *">
                        <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} required />
                    </Field>
                    <Field label="Phone">
                        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
                    </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Status">
                        <CustomSelect
                            value={form.status}
                            onChange={(v) => setForm({ ...form, status: v || 'lead' })}
                            placeholder="Status"
                            options={statuses.length ? statuses : [{ value: 'lead', label: 'Lead' }]}
                        />
                    </Field>
                    <Field label="Source">
                        <CustomSelect
                            value={form.source}
                            onChange={(v) => setForm({ ...form, source: v })}
                            placeholder="— Choose source"
                            options={sources.length ? sources : []}
                        />
                    </Field>
                </div>
                <Field label="Comment">
                    <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={3} className={`${inputClass} min-h-24 resize-y`} />
                </Field>
                <div className="flex justify-end gap-2 pt-3 border-t border-[#F0F1F5]">
                    <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-[11px] font-bold text-[#8A9BB8] hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={isSaving} className="rounded-xl bg-[#F37021] px-4 py-2 text-[11px] font-bold text-white disabled:opacity-50">
                        {isSaving ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

const inputClass =
    'w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] px-4 py-2.5 text-[11px] font-semibold text-[#1A2233] placeholder-[#8A9BB8] outline-none focus:border-[#F37021]/50 focus:bg-white transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8A9BB8]">{label}</span>
            {children}
        </label>
    );
}
