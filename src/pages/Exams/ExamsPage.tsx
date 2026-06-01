import { useState } from 'react';
import {
    Plus, Search, Calendar, ChevronLeft, ChevronRight,
    MoreVertical, FileText, Clock
} from 'lucide-react';
import {
    useCreateExamMutation,
    useGetExamStudentsQuery,
    useGetExamsQuery,
} from '../../store/api/examApi';
import { useGetGroupsQuery } from '../../store/api/groupApi';
import { useTeacherOptions } from '../../hooks/useTeacherOptions';
import ModalShell from '../../components/common/ModalShell';
import CustomSelect from '../../components/common/CustomSelect';
import { useToast } from '../../hooks/useToast';

export default function ExamsPage() {
    const { data: exams = [], isLoading } = useGetExamsQuery();
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [showCreate, setShowCreate] = useState(false);
    const [resultsExam, setResultsExam] = useState<string | null>(null);

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
                <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="w-full sm:w-auto bg-[#ED6A2E] text-white px-5 py-2.5 rounded-xl text-[13px] font-black flex items-center justify-center gap-2 hover:bg-[#D95B24] transition-all shadow-[0_4px_12px_rgba(237,106,46,0.25)]"
                >
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
                        <button
                            type="button"
                            onClick={() => {
                                const index = filters.indexOf(activeFilter);
                                setActiveFilter(filters[(index + 1) % filters.length]);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-[12px] font-black text-[#5A6376] hover:bg-white rounded-xl transition-all whitespace-nowrap"
                        >
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
                                <button
                                    type="button"
                                    onClick={() => setResultsExam(e.id)}
                                    className="bg-white border border-[#F0F1F5] text-[#1A2233] px-6 py-2 rounded-xl text-[12px] font-black hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    Results
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setResultsExam(e.id)}
                                    className="p-2 text-[#8A9BB8] hover:bg-gray-50 rounded-lg transition-all"
                                >
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
                    <button className="w-9 h-9 rounded-xl bg-[#ED6A2E] text-white text-[12px] font-black shadow-lg shadow-[#ED6A2E]/30" disabled aria-current="page">1</button>
                    <button className="p-2 rounded-xl border border-[#F0F1F5] hover:bg-white transition-all disabled:opacity-50" disabled><ChevronRight size={16} /></button>
                </div>
            </div>

            {showCreate && <ExamCreateDialog onClose={() => setShowCreate(false)} />}
            {resultsExam && <ExamResultsDialog examId={resultsExam} onClose={() => setResultsExam(null)} />}
        </div>
    );
}

function ExamCreateDialog({ onClose }: { onClose: () => void }) {
    const { data: groups = [] } = useGetGroupsQuery();
    const { options: teacherOptions, isEmpty: noTeachers } = useTeacherOptions();
    const [createExam, { isLoading }] = useCreateExamMutation();
    const toast = useToast();
    const [form, setForm] = useState({
        title: '',
        group: '',
        teacher: '',
        examDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        passScore: '60',
        isPercentage: true,
    });

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.title.trim() || !form.group || !form.teacher) return;
        await createExam({
            title: form.title.trim(),
            teacher: form.teacher,
            group: Number(form.group),
            examDate: form.examDate,
            startTime: form.startTime,
            endTime: form.endTime,
            passScore: Number(form.passScore) || 0,
            isPercentage: form.isPercentage,
            isActive: true,
            createdBy: localStorage.getItem('userId') || '1',
        }).unwrap();
        toast.success('Exam created successfully');
        onClose();
    };

    return (
        <ModalShell title="Create exam" onClose={onClose} maxWidthClass="max-w-2xl">
            <form onSubmit={submit} className="space-y-4 p-5">
                {noTeachers && (
                    <div className="rounded-xl border border-[#F5A623]/30 bg-[#FFF8ED] px-3 py-2 text-[11px] font-semibold text-[#B7791F]">
                        No teachers for this branch. Select a teacher from the branch Teacher list only (not employee/worker id).
                    </div>
                )}
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Exam title" className="w-full rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]" required />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <CustomSelect
                        value={form.group}
                        onChange={(v) => setForm({ ...form, group: v })}
                        options={groups.map((group) => ({ value: String(group.id), label: group.name ?? 'Group' }))}
                        placeholder="Select group"
                    />
                    <CustomSelect
                        value={form.teacher}
                        onChange={(v) => setForm({ ...form, teacher: v })}
                        options={teacherOptions}
                        placeholder={noTeachers ? 'No teachers available' : 'Select teacher'}
                        disabled={teacherOptions.length === 0}
                    />
                    <input type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} className="rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]" />
                    <input type="number" value={form.passScore} onChange={(e) => setForm({ ...form, passScore: e.target.value })} placeholder="Pass score" className="rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]" />
                    <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]" />
                    <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]" />
                </div>
                <label className="flex items-center gap-2 text-[13px] font-bold text-[#5A6376]">
                    <input type="checkbox" checked={form.isPercentage} onChange={(e) => setForm({ ...form, isPercentage: e.target.checked })} className="accent-[#ED6A2E]" />
                    Pass score is percentage
                </label>
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#8A9BB8] hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={isLoading || !form.title.trim() || !form.group || !form.teacher || teacherOptions.length === 0} className="rounded-xl bg-[#ED6A2E] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-50">
                        {isLoading ? 'Saving...' : 'Create'}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

function ExamResultsDialog({ examId, onClose }: { examId: string; onClose: () => void }) {
    const { data: rows = [], isLoading } = useGetExamStudentsQuery(examId);

    return (
        <ModalShell title="Exam results" onClose={onClose} maxWidthClass="max-w-2xl">
            <div className="max-h-[70vh] overflow-y-auto p-5">
                {isLoading ? (
                    <div className="py-12 text-center text-[13px] font-bold text-[#8A9BB8]">Loading results...</div>
                ) : rows.length === 0 ? (
                    <div className="py-12 text-center text-[13px] font-bold uppercase tracking-widest text-[#8A9BB8]">No results yet</div>
                ) : (
                    <div className="space-y-2">
                        {rows.map((row, index) => (
                            <div key={String(row.id ?? index)} className="rounded-xl border border-[#F0F1F5] p-4">
                                <p className="text-[13px] font-black text-[#1A2233]">{String(row.student_name ?? row.full_name ?? row.name ?? `Student #${index + 1}`)}</p>
                                <p className="mt-1 text-[12px] font-bold text-[#8A9BB8]">Score: {String(row.score ?? row.result ?? '-')}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ModalShell>
    );
}
