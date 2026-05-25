import { useState } from 'react';
import {
    Plus, Trash2, Phone, User, Edit2,
    Search, RotateCcw, Send, MessageSquare
} from 'lucide-react';
import {
    useGetLeadsQuery,
    useCreateLeadMutation,
    useDeleteLeadMutation,
    useUpdateLeadStatusMutation,
    useGetLeadChoicesQuery
} from '../../store/api/leadApi';

const StatusBadge = ({ label, color }: { label: string, color: string }) => (
    <div
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg border shadow-sm cursor-pointer transition-all group active:scale-95"
        style={{ backgroundColor: `${color}15`, borderColor: `${color}20` }}
    >
        <div className="w-3 h-3 flex items-center justify-center font-black text-[10px] opacity-60" style={{ color: color }}>x</div>
        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: color }}>{label}</span>
        <div className="font-black text-[12px] opacity-80" style={{ color: color }}>-&gt;</div>
    </div>
);

const LeadCard = ({ lead, onDelete, onUpdateStatus, color }: any) => {
    const firstName = lead.firstName ?? lead.first_name ?? '';
    const statusDisplay = lead.statusDisplay ?? lead.status_display ?? lead.status ?? 'lead';

    return (
        <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_20px_rgba(26,34,51,0.06)] border border-[#F0F1F5] relative group hover:border-[#ED6A2E]/30 transition-all">
            {/* Initial Circle */}
            <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#FFEEE0] flex items-center justify-center">
                <span className="text-[#ED6A2E] text-[10px] font-black uppercase">{(firstName?.[0] ?? 'T')}</span>
            </div>

            <h4 className="text-[15px] font-extrabold text-[#1A2233] mb-4 pr-8">{firstName}</h4>

            <div className="space-y-2.5 mb-5">
                <div className="flex items-center gap-2 text-[#8A9BB8]">
                    <Phone size={13} className="shrink-0" />
                    <span className="text-[11px] font-bold tracking-tight">{lead.phone || '+998 00 000 00 00'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#8A9BB8]">
                    <MessageSquare size={13} className="shrink-0" />
                    <span className="text-[11px] font-bold tracking-tight">{lead.source || 'telegram'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#8A9BB8]">
                    <LayoutGroup size={13} className="shrink-0" />
                    <span className="text-[11px] font-bold tracking-tight truncate">{lead.comment || 'no comment'}</span>
                </div>
            </div>

            <div className="flex gap-2 items-center mb-5">
                <StatusBadge label={statusDisplay} color={color || '#ED6A2E'} />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#F0F1F5]">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[#8A9BB8] hover:text-[#1A2233] hover:border-gray-300 transition-all">
                    <Edit2 size={12} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Edit</span>
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onDelete?.(lead.id)}
                        className="p-1.5 text-gray-200 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Placeholder for missing icon since I'm using lucide
const LayoutGroup = ({ size, className }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
);

export default function LeadsPage() {
    const { data: leads = [], isLoading } = useGetLeadsQuery();
    const [deleteLead] = useDeleteLeadMutation();
    const [showModal, setShowModal] = useState(false);

    const columns = [
        { id: 'lead', aliases: ['new'], label: 'LEADS', color: '#4C6FFF' },
        { id: 'waiting', label: 'WAITING', color: '#8A9BB8' },
        { id: 'came', label: 'CAME', color: '#2ECC8A' },
        { id: 'not_came', label: 'NOT CAME', color: '#ED6A2E' },
        { id: 'call', label: 'CALL', color: '#6B7FD4' },
        { id: 'no_answer', label: 'NO ANSWER', color: '#8A9BB8' },
    ];

    const getLeadsByStatus = (column: { id: string; aliases?: string[] }) =>
        leads.filter(l => l.status === column.id || column.aliases?.includes(l.status));

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex items-center justify-between gap-6 mr-2">
                <div className="flex-1 max-w-[420px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        className="w-full bg-white border border-[#F0F1F5] rounded-xl pl-12 pr-4 py-3 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none shadow-sm focus:border-[#ED6A2E]/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2.5 rounded-xl hover:bg-gray-100 text-[#ED6A2E] transition-all">
                        <RotateCcw size={20} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#ED6A2E] text-white px-6 py-2.5 rounded-xl text-[13px] font-black flex items-center gap-2 hover:bg-[#D95B24] transition-all shadow-[0_4px_12px_rgba(237,106,46,0.3)]"
                    >
                        <Plus size={18} strokeWidth={3} />
                        Add Lead
                    </button>
                </div>
            </div>

            {/* Scrollable Container for both Headers and Board */}
            <div className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden scrollbar-hide pb-4">
                <div className="min-w-fit flex flex-col h-full">
                    {/* Column Headers */}
                    <div className="flex gap-6 pb-4 border-b border-[#F0F1F5] shrink-0">
                        {columns.map(col => {
                            const count = getLeadsByStatus(col).length;
                            return (
                                <div key={col.id} className="w-[280px] shrink-0 flex items-center gap-3">
                                    <span className="text-[11px] font-black uppercase tracking-[1.5px]" style={{ color: col.color }}>{col.label}</span>
                                    <div
                                        className="px-2 py-0.5 rounded-full text-[10px] font-black min-w-[24px] flex items-center justify-center"
                                        style={{ backgroundColor: `${col.color}20`, color: col.color }}
                                    >
                                        {count}
                                    </div>
                                </div>
                            );
                        })}
                        <div className="w-[100px] shrink-0 flex items-center justify-end pr-4">
                            <button className="text-[10px] font-black text-[#8A9BB8] uppercase tracking-widest hover:text-[#1A2233] transition-colors">
                                CAL
                            </button>
                        </div>
                    </div>

                    {/* Kanban Board Content */}
                    <div className="flex-1 flex gap-6 overflow-y-auto scrollbar-hide mt-4 pb-10">
                        {columns.map(col => {
                            const columnLeads = getLeadsByStatus(col);
                            return (
                                <div key={col.id} className="w-[280px] shrink-0 space-y-4">
                                    {columnLeads.length > 0 ? (
                                        columnLeads.map(lead => (
                                            <LeadCard
                                                key={lead.id}
                                                lead={lead}
                                                onDelete={deleteLead}
                                                color={col.color}
                                            />
                                        ))
                                    ) : (
                                        <div className="h-[180px] rounded-[24px] border-2 border-dashed border-gray-100 flex items-center justify-center bg-[#F7F8FA]">
                                            <span className="text-[13px] font-bold text-[#D1D5DB] uppercase tracking-widest">Empty</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Calendar Link on right footer area if needed? (Screen shows CAL link) */}
            <div className="fixed bottom-6 right-6">
                <button className="bg-white/90 backdrop-blur shadow-xl border border-[#F0F1F5] px-4 py-2 rounded-xl text-[10px] font-black text-[#8A9BB8] uppercase tracking-widest hover:text-[#1A2233] transition-colors">
                    CAL
                </button>
            </div>
        </div>
    );
}
