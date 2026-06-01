import { useMemo, useState } from 'react';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '../modalStyles';
import { useNavigate } from 'react-router-dom';
import { X, Search, SearchX, ChevronRight, Send, Phone } from 'lucide-react';

export interface StudentListEntry {
    id: string | number;
    name: string;
    phone?: string;
    group?: string;
    href?: string;
}

interface StudentListDialogProps {
    title: string;
    subtitle?: string;
    icon: typeof Send;
    iconBg?: string;
    iconColor?: string;
    students: StudentListEntry[];
    placeholder?: string;
    emptyText?: string;
    onClose: () => void;
    onSendReminders?: () => void;
    sendReminderLoading?: boolean;
}

export default function StudentListDialog({
    title,
    subtitle,
    icon: Icon,
    iconBg = '#ED6A2E1A',
    iconColor = '#ED6A2E',
    students,
    placeholder = 'Search by name, group or phone...',
    emptyText = 'No students found',
    onClose,
    onSendReminders,
    sendReminderLoading,
}: StudentListDialogProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return students;
        return students.filter((s) =>
            `${s.name} ${s.phone ?? ''} ${s.group ?? ''}`.toLowerCase().includes(q)
        );
    }, [students, query]);

    return (
        <div className={MODAL_OVERLAY_CLASS}>
            <div className={`w-full max-w-md rounded-3xl ${MODAL_PANEL_CLASS} animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: iconBg }}
                        >
                            <Icon size={20} style={{ color: iconColor }} />
                        </div>
                        <div>
                            <h2 className="text-[18px] font-extrabold text-[#1A2233] leading-tight">{title}</h2>
                            {subtitle && (
                                <p className="text-[12px] font-bold text-[#8A9BB8] mt-0.5">{subtitle}</p>
                            )}
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

                {/* Search */}
                <div className="px-5 pb-3 shrink-0">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8] pointer-events-none" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={placeholder}
                            autoFocus
                            className="w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] pl-11 pr-4 py-3 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none focus:border-[#ED6A2E]/50 focus:bg-white transition-colors"
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="px-5 flex-1 overflow-y-auto min-h-[280px]">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <SearchX size={48} className="text-[#C7CCD4] mb-3" />
                            <p className="text-[13px] font-bold text-[#8A9BB8]">{emptyText}</p>
                        </div>
                    ) : (
                        <div className="space-y-2 pb-4">
                            {filtered.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                        if (s.href) {
                                            navigate(s.href);
                                            onClose();
                                        }
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#ED6A2E]/[0.06] hover:bg-[#ED6A2E]/[0.1] transition-colors text-left"
                                >
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: `${iconColor}30` }}
                                    >
                                        <span
                                            className="text-[12px] font-black uppercase"
                                            style={{ color: iconColor }}
                                        >
                                            {s.name[0]}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className="text-[14px] font-extrabold truncate"
                                            style={{ color: iconColor }}
                                        >
                                            {s.name}
                                        </p>
                                        {s.phone && (
                                            <p className="text-[11px] font-bold text-[#5A6376] mt-0.5 flex items-center gap-1">
                                                <Phone size={11} className="text-[#8A9BB8]" />
                                                {s.phone}
                                            </p>
                                        )}
                                        {s.group && (
                                            <p className="text-[10px] font-bold text-[#8A9BB8] mt-0.5">
                                                {s.group}
                                            </p>
                                        )}
                                    </div>
                                    {s.href && (
                                        <ChevronRight size={16} className="text-[#8A9BB8] shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {onSendReminders && filtered.length > 0 && (
                    <div className="px-5 py-4 border-t border-[#F0F1F5] shrink-0">
                        <button
                            type="button"
                            onClick={onSendReminders}
                            disabled={sendReminderLoading}
                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#F0F1F5] bg-white py-3 text-[13px] font-bold text-[#5A6376] hover:bg-[#F8F9FB] disabled:opacity-50 transition-colors"
                        >
                            <Send size={14} />
                            {sendReminderLoading ? 'Sending...' : 'Send reminders'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
