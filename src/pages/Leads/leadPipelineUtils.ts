import type { LucideIcon } from 'lucide-react';
import { Clock, PhoneIncoming, Archive, Zap } from 'lucide-react';
import type { LidModel } from '../../types';

export interface LeadColumn {
    id: string;
    matchStatuses: string[];
    label: string;
    description: string;
    color: string;
    gradientFrom: string;
    icon: LucideIcon;
}

export const COLUMNS: LeadColumn[] = [
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
        matchStatuses: ['waiting', 'scheduled', 'pending'],
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

export type LeadSummaryCardKey = 'leads' | 'waiting' | 'calling' | 'archived';

const SUMMARY_KEY_TO_COLUMN_ID: Record<LeadSummaryCardKey, string> = {
    leads: 'lead',
    waiting: 'waiting',
    calling: 'call',
    archived: 'archive',
};

export const LEAD_STATUS_DETAIL_META: Record<
    LeadSummaryCardKey,
    { title: string; subtitle: string }
> = {
    leads: {
        title: 'Leads',
        subtitle: 'New contacts waiting for the first touch.',
    },
    waiting: {
        title: 'Waiting',
        subtitle: 'Pending confirmation and next follow-up.',
    },
    calling: {
        title: 'Calling',
        subtitle: 'Leads in the call stage — log up to 3 calls each.',
    },
    archived: {
        title: 'Archived',
        subtitle: 'Closed leads with outcome codes.',
    },
};

export function parseLeadSummaryCardKey(raw: string | undefined): LeadSummaryCardKey | null {
    if (raw === 'leads' || raw === 'waiting' || raw === 'calling' || raw === 'archived') {
        return raw;
    }
    return null;
}

export function columnForSummaryKey(key: LeadSummaryCardKey): LeadColumn {
    const colId = SUMMARY_KEY_TO_COLUMN_ID[key];
    return COLUMNS.find((c) => c.id === colId) ?? COLUMNS[0];
}

function isStatusInColumn(status: string, col: LeadColumn): boolean {
    return col.matchStatuses.includes(status);
}

function leadPlacedElsewhere(lead: LidModel): boolean {
    const status = lead.status?.toLowerCase() ?? '';
    if (!status) return false;
    return COLUMNS.some((c) => c.id !== 'lead' && isStatusInColumn(status, c));
}

export function leadInColumn(lead: LidModel, col: LeadColumn): boolean {
    const status = lead.status?.toLowerCase() ?? '';

    if (col.id === 'archive') {
        return Boolean(lead.isArchived) || isStatusInColumn(status, col);
    }

    if (lead.isArchived) return false;

    if (col.id === 'waiting') {
        return isStatusInColumn(status, col);
    }

    if (col.id === 'call') {
        return isStatusInColumn(status, col);
    }

    if (col.id === 'lead') {
        if (isStatusInColumn(status, col)) return true;
        if (!status || status === 'lead' || status === 'new') return true;
        return !leadPlacedElsewhere(lead);
    }

    return false;
}

export function countByColumn(leads: LidModel[], col: LeadColumn): number {
    return leads.filter((l) => leadInColumn(l, col)).length;
}

export function pipelineColumnId(lead: LidModel): string {
    if (lead.isArchived) return 'archive';
    const s = (lead.status ?? 'lead').toLowerCase();
    if (['waiting', 'scheduled', 'pending'].includes(s)) return 'waiting';
    if (['call', 'calling'].includes(s)) return 'call';
    if (['archive', 'archived', 'came', 'not_came', 'no_answer'].includes(s)) return 'archive';
    return 'lead';
}
