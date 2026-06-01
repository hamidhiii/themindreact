import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, Info } from 'lucide-react';
import { useGetLeadsQuery } from '../../store/api/leadApi';
import { useGetStudentsQuery } from '../../store/api/studentApi';
import {
    useGetDebtorsQuery,
    useGetTrialLessonsQuery,
} from '../../store/api/dashboardApi';
import { useGetBooksQuery } from '../../store/api/mainTheMindApi';
import { useGetGroupsQuery } from '../../store/api/groupApi';

type AnalyticsView = 'leads' | 'students' | 'trial' | 'debtors' | 'books' | 'groups';

const VIEW_CONFIG: Record<
    AnalyticsView,
    {
        title: string;
        placeholder: string;
        columns: { key: string; label: string; align?: 'left' | 'right' }[];
    }
> = {
    leads: {
        title: 'Active Leads',
        placeholder: 'Search by name, phone, status, time...',
        columns: [
            { key: 'name', label: 'NAME' },
            { key: 'phone', label: 'PHONE' },
            { key: 'status', label: 'STATUS' },
            { key: 'statusSince', label: 'STATUS SINCE' },
        ],
    },
    students: {
        title: 'Active Students',
        placeholder: 'Search by name, phone, group...',
        columns: [
            { key: 'name', label: 'NAME' },
            { key: 'phone', label: 'PHONE' },
            { key: 'teacher', label: 'TEACHER' },
            { key: 'group', label: 'GROUP' },
            { key: 'balance', label: 'PLAN / BALANCE', align: 'right' },
        ],
    },
    trial: {
        title: 'Trial Lesson',
        placeholder: 'Search by name, phone, group...',
        columns: [
            { key: 'name', label: 'NAME' },
            { key: 'phone', label: 'PHONE' },
            { key: 'teacher', label: 'TEACHER' },
            { key: 'group', label: 'GROUP' },
            { key: 'schedule', label: 'SCHEDULE' },
        ],
    },
    debtors: {
        title: 'Debtors',
        placeholder: 'Search by name, phone, group...',
        columns: [
            { key: 'name', label: 'NAME' },
            { key: 'phone', label: 'PHONE' },
            { key: 'teacher', label: 'TEACHER' },
            { key: 'group', label: 'GROUP' },
            { key: 'balance', label: 'PLAN / BALANCE', align: 'right' },
        ],
    },
    books: {
        title: 'Books',
        placeholder: 'Search by name, author, category...',
        columns: [
            { key: 'book', label: 'BOOK' },
            { key: 'author', label: 'AUTHOR' },
            { key: 'category', label: 'CATEGORY' },
            { key: 'stock', label: 'STOCK', align: 'right' },
        ],
    },
    groups: {
        title: 'Groups',
        placeholder: 'Search by name, phone, group...',
        columns: [
            { key: 'group', label: 'GROUP' },
            { key: 'students', label: 'STUDENTS' },
            { key: 'teacher', label: 'TEACHER' },
            { key: 'room', label: 'ROOM' },
            { key: 'expected', label: 'EXPECTED (THIS MONTH)' },
            { key: 'weekDays', label: 'WEEK DAYS' },
        ],
    },
};

function parseView(raw: string | null): AnalyticsView {
    if (raw && raw in VIEW_CONFIG) return raw as AnalyticsView;
    return 'leads';
}

export default function AnalyticsDetailPage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const view = parseView(params.get('view'));
    const config = VIEW_CONFIG[view];
    const [query, setQuery] = useState('');

    const { data: leads = [] } = useGetLeadsQuery(undefined, { skip: view !== 'leads' });
    const { data: students = [] } = useGetStudentsQuery(undefined, { skip: view !== 'students' });
    const { data: trials = [] } = useGetTrialLessonsQuery(undefined, { skip: view !== 'trial' });
    const { data: debtors = [] } = useGetDebtorsQuery(undefined, { skip: view !== 'debtors' });
    const { data: books = [] } = useGetBooksQuery(undefined, { skip: view !== 'books' });
    const { data: groups = [] } = useGetGroupsQuery(undefined, { skip: view !== 'groups' });

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (view === 'leads') {
            return leads
                .filter((l) => {
                    const hay = `${l.firstName ?? ''} ${l.phone ?? ''} ${l.statusDisplay ?? l.status ?? ''}`.toLowerCase();
                    return !q || hay.includes(q);
                })
                .map((l) => ({
                    id: String(l.id),
                    name: l.firstName ?? '—',
                    phone: l.phone ?? '—',
                    status: l.statusDisplay ?? l.status ?? '—',
                    statusSince: l.scheduledDate ?? l.date ?? '—',
                }));
        }

        if (view === 'students') {
            return students
                .filter((s) => {
                    const hay = `${s.firstName ?? ''} ${s.lastName ?? ''} ${s.phone ?? ''} ${s.groupName ?? ''}`.toLowerCase();
                    return !q || hay.includes(q);
                })
                .map((s) => ({
                    id: String(s.id),
                    name: `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || '—',
                    phone: s.phone ?? '—',
                    teacher: s.teacherName ?? '—',
                    group: s.groupName ?? '—',
                    balance: `${Number(s.balance ?? 0).toLocaleString()} UZS`,
                    avatar: (s.firstName?.[0] ?? 'S').toUpperCase(),
                }));
        }

        if (view === 'trial') {
            return trials
                .filter((t) => {
                    const hay = `${t.name ?? ''} ${t.phone ?? ''} ${t.group ?? ''}`.toLowerCase();
                    return !q || hay.includes(q);
                })
                .map((t, i) => ({
                    id: String(t.id ?? i),
                    name: t.name ?? '—',
                    phone: t.phone ?? '—',
                    teacher: t.teacher ?? '—',
                    group: t.group ?? '—',
                    schedule: t.balance || '—',
                }));
        }

        if (view === 'debtors') {
            return debtors
                .filter((d) => {
                    const hay = `${d.name ?? ''} ${d.phone ?? ''} ${d.group ?? ''}`.toLowerCase();
                    return !q || hay.includes(q);
                })
                .map((d, i) => ({
                    id: String(d.id ?? i),
                    name: d.name ?? '—',
                    phone: d.phone ?? '—',
                    teacher: d.teacher ?? '—',
                    group: d.group ?? '—',
                    balance: `${Number(d.balance ?? 0).toLocaleString()} UZS`,
                }));
        }

        if (view === 'books') {
            return books
                .filter((b) => {
                    const hay = `${b.title ?? ''} ${b.author ?? ''} ${b.category ?? ''}`.toLowerCase();
                    return !q || hay.includes(q);
                })
                .map((b) => ({
                    id: String(b.id),
                    book: b.title ?? '—',
                    author: b.author ?? '—',
                    category: b.category || 'Uncategorized',
                    stock: String(b.copies ?? 0),
                }));
        }

        return groups
            .filter((g) => {
                const hay = `${g.name ?? ''} ${g.teacherName ?? ''} ${g.roomName ?? ''}`.toLowerCase();
                return !q || hay.includes(q);
            })
            .map((g) => ({
                id: String(g.id),
                group: g.name ?? '—',
                students: String(g.studentCount ?? 0),
                teacher: g.teacherName ?? g.teacher ?? '—',
                room: g.roomName ?? '—',
                expected: g.price ? `${Number(g.price).toLocaleString()} UZS` : '—',
                weekDays: g.weekDays ?? '···',
                avatar: (g.name?.[0] ?? 'G').toUpperCase(),
            }));
    }, [view, query, leads, students, trials, debtors, books, groups]);

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <button
                type="button"
                onClick={() => navigate('/the-mind')}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8A9BB8] hover:text-[#F37021]"
            >
                <ArrowLeft size={14} />
                Back to Analytics
            </button>

            <div>
                <h1 className="text-[22px] font-extrabold text-[#1A2233] tracking-tight">{config.title}</h1>
                <p className="text-[11px] font-semibold text-[#8A9BB8] mt-0.5">{rows.length} records</p>
            </div>

            <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8]" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={config.placeholder}
                    className="w-full h-11 rounded-xl border border-[#F0F1F5] bg-white pl-11 pr-4 text-[13px] font-semibold text-[#1A2233] placeholder-[#8A9BB8] outline-none focus:border-[#F37021]/40"
                />
            </div>

            {view === 'leads' && (
                <div className="rounded-xl border border-[#F0F1F5] bg-white p-4 flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F37021]/10">
                        <Info size={18} className="text-[#F37021]" />
                    </div>
                    <div>
                        <p className="text-[13px] font-extrabold text-[#1A2233]">CRM outcomes (this device)</p>
                        <p className="text-[11px] font-semibold text-[#8A9BB8] mt-0.5">
                            No outcomes recorded yet. Archive a lead or remove a student to see breakdowns.
                        </p>
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-[18px] border border-[#F0F1F5] bg-white shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                        <thead>
                            <tr className="border-b border-[#F0F1F5] bg-[#FAFBFC]">
                                {config.columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className={`px-4 py-3 text-[10px] font-black tracking-widest text-[#8A9BB8] ${
                                            col.align === 'right' ? 'text-right' : 'text-left'
                                        }`}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={config.columns.length} className="px-4 py-16 text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5F6FA] text-[#8A9BB8]">
                                            <Search size={20} />
                                        </div>
                                        <p className="text-[13px] font-extrabold text-[#1A2233]">No data</p>
                                        <p className="text-[11px] font-semibold text-[#8A9BB8] mt-1">
                                            {query ? 'Nothing found for your search.' : 'No records in this list yet.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr key={row.id} className="border-b border-[#F0F1F5] last:border-b-0 hover:bg-[#FAFBFC]">
                                        {config.columns.map((col) => {
                                            const value = row[col.key as keyof typeof row] ?? '—';
                                            const isNameCol = col.key === 'name' || col.key === 'group' || col.key === 'book';
                                            return (
                                                <td
                                                    key={col.key}
                                                    className={`px-4 py-3 text-[12px] font-semibold text-[#1A2233] ${
                                                        col.align === 'right' ? 'text-right font-black' : ''
                                                    } ${col.key === 'group' && view === 'students' ? 'text-[#4C6FFF]' : ''}`}
                                                >
                                                    {isNameCol && 'avatar' in row ? (
                                                        <span className="inline-flex items-center gap-2">
                                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F37021]/15 text-[11px] font-black text-[#F37021]">
                                                                {String(row.avatar)}
                                                            </span>
                                                            {String(value)}
                                                        </span>
                                                    ) : (
                                                        String(value)
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
