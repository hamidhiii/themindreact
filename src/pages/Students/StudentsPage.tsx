import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Trash2, User, Phone,
    CreditCard, Users, UserPlus, AlertTriangle,
    BookOpen, MoreVertical, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
    useGetStudentsQuery,
    useDeleteStudentMutation,
} from '../../store/api/studentApi';
import { useGetStatsQuery } from '../../store/api/dashboardApi';

const DirStatCard = ({ label, value, icon: Icon, color, subText }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] flex flex-col justify-between min-h-[110px]">
        <div className="flex justify-between items-start">
            <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                    <Icon size={16} style={{ color: color }} />
                    <span className="text-[11px] font-bold text-[#8A9BB8] uppercase tracking-tight">{label}</span>
                </div>
                {subText && (
                    <div className="flex items-center gap-1 mt-auto">
                        <AlertTriangle size={10} className="text-[#ED6A2E]" />
                        <span className="text-[9px] font-extrabold text-[#ED6A2E] uppercase">{subText}</span>
                    </div>
                )}
            </div>
            <div className="text-[24px] font-black text-[#1A2233] leading-none">{value}</div>
        </div>
    </div>
);

const FilterSection = () => (
    <div className="bg-white p-6 rounded-2xl border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
        <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-3 bg-[#ED6A2E] rounded-full" />
            <span className="text-[10px] font-black text-[#8A9BB8] uppercase tracking-widest">Filters</span>
        </div>
        <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={16} />
                <input
                    type="text"
                    placeholder="Search student..."
                    className="w-full bg-[#F5F6FA] border border-[#F0F1F5] rounded-xl pl-12 pr-4 py-2.5 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none"
                />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Days: Even/Odd', 'Teacher', 'Course', 'Status'].map((f, i) => (
                    <select key={i} className="bg-white border border-[#F0F1F5] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#5A6376] outline-none cursor-pointer hover:border-gray-300 transition-all appearance-none pr-10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%238A9BB8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_1rem_center] bg-no-repeat">
                        <option>{f}</option>
                    </select>
                ))}
            </div>
        </div>
    </div>
);

export default function StudentsPage() {
    const navigate = useNavigate();
    const { data: students = [], isLoading } = useGetStudentsQuery();
    const { data: stats } = useGetStatsQuery();
    const [deleteStudent] = useDeleteStudentMutation();

    const dirStats = [
        { label: 'Leads', value: '0', icon: UserPlus, color: '#6B7FD4' },
        { label: 'Students', value: stats?.students ?? students.length, icon: Users, color: '#2ECC8A' },
        { label: 'Debtors', value: '0', icon: AlertTriangle, color: '#ED6A2E', subText: 'Current debtors' },
        { label: 'Total Debt', value: '-', icon: CreditCard, color: '#8A9BB8', subText: 'To receive' },
        { label: 'Groups', value: '-', icon: BookOpen, color: '#9B59B6' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-extrabold text-[#1A2233] tracking-tight">Students Directory</h1>
                    <p className="text-[13px] text-[#8A9BB8] font-bold mt-1">Manage your database and track payments</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="hidden sm:flex items-center gap-2 bg-[#F5F6FA] text-[#1A2233] px-5 py-2.5 rounded-xl text-[13px] font-black border border-[#F0F1F5] hover:bg-gray-100 transition-all">
                        <CreditCard size={18} />
                        Add Payment
                    </button>
                    <button className="bg-[#ED6A2E] text-white px-5 py-2.5 rounded-xl text-[13px] font-black flex items-center gap-2 hover:bg-[#D95B24] transition-all shadow-[0_4px_12px_rgba(237,106,46,0.3)]">
                        <UserPlus size={18} strokeWidth={3} />
                        Add Student
                    </button>
                </div>
            </div>

            {/* Dir Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {dirStats.map((s, i) => (
                    <DirStatCard key={i} {...s} />
                ))}
            </div>

            {/* Filters */}
            <FilterSection />

            {/* Table */}
            <div className="bg-white rounded-[24px] border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F7F8FA] border-b border-[#F0F1F5]">
                            <tr>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Student's Full Name</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Telephone</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Group / Teacher</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Balance</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Status</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F1F5]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-20">
                                        <div className="flex justify-center"><div className="w-8 h-8 border-4 border-[#ED6A2E]/20 border-t-[#ED6A2E] rounded-full animate-spin" /></div>
                                    </td>
                                </tr>
                            ) : students.length > 0 ? (
                                students.map((s, i) => (
                                    <tr
                                        key={s.id}
                                        onClick={() => navigate(`/student-details/${s.id}`)}
                                        className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${i % 2 === 0 ? 'bg-[#D1D8F5]' : 'bg-[#E0E2E7]'}`}>
                                                    <span className="text-white text-[12px] font-black uppercase">{(s.firstName?.[0] ?? 'P')}{(s.lastName?.[0] ?? 'M')}</span>
                                                </div>
                                                <span className="text-[14px] font-bold text-[#1A2233]">{s.firstName} {s.lastName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[13px] font-bold text-[#5A6376]">{s.phone || '+998 90 xxx xx xx'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-black text-[#1A2233]">{s.groupName || 'VIP'}</span>
                                                <span className="text-[11px] text-[#8A9BB8] font-bold mt-0.5">ZiyoMuhammad Palonchiyev</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[13px] font-black ${i === 0 ? 'text-[#2ECC8A]' : 'text-[#ED6A2E]'}`}>
                                                {i === 0 ? '0 UZS' : '-800000 UZS'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase ${i === 0 ? 'bg-green-50 text-[#2ECC8A]' : 'bg-[#ED6A2E]/10 text-[#ED6A2E]'}`}>
                                                {i === 0 ? 'Active' : 'debtor'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#8A9BB8]">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-[#8A9BB8] font-bold uppercase tracking-widest text-xs">No students found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Screen shows) */}
                <div className="px-6 py-5 bg-[#F7F8FA] flex flex-col sm:flex-row items-center justify-between border-t border-[#F0F1F5] gap-4">
                    <span className="text-[12px] font-bold text-[#8A9BB8]">Shown 1 - {students.length} from {students.length} students</span>
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-lg border border-gray-200 text-[#8A9BB8] hover:bg-white transition-all disabled:opacity-50" disabled><ChevronLeft size={16} /></button>
                        <button className="w-8 h-8 rounded-lg bg-[#ED6A2E] text-white text-[12px] font-black shadow-lg shadow-[#ED6A2E]/30">1</button>
                        <button className="p-1.5 rounded-lg border border-gray-200 text-[#8A9BB8] hover:bg-white transition-all disabled:opacity-50" disabled><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
