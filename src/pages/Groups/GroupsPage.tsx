import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Users, Clock, Trash2,
    MoreVertical, ChevronLeft, ChevronRight,
    User, BookOpen, CalendarDays
} from 'lucide-react';
import {
    useGetGroupsQuery,
} from '../../store/api/groupApi';
import { useGetTeachersQuery } from '../../store/api/teacherApi';

const GroupFilter = ({ placeholder }: { placeholder: string }) => (
    <div className="flex-1 min-w-[140px] relative">
        <select className="w-full bg-white border border-[#F0F1F5] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#5A6376] outline-none cursor-pointer hover:border-gray-300 transition-all appearance-none pr-10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%238A9BB8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_1rem_center] bg-no-repeat shadow-sm">
            <option>{placeholder}</option>
        </select>
    </div>
);

export default function GroupsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const { data: groups = [], isLoading } = useGetGroupsQuery();
    const { data: teachers = [] } = useGetTeachersQuery();

    const filtered = groups.filter(g => (g.name ?? '').toLowerCase().includes(search.toLowerCase()));

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
                <button className="bg-[#ED6A2E] text-white px-5 py-2.5 rounded-xl text-[13px] font-black flex items-center gap-2 hover:bg-[#D95B24] transition-all shadow-[0_4px_12px_rgba(237,106,46,0.3)]">
                    <Plus size={18} strokeWidth={3} />
                    Create a group
                </button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-[2] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={16} />
                    <input
                        type="text"
                        placeholder="Search by group name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white border border-[#F0F1F5] rounded-xl pl-12 pr-4 py-2.5 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none shadow-sm h-[42px]"
                    />
                </div>
                <div className="flex-[3] flex gap-3">
                    <GroupFilter placeholder="All teachers" />
                    <GroupFilter placeholder="All courses" />
                    <GroupFilter placeholder="All days" />
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
                            ) : (filtered.length > 0 ? filtered : [{ id: 1, name: 'VIP', teacherName: 'ZiyoMuhammad Palonchiyev', studentCount: 2, startTime: '07:20', endTime: '08:20', level: 'Beginner', roomName: 'Online' }]).map((g: any, i) => {
                                const capacity = 12;
                                const count = g.studentCount || g.student_count || 0;
                                const pct = Math.round((count / capacity) * 100);
                                const teacherName = g.teacherName || g.teacher_name || 'ZiyoMuhammad Palonchiyev';

                                return (
                                    <tr
                                        key={g.id}
                                        onClick={() => navigate(`/groups/details/${g.id}`)}
                                        className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-5 font-bold text-[14px] text-[#1A2233]">{g.name}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#FFEEE0]`}>
                                                    <span className="text-[#ED6A2E] text-[10px] font-black uppercase">
                                                        {teacherName?.[0] || 'Z'}{teacherName?.split(' ')[1]?.[0] || 'P'}
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
                                            <span className="text-[13px] font-bold text-[#5A6376]">{formatDays(g.weekDays || g.week_days)}</span>
                                        </td>
                                        <td className="px-6 py-5 text-[13px] font-bold text-[#5A6376]">
                                            {g.startTime || g.start_time || '07:20'} - {g.endTime || g.end_time || '08:20'}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="bg-[#F5F6FA] text-[#1A2233] px-3 py-1.5 rounded-lg text-[11px] font-black border border-[#F0F1F5]">
                                                {g.level || 'Beginner'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-[13px] font-bold text-[#5A6376]">
                                            {g.roomName || g.room_name || 'Online'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white flex flex-col sm:flex-row items-center justify-between border-t border-[#F0F1F5] gap-4">
                    <span className="text-[12px] font-bold text-[#8A9BB8]">Shown 1 from {filtered.length || 1} groups</span>
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg border border-[#F0F1F5] text-[#8A9BB8] hover:bg-gray-50 transition-all disabled:opacity-50" disabled>
                            <ChevronLeft size={16} />
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-[#ED6A2E] text-white text-[12px] font-black">1</button>
                        <button className="p-2 rounded-lg border border-[#F0F1F5] text-[#8A9BB8] hover:bg-gray-50 transition-all disabled:opacity-50" disabled>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
