import { useState, useMemo } from 'react';
import {
    Plus, LayoutGrid, List, MoreVertical,
    Calendar, Clock
} from 'lucide-react';
import { useGetTasksQuery } from '../../store/api/taskApi';

export default function TasksPage() {
    const { data: tasks = [], isLoading } = useGetTasksQuery();
    const [view, setView] = useState<'board' | 'list'>('board');

    const columns = useMemo(() => {
        const counts = tasks.reduce((acc, t) => {
            acc[t.status] = (acc[t.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return [
            { id: 'backlog', label: 'NEED TO BE DONE', color: '#4C6FFF', count: counts.backlog || 0 },
            { id: 'in_progress', label: 'IN WORK', color: '#ED6A2E', count: counts.in_progress || 0 },
            { id: 'review', label: 'UNDER CHECK', color: '#9B59B6', count: counts.review || 0 },
            { id: 'done', label: 'COMPLETED', color: '#2ECC81', count: counts.done || 0 },
        ];
    }, [tasks]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-extrabold text-[#1A2233] tracking-tight">Tasks</h1>
                    <p className="text-[13px] text-[#8A9BB8] font-bold mt-1">Today {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        {columns.map(col => (
                            <div key={col.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#F0F1F5] bg-white text-[12px] font-black" style={{ color: col.color }}>
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                                {col.count}
                            </div>
                        ))}
                    </div>
                    <button className="w-full sm:w-auto bg-[#ED6A2E] text-white px-5 py-2.5 rounded-xl text-[13px] font-black flex items-center justify-center gap-2 hover:bg-[#D95B24] transition-all shadow-[0_4px_12px_rgba(237,106,46,0.3)]">
                        <Plus size={18} strokeWidth={3} />
                        New Task
                    </button>
                </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-4 border-b border-[#F0F1F5] pb-1">
                <button
                    onClick={() => setView('board')}
                    className={`flex items-center gap-2 px-4 py-2 text-[13px] font-black transition-all relative ${view === 'board' ? 'text-[#ED6A2E]' : 'text-[#8A9BB8]'}`}
                >
                    <LayoutGrid size={18} />
                    Board
                    {view === 'board' && <div className="absolute bottom-[-5px] left-0 w-full h-[3px] bg-[#ED6A2E] rounded-full" />}
                </button>
                <button
                    onClick={() => setView('list')}
                    className={`flex items-center gap-2 px-4 py-2 text-[13px] font-black transition-all relative ${view === 'list' ? 'text-[#ED6A2E]' : 'text-[#8A9BB8]'}`}
                >
                    <List size={18} />
                    List
                    {view === 'list' && <div className="absolute bottom-[-5px] left-0 w-full h-[3px] bg-[#ED6A2E] rounded-full" />}
                </button>
            </div>

            {isLoading ? (
                <div className="py-24 text-center">
                    <div className="w-8 h-8 border-4 border-[#ED6A2E]/20 border-t-[#ED6A2E] rounded-full animate-spin mx-auto" />
                </div>
            ) : view === 'board' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                    {columns.map(col => (
                        <div key={col.id} className="space-y-4">
                            <div className="flex items-center gap-2 pb-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                                <h3 className="text-[11px] font-black text-[#8A9BB8] uppercase tracking-[1.2px]">{col.label}</h3>
                                <span className="bg-[#F4F6FA] text-[#8A9BB8] text-[10px] font-black px-2 py-0.5 rounded-full">{col.count}</span>
                            </div>

                            <div className="space-y-3 min-h-[500px]">
                                {tasks.filter(t => t.status === col.id).map(task => (
                                    <div key={task.id} className="bg-white p-5 rounded-[24px] border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] hover:shadow-md transition-all group cursor-grab active:cursor-grabbing">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="bg-[#F5F5FA] text-[#1A2233] px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                {task.tag || 'Global'}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MoreVertical size={16} className="text-[#8A9BB8] cursor-pointer" />
                                            </div>
                                        </div>

                                        <h4 className="text-[14px] font-bold text-[#1A2233] leading-tight mb-1">{task.title}</h4>
                                        {task.description && (
                                            <p className="text-[12px] text-[#8A9BB8] font-medium leading-relaxed truncate">{task.description}</p>
                                        )}

                                        <div className="mt-5 flex items-center justify-between">
                                            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${task.status === 'done' ? 'bg-[#E9FAF0] text-[#2ECC81]' : 'bg-[#F5F6FA] text-[#8A9BB8]'
                                                }`}>
                                                {task.status.replace('_', ' ')}
                                            </div>
                                            {task.deadline && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8A9BB8]">
                                                    <Calendar size={12} strokeWidth={2.5} />
                                                    {task.deadline}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[24px] border border-[#F0F1F5] overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#F7F8FA] border-b border-[#F0F1F5]">
                            <tr>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-widest">Task Title</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-widest">Status</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-widest">Tag</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-widest">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F1F5]">
                            {tasks.map(task => (
                                <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-[13px] font-bold text-[#1A2233]">{task.title}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-[11px] font-black uppercase text-[#ED6A2E] bg-[#FFF5F2] px-2.5 py-1 rounded-lg border border-[#ED6A2E]/10">
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[12px] font-bold text-[#8A9BB8] uppercase tracking-wide">{task.tag}</td>
                                    <td className="px-6 py-4 text-[12px] font-bold text-[#8A9BB8]">{task.deadline || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
