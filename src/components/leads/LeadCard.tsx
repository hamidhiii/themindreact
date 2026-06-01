import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    Phone, Globe, Send, SlidersHorizontal, StickyNote,
    ChevronLeft, ChevronRight, Pencil, MoreHorizontal, Trash2,
} from 'lucide-react';
import type { LidModel } from '../../types';

export interface LeadColumnConfig {
    id: string;
    label: string;
    color: string;
}

interface LeadCardProps {
    lead: LidModel;
    column: LeadColumnConfig;
    columnIndex: number;
    allColumns: LeadColumnConfig[];
    onEdit: (lead: LidModel) => void;
    onDelete: (id: number) => void;
    onChangeStatus: (lead: LidModel, status: string) => void;
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.slice(0, 2) ?? '?').toUpperCase();
}

function formatPhone(phone?: string): string {
    if (!phone?.trim()) return '—';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('998')) {
        return `+998 (${digits.slice(3, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10)}`;
    }
    return phone;
}

function formatSource(source?: string): string {
    if (!source) return '';
    return source.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDays(days?: string): string {
    if (!days?.trim() || days === '[]') return '—';
    return days;
}

function formatTime(lead: LidModel): string {
    const t = lead.scheduledTime?.trim() || lead.preferredTimeSlot?.trim();
    if (!t) return '—';
    return t.length >= 5 ? t.slice(0, 5) : t;
}

function formatTimestamp(lead: LidModel): string {
    const raw = lead.createdAt ?? lead.date ?? lead.scheduledDate;
    if (!raw) return '';
    const d = new Date(raw.includes('T') ? raw : `${raw}T12:00:00`);
    if (Number.isNaN(d.getTime())) return raw;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    if (lead.createdAt?.includes('T') || raw.includes('T')) {
        return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
    }
    return `${dd}.${mm}.${yyyy}`;
}

function InfoRow({
    icon: Icon,
    iconClass,
    children,
}: {
    icon: LucideIcon;
    iconClass: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-2.5 rounded-xl border border-[#F0F1F5] bg-white px-3 py-2.5">
            <Icon size={16} className={`shrink-0 ${iconClass}`} />
            <div className="min-w-0 text-[12px] font-bold text-[#1A2233] truncate">{children}</div>
        </div>
    );
}

export default function LeadCard({
    lead,
    column,
    columnIndex,
    allColumns,
    onEdit,
    onDelete,
    onChangeStatus,
}: LeadCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const name = lead.firstName?.trim() || 'Unnamed';
    const telegram = lead.telegramUsername?.trim();
    const tgHandle = telegram ? (telegram.startsWith('@') ? telegram : `@${telegram}`) : '—';
    const stamp = formatTimestamp(lead);
    const prevCol = columnIndex > 0 ? allColumns[columnIndex - 1] : null;
    const nextCol = columnIndex < allColumns.length - 1 ? allColumns[columnIndex + 1] : null;

    return (
        <article className="rounded-2xl border-2 border-[#F37021]/35 bg-white p-3.5 shadow-[0_4px_16px_rgba(243,112,33,0.08)] transition-all hover:border-[#F37021]/55 hover:shadow-[0_8px_24px_rgba(243,112,33,0.12)]">
            {/* Header */}
            <div className="flex items-start gap-2.5 mb-3">
                <div
                    className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-[11px] font-black text-white"
                    style={{ backgroundColor: column.color }}
                >
                    {initials(name)}
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="text-[14px] font-extrabold text-[#1A2233] leading-tight truncate">{name}</h4>
                    {lead.source && (
                        <span className="inline-flex items-center gap-1 mt-1 rounded-lg bg-[#F5F6FA] px-2 py-0.5 text-[10px] font-bold text-[#8A9BB8]">
                            <Globe size={10} />
                            {formatSource(lead.source)}
                        </span>
                    )}
                </div>
                {stamp && (
                    <span className="shrink-0 rounded-lg bg-[#F37021] px-2 py-1 text-[9px] font-black text-white leading-tight text-center max-w-[88px]">
                        {stamp}
                    </span>
                )}
            </div>

            {/* Info rows */}
            <div className="space-y-2 mb-3">
                <InfoRow icon={Phone} iconClass="text-[#F37021]">
                    {formatPhone(lead.phone)}
                </InfoRow>
                <InfoRow icon={Send} iconClass="text-[#229ED9]">
                    {tgHandle}
                </InfoRow>
                <InfoRow icon={SlidersHorizontal} iconClass="text-[#F37021]">
                    <span>
                        <span className="text-[#8A9BB8] font-semibold">Days: </span>
                        {formatDays(lead.preferredDays)}
                        <span className="text-[#8A9BB8] font-semibold ml-2">Time: </span>
                        {formatTime(lead)}
                    </span>
                </InfoRow>
                {lead.comment?.trim() && (
                    <div className="rounded-xl border border-[#FFE4CC] bg-[#FFF8F0] px-3 py-2.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#F37021] mb-1">
                            <StickyNote size={12} />
                            Admin note
                        </div>
                        <p className="text-[11px] font-semibold text-[#5A6376] leading-relaxed break-words">
                            {lead.comment}
                        </p>
                    </div>
                )}
            </div>

            {/* Stage */}
            <div className="flex items-center justify-between gap-2 rounded-xl border border-[#F0F1F5] bg-[#FAFBFC] px-2 py-2 mb-3">
                <button
                    type="button"
                    disabled={!prevCol}
                    onClick={() => prevCol && onChangeStatus(lead, prevCol.id)}
                    className="p-1.5 rounded-lg text-[#C7CCD4] hover:text-[#8A9BB8] disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Previous stage"
                >
                    <ChevronLeft size={18} />
                </button>
                <div className="text-center min-w-0 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#8A9BB8]">Stage</p>
                    <p className="text-[13px] font-extrabold truncate" style={{ color: column.color }}>
                        {lead.statusDisplay ?? column.label}
                    </p>
                </div>
                <button
                    type="button"
                    disabled={!nextCol}
                    onClick={() => nextCol && onChangeStatus(lead, nextCol.id)}
                    className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white disabled:opacity-30 disabled:pointer-events-none"
                    style={{ backgroundColor: nextCol ? column.color : '#E5E7EB' }}
                    aria-label="Next stage"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onEdit(lead)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#F0F1F5] bg-white py-2.5 text-[12px] font-extrabold text-[#1A2233] hover:border-[#F37021]/30 hover:bg-[#FFF8F5] transition-all"
                >
                    <Pencil size={14} className="text-[#8A9BB8]" />
                    Edit Lead
                </button>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#F0F1F5] bg-white text-[#8A9BB8] hover:bg-[#F5F6FA]"
                        aria-label="More actions"
                    >
                        <MoreHorizontal size={16} />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 bottom-11 z-30 min-w-[140px] rounded-xl border border-[#F0F1F5] bg-white py-1 shadow-lg">
                            {allColumns
                                .filter((c) => c.id !== column.id)
                                .map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onChangeStatus(lead, c.id);
                                        }}
                                        className="w-full px-3 py-2 text-left text-[11px] font-bold hover:bg-[#F8F9FB]"
                                        style={{ color: c.color }}
                                    >
                                        Move to {c.label}
                                    </button>
                                ))}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => lead.id != null && onDelete(lead.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#E74C3C] text-white hover:bg-[#C0392B] transition-colors"
                    aria-label="Delete lead"
                >
                    <Trash2 size={15} />
                </button>
            </div>
        </article>
    );
}
