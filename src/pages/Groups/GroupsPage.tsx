import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, ChevronLeft, ChevronRight, Filter, X,
} from 'lucide-react';
import {
    useGetGroupsQuery,
    useCreateGroupMutation,
    useGetGroupRoomsQuery,
} from '../../store/api/groupApi';
import ModalShell from '../../components/common/ModalShell';
import CustomSelect from '../../components/common/CustomSelect';
import { formatApiError } from '../../utils/apiError';
import { useToast } from '../../hooks/useToast';
import { useTeacherOptions } from '../../hooks/useTeacherOptions';

const PAGE_SIZE = 12;

export default function GroupsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [teacherFilter, setTeacherFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const { data: groups = [], isLoading } = useGetGroupsQuery();
    const { options: teacherOptions, isEmpty: noTeachers } = useTeacherOptions();
    const { data: rooms = [] } = useGetGroupRoomsQuery();
    const [showCreate, setShowCreate] = useState(false);

    const filtered = useMemo(() => groups.filter((g) => {
        const matchesSearch = !search || (g.name ?? '').toLowerCase().includes(search.toLowerCase());
        const matchesTeacher = !teacherFilter || String(g.teacher) === teacherFilter;
        const matchesLevel = !levelFilter || g.level === levelFilter;
        const matchesStatus = !statusFilter
            || (statusFilter === 'active' && g.isActive !== false)
            || (statusFilter === 'inactive' && g.isActive === false);
        return matchesSearch && matchesTeacher && matchesLevel && matchesStatus;
    }), [groups, search, teacherFilter, levelFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const hasFilters = !!search || !!teacherFilter || !!levelFilter || !!statusFilter;
    const reset = () => {
        setSearch('');
        setTeacherFilter('');
        setLevelFilter('');
        setStatusFilter('');
        setPage(1);
    };

    const dayMap: Record<number, string> = {
        1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 7: 'sun'
    };

    const formatDays = (days?: string | number[]) => {
        if (typeof days === 'string') return days.trim() || 'mon-wed-fri';
        if (!days || !days.length) return 'mon-wed-fri';
        return [...days].sort((a, b) => a - b).map(d => dayMap[d]).join('-');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-extrabold text-[#1A2233] tracking-tight">Groups</h1>
                    <p className="text-[13px] text-[#8A9BB8] font-bold mt-1">Managing study groups and schedules</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="bg-[#ED6A2E] text-white px-5 py-2.5 rounded-xl text-[13px] font-black flex items-center gap-2 hover:bg-[#D95B24] transition-all shadow-[0_4px_12px_rgba(237,106,46,0.3)]"
                >
                    <Plus size={18} strokeWidth={3} />
                    Create a group
                </button>
            </div>

            {/* Filters Row */}
            <div className="bg-white p-5 rounded-2xl border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={14} className="text-[#ED6A2E]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8A9BB8]">
                        Filters
                    </span>
                    {hasFilters && (
                        <button
                            type="button"
                            onClick={reset}
                            className="ml-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#ED6A2E] hover:text-[#D95B24]"
                        >
                            <X size={12} /> Reset
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={15} />
                        <input
                            type="text"
                            placeholder="Search by group name..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-[#F8F9FB] border border-[#F0F1F5] rounded-xl pl-10 pr-3 py-2.5 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none focus:border-[#ED6A2E]/40"
                        />
                    </div>
                    <CustomSelect
                        value={teacherFilter}
                        onChange={(v) => {
                            setTeacherFilter(v);
                            setPage(1);
                        }}
                        options={teacherOptions}
                        placeholder="All teachers"
                        size="sm"
                    />
                    <CustomSelect
                        value={levelFilter}
                        onChange={(v) => {
                            setLevelFilter(v);
                            setPage(1);
                        }}
                        options={[
                            { value: 'beginner', label: 'Beginner' },
                            { value: 'elementary', label: 'Elementary' },
                            { value: 'intermediate', label: 'Intermediate' },
                            { value: 'advanced', label: 'Advanced' },
                        ]}
                        placeholder="All levels"
                        size="sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[24px] border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F7F8FA] border-b border-[#F0F1F5]">
                            <tr>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Name</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Teacher</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Students</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Days</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Time</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Level</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Room</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F1F5]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="w-8 h-8 border-4 border-[#ED6A2E]/20 border-t-[#ED6A2E] rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : paged.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-[#8A9BB8] font-bold uppercase tracking-widest text-[11px]">
                                        No groups found
                                    </td>
                                </tr>
                            ) : paged.map((g) => {
                                const capacity = (g as { capacity?: number }).capacity ?? 12;
                                const count = (g as { studentCount?: number }).studentCount ?? 0;
                                const pct = Math.min(100, Math.round((count / capacity) * 100));
                                const teacherName = g.teacherName ?? '—';

                                return (
                                    <tr
                                        key={g.id}
                                        onClick={() => navigate(`/groups/details/${g.id}`)}
                                        className="hover:bg-[#F8F9FB] cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-5 font-extrabold text-[14px] text-[#1A2233]">{g.name}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[#ED6A2E] to-[#FF9A6C]">
                                                    <span className="text-white text-[10px] font-black uppercase">
                                                        {(teacherName?.[0] ?? '?')}
                                                        {(teacherName?.split(' ')[1]?.[0] ?? '')}
                                                    </span>
                                                </div>
                                                <span className="text-[13px] font-bold text-[#5A6376]">{teacherName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col w-32">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-[13px] font-black text-[#1A2233]">{count}/{capacity}</span>
                                                    <span className="text-[11px] text-[#8A9BB8] font-bold">{pct}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-[#F0F1F5] rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#ED6A2E] rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[13px] font-bold text-[#5A6376]">{formatDays(g.weekDays)}</span>
                                        </td>
                                        <td className="px-6 py-5 text-[13px] font-bold text-[#5A6376]">
                                            {g.startTime ?? '—'} - {g.endTime ?? '—'}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="bg-[#F5F6FA] text-[#1A2233] px-3 py-1.5 rounded-lg text-[11px] font-black border border-[#F0F1F5] capitalize">
                                                {g.levelDisplay ?? g.level ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-[13px] font-bold text-[#5A6376]">
                                            {g.roomName ?? '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#F7F8FA] flex flex-col sm:flex-row items-center justify-between border-t border-[#F0F1F5] gap-4">
                    <span className="text-[12px] font-bold text-[#8A9BB8]">
                        Showing {filtered.length} of {groups.length} groups
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage(Math.max(1, safePage - 1))}
                            disabled={safePage <= 1}
                            className="p-2 rounded-lg border border-[#F0F1F5] text-[#8A9BB8] hover:bg-white transition-all disabled:opacity-50"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="w-8 h-8 rounded-lg bg-[#ED6A2E] text-white text-[12px] font-black flex items-center justify-center">
                            {safePage}
                        </span>
                        <span className="text-[12px] font-bold text-[#8A9BB8] mx-2">/ {totalPages}</span>
                        <button
                            type="button"
                            onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                            disabled={safePage >= totalPages}
                            className="p-2 rounded-lg border border-[#F0F1F5] text-[#8A9BB8] hover:bg-white transition-all disabled:opacity-50"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {showCreate && (
                <GroupCreateDialog
                    teacherOptions={teacherOptions}
                    noTeachers={noTeachers}
                    rooms={rooms}
                    onClose={() => setShowCreate(false)}
                />
            )}
        </div>
    );
}

function GroupCreateDialog({
    teacherOptions,
    noTeachers,
    rooms,
    onClose,
}: {
    teacherOptions: Array<{ value: string; label: string }>;
    noTeachers?: boolean;
    rooms: Record<string, unknown>[];
    onClose: () => void;
}) {
    const [createGroup, { isLoading }] = useCreateGroupMutation();
    const [error, setError] = useState('');
    const toast = useToast();
    const [form, setForm] = useState({
        name: '',
        level: 'beginner',
        teacher: teacherOptions[0]?.value ?? '',
        room: '',
        weekDays: ['1', '3', '5'],
        price: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        startTime: '09:00',
        endTime: '10:30',
        teacherFixedSalary: '',
    });

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.name.trim() || !form.teacher) return;
        setError('');
        try {
            await createGroup({
                name: form.name.trim(),
                level: form.level,
                teacher: form.teacher,
                room: form.room ? Number(form.room) : undefined,
                weekDays: form.weekDays.map(Number),
                price: form.price || '0',
                startDate: form.startDate,
                endDate: form.endDate,
                startTime: form.startTime,
                endTime: form.endTime,
                isActive: true,
                teacherFixedSalary: form.teacherFixedSalary,
            }).unwrap();
            toast.success('Group created successfully');
            onClose();
        } catch (err) {
            setError(formatApiError(err, 'Could not create group.'));
            toast.error(formatApiError(err, 'Could not create group.'));
        }
    };

    const toggleDay = (day: string) => {
        setForm((prev) => ({
            ...prev,
            weekDays: prev.weekDays.includes(day)
                ? prev.weekDays.filter((item) => item !== day)
                : [...prev.weekDays, day],
        }));
    };

    return (
        <ModalShell title="Create group" onClose={onClose} maxWidthClass="max-w-2xl">
            <form onSubmit={submit} className="space-y-4 p-5">
                {noTeachers && (
                    <div className="rounded-xl border border-[#F5A623]/30 bg-[#FFF8ED] px-3 py-2 text-[11px] font-semibold text-[#B7791F]">
                        No teachers for this branch. Employees with role &quot;teacher&quot; are not listed until a Teacher profile exists. Check the selected branch or ask an admin to create Teacher records.
                    </div>
                )}
                {error && (
                    <div className="rounded-xl border border-[#E74C3C]/30 bg-[#E74C3C]/10 px-3 py-2 text-[11px] font-semibold text-[#C0392B]">
                        {error}
                    </div>
                )}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Group name" className="rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]" required />
                    <CustomSelect
                        value={form.level}
                        onChange={(v) => setForm({ ...form, level: v || 'beginner' })}
                        options={[
                            { value: 'beginner', label: 'Beginner' },
                            { value: 'elementary', label: 'Elementary' },
                            { value: 'intermediate', label: 'Intermediate' },
                            { value: 'advanced', label: 'Advanced' },
                        ]}
                        placeholder="Level"
                    />
                    <CustomSelect
                        value={form.teacher}
                        onChange={(v) => setForm({ ...form, teacher: v })}
                        options={teacherOptions}
                        placeholder={noTeachers ? 'No teachers available' : 'Select teacher'}
                        disabled={teacherOptions.length === 0}
                    />
                    <CustomSelect
                        value={form.room}
                        onChange={(v) => setForm({ ...form, room: v })}
                        options={rooms.map((room) => ({
                            value: String(room['id'] ?? ''),
                            label: String(room['name'] ?? room['room_name'] ?? 'Room'),
                        }))}
                        placeholder="No room"
                    />
                    <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price" className="rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]" />
                    <input value={form.teacherFixedSalary} onChange={(e) => setForm({ ...form, teacherFixedSalary: e.target.value })} placeholder="Teacher fixed salary" className="rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]" />
                    <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]" />
                    <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]" />
                    <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]" />
                    <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]" />
                </div>
                <div className="flex flex-wrap gap-2">
                    {[
                        ['1', 'Mon'], ['2', 'Tue'], ['3', 'Wed'], ['4', 'Thu'], ['5', 'Fri'], ['6', 'Sat'], ['7', 'Sun'],
                    ].map(([value, label]) => (
                        <button
                            type="button"
                            key={value}
                            onClick={() => toggleDay(value)}
                            className={`rounded-xl px-3 py-2 text-[12px] font-black ${form.weekDays.includes(value) ? 'bg-[#ED6A2E] text-white' : 'bg-[#F5F6FA] text-[#8A9BB8]'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#8A9BB8] hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={isLoading || !form.name.trim() || !form.teacher || teacherOptions.length === 0} className="rounded-xl bg-[#ED6A2E] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-50">
                        {isLoading ? 'Saving...' : 'Create'}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
