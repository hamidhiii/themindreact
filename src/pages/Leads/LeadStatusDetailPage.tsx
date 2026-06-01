import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { useGetLeadsQuery } from '../../store/api/leadApi';
import type { LidModel } from '../../types';
import { getSelectedBranchId, subscribeBranch } from '../../utils/branchContext';
import { formatApiError } from '../../utils/apiError';
import {
    columnForSummaryKey,
    LEAD_STATUS_DETAIL_META,
    leadInColumn,
    parseLeadSummaryCardKey,
    type LeadSummaryCardKey,
} from './leadPipelineUtils';

function formatPhone(phone?: string): string {
    if (!phone?.trim()) return '—';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('998')) {
        return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
    }
    return phone;
}

function formatSource(source?: string): string {
    if (!source) return '—';
    return source.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusLabel(lead: LidModel): string {
    return lead.statusDisplay ?? lead.status ?? '—';
}

export default function LeadStatusDetailPage() {
    const navigate = useNavigate();
    const { statusKey: rawStatus } = useParams<{ statusKey: string }>();
    const statusKey = parseLeadSummaryCardKey(rawStatus);

    const [search, setSearch] = useState('');
    const [branchId, setBranchId] = useState(() => getSelectedBranchId() ?? '1');

    useEffect(() => {
        if (!statusKey) {
            navigate('/active-leads', { replace: true });
        }
    }, [statusKey, navigate]);

    useEffect(() => {
        return subscribeBranch(() => setBranchId(getSelectedBranchId() ?? '1'));
    }, []);

    const {
        data: leads = [],
        isLoading,
        isError,
        error,
    } = useGetLeadsQuery(
        { branchId, search: search.trim() || undefined },
        { skip: !statusKey, refetchOnMountOrArgChange: true },
    );

    const column = statusKey ? columnForSummaryKey(statusKey) : null;
    const meta = statusKey ? LEAD_STATUS_DETAIL_META[statusKey] : null;

    const filteredLeads = useMemo(() => {
        if (!column) return [];
        const q = search.trim().toLowerCase();
        return leads.filter((lead) => {
            if (!leadInColumn(lead, column)) return false;
            if (!q) return true;
            const haystack = `${lead.firstName ?? ''} ${lead.phone ?? ''} ${lead.source ?? ''} ${lead.comment ?? ''}`.toLowerCase();
            return haystack.includes(q);
        });
    }, [leads, column, search]);

    if (!statusKey || !meta || !column) {
        return null;
    }

    const accent = column.color;
    const showCalls = statusKey === 'calling';

    return (
        <div className="flex h-full flex-col gap-5 animate-in fade-in duration-500 pb-4">
            <button
                type="button"
                onClick={() => navigate('/active-leads')}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8A9BB8] hover:text-[#F37021] w-fit"
            >
                <ArrowLeft size={14} />
                Back to Lead Pipeline
            </button>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <span
                        className="inline-block rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider mb-2"
                        style={{ backgroundColor: `${accent}18`, color: accent }}
                    >
                        {meta.title}
                    </span>
                    <h1 className="text-[24px] font-extrabold text-[#1A2233] tracking-tight leading-tight">
                        {meta.title}
                    </h1>
                    <p className="text-[11px] text-[#8A9BB8] font-semibold mt-1.5 max-w-xl">
                        {meta.subtitle}
                    </p>
                    <p className="text-[12px] font-black text-[#1A2233] mt-2">
                        {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
                    </p>
                </div>

                <div className="relative w-full sm:max-w-md shrink-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-[#F0F1F5] rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-semibold text-[#1A2233] placeholder-[#8A9BB8] outline-none shadow-sm focus:border-[#F37021]/40 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="rounded-xl border border-[#E74C3C]/30 bg-[#E74C3C]/10 px-4 py-3 text-[12px] font-semibold text-[#C0392B]">
                    Could not load leads: {formatApiError(error, 'API error')}
                </div>
            )}

            <div className="overflow-hidden rounded-[18px] border border-[#F0F1F5] bg-white shadow-[0_2px_12px_rgba(26,34,51,0.04)] flex-1 min-h-0">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)]">
                    <table className="w-full min-w-[640px]">
                        <thead className="sticky top-0 z-10 bg-[#FAFBFC] border-b border-[#F0F1F5]">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-[#8A9BB8]">
                                    NAME
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-[#8A9BB8]">
                                    PHONE
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-[#8A9BB8]">
                                    SOURCE
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-[#8A9BB8]">
                                    STATUS
                                </th>
                                {showCalls && (
                                    <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest text-[#8A9BB8]">
                                        CALLS
                                    </th>
                                )}
                                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-[#8A9BB8]">
                                    SCHEDULED
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="border-b border-[#F0F1F5]">
                                        <td colSpan={showCalls ? 6 : 5} className="px-4 py-4">
                                            <div className="h-4 rounded-lg bg-[#F8F9FB] animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={showCalls ? 6 : 5} className="px-4 py-16 text-center">
                                        <p className="text-[13px] font-extrabold text-[#1A2233]">No leads</p>
                                        <p className="text-[11px] font-semibold text-[#8A9BB8] mt-1">
                                            {search.trim()
                                                ? 'Nothing found for your search.'
                                                : 'No leads in this stage yet.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <LeadRow
                                        key={lead.id ?? `${lead.phone}-${lead.firstName}`}
                                        lead={lead}
                                        accent={accent}
                                        showCalls={showCalls}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function LeadRow({
    lead,
    accent,
    showCalls,
}: {
    lead: LidModel;
    accent: string;
    showCalls: boolean;
}) {
    const name = lead.firstName?.trim() || '—';
    const scheduled = [lead.scheduledDate, lead.scheduledTime?.slice(0, 5)]
        .filter(Boolean)
        .join(' ') || '—';

    return (
        <tr className="border-b border-[#F0F1F5] last:border-b-0 hover:bg-[#FAFBFC]">
            <td className="px-4 py-3">
                <span className="inline-flex items-center gap-2">
                    <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black"
                        style={{ backgroundColor: `${accent}18`, color: accent }}
                    >
                        {(name[0] ?? '?').toUpperCase()}
                    </span>
                    <span className="text-[12px] font-semibold text-[#1A2233]">{name}</span>
                </span>
            </td>
            <td className="px-4 py-3 text-[12px] font-semibold text-[#5A6376]">
                {formatPhone(lead.phone)}
            </td>
            <td className="px-4 py-3 text-[12px] font-semibold text-[#5A6376]">
                {formatSource(lead.source)}
            </td>
            <td className="px-4 py-3 text-[12px] font-semibold text-[#5A6376]">
                {statusLabel(lead)}
            </td>
            {showCalls && (
                <td className="px-4 py-3 text-right text-[12px] font-black text-[#1A2233]">
                    {lead.callCount ?? 0}
                </td>
            )}
            <td className="px-4 py-3 text-[12px] font-semibold text-[#5A6376]">{scheduled}</td>
        </tr>
    );
}
