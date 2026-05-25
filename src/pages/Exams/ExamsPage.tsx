import { useState } from 'react';
import {
    Plus, Search, Calendar, ChevronLeft, ChevronRight,
    MoreVertical, FileText, Clock
} from 'lucide-react';
import {
    useGetExamsQuery,
} from '../../store/api/examApi';

export default function ExamsPage() {
    const { data: exams = [], isLoading } = useGetExamsQuery();
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const filters = ['All', 'Scheduled', 'Started', 'Ended'];

    const filtered = exams.filter(e => {
        const matchesSearch = (e.title || '').toLowerCase().includes(search.toLowerCase()) ||
            (e.groupName || '').toLowerCase().includes(search.toLowerCase());

        let matchesFilter = true;
        if (activeFilter === 'Started') matchesFilter = e.status === 'started' || e.isActive;
        if (activeFilter === 'Scheduled') matchesFilter = e.status === 'scheduled';
        if (activeFilter === 'Ended') matchesFilter = e.status === 'finished' || e.status === 'ended';

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-extrabold text-[#1A2233] tracking-tight">Exams</h1>
                    <p className="text-[13px] text-[#8A9BB8] font-bold mt-1">Managing the certification schedule and results</p>
                </div>
                <button className="w-full sm:w-auto bg-[#ED6A2E] text-white px-5 py-2.5 rounded-xl text-[13px] font-black flex items-center justify-center gap-2 hover:bg-[#D95B24] transition-all shadow-[0_4px_12px_rgba(237,106,46,0.25)]">
                    <Plus size={18} strokeWidth={3} />
                    Create an exam
                </button>
            </div>

            {/* Top Filter Bar */}
            <div className="bg-white rounded-[24px] border border-[#F0F1F5] p-2.5 shadow-sm">
                <div className="flex flex-col lg:flex-row items-center gap-3">
                    <div className="flex-1 w-full relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={18} />
                        <input
                            type="text"
                            placeholder="Search exams by title, group..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-[#F7F8FA] border-none rounded-xl pl-12 pr-4 py-3 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-[#F7F8FA]/50 rounded-[14px] overflow-x-auto w-full lg:w-auto">
                        <button className="flex items-center gap-2 px-4 py-2 text-[12px] font-black text-[#5A6376] hover:bg-white rounded-xl transition-all whitespace-nowrap">
                            <Clock size={14} />
                            Status
                            <ChevronRight size={14} className="rotate-90 text-[#8A9BB8]" />
                        </button>
                        <div className="w-[1px] h-6 bg-[#F0F1F5] shrink-0" />
                        <div className="flex items-center gap-1.5 ml-1">
                            {filters.map(f => (
                                <button
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={`px-5 py-2 rounded-xl text-[12px] font-black transition-all whitespace-nowrap ${activeFilter === f
                                        ? 'bg-[#ED6A2E] text-white shadow-md shadow-[#ED6A2E]/20'
                                        : 'text-[#8A9BB8] hover:bg-white hover:text-[#5A6376]'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Exam Items */}
            <div className="space-y-3">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-[24px] border border-[#F0F1F5] p-6 h-24 animate-pulse" />
                    ))
                ) : filtered.length > 0 ? (
                    filtered.map((e) => (
                        <div key={e.id} className="bg-white rounded-[24px] border border-[#F0F1F5] p-5 flex flex-col md:flex-row md:items-center gap-5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all cursor-pointer group">
                            {/* Icon */}
                            <div className="w-14 h-14 rounded-2xl bg-[#FFEEE0] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                                <FileText size={24} className="text-[#ED6A2E]" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <h3 className="text-[16px] font-black text-[#1A2233] truncate">{e.title}</h3>
                                    <span className="text-[11px] font-black text-[#ED6A2E] bg-[#FFF5F2] px-2 py-0.5 rounded-md uppercase tracking-widest">{e.groupName || 'Group'}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-[#8A9BB8] uppercase tracking-[1px] mb-0.5">EXAMINER</span>
                                        <span className="text-[12px] font-bold text-[#5A6376]">{String(e.teacherName || e.teacher || 'Staff')}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-[#8A9BB8] uppercase tracking-[1px] mb-0.5">DATE AND TIME</span>
                                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#5A6376]">
                                            <Calendar size={13} className="text-[#8A9BB8]" />
                                            {String(e.examDate || '-')} {String(e.startTime || '')}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-[#8A9BB8] uppercase tracking-[1px] mb-0.5">PASS SCORE</span>
                                        <span className="text-[12px] font-bold text-[#5A6376]">{String(e.passScore)}{e.isPercentage ? '%' : ''}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Action */}
                            <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0">
                                <div className={`px-4 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1.5 border ${e.status === 'finished' || e.status === 'ended'
                                    ? 'bg-[#E9FAF0] text-[#2ECC81] border-[#2ECC81]/20'
                                    : 'bg-[#FFF5F2] text-[#ED6A2E] border-[#ED6A2E]/20'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${e.status === 'finished' || e.status === 'ended' ? 'bg-[#2ECC81]' : 'bg-[#ED6A2E]'}`} />
                                    {String(e.status || 'Active')}
                                </div>
                                <button className="bg-white border border-[#F0F1F5] text-[#1A2233] px-6 py-2 rounded-xl text-[12px] font-black hover:bg-gray-50 transition-all shadow-sm">
                                    Results
                                </button>
                                <button className="p-2 text-[#8A9BB8] hover:bg-gray-50 rounded-lg transition-all">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-[24px] border border-[#F0F1F5] py-20 text-center text-[#8A9BB8] font-bold uppercase tracking-widest text-xs shadow-sm">
                        No exams found
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 text-[12px] font-bold text-[#8A9BB8]">
                <span>Shown {filtered.length} from {exams.length} exams</span>
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-xl border border-[#F0F1F5] hover:bg-white transition-all disabled:opacity-50" disabled><ChevronLeft size={16} /></button>
                    <button className="w-9 h-9 rounded-xl bg-[#ED6A2E] text-white text-[12px] font-black shadow-lg shadow-[#ED6A2E]/30">1</button>
                    <button className="p-2 rounded-xl border border-[#F0F1F5] hover:bg-white transition-all disabled:opacity-50" disabled><ChevronRight size={16} /></button>
                </div>
            </div>
        </div>
    );
}
