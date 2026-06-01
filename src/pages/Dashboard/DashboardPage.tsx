import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, BookOpen, GraduationCap, UserPlus, AlertCircle, BookText,
    Banknote, CreditCard, Smartphone, Plus, Folder, CheckCircle2,
} from 'lucide-react';
import {
    useGetMainStatsQuery,
    useGetSalesFunnelQuery,
    useGetFinanceAnalyticsQuery,
    useGetAttendanceLast30DaysQuery,
    useGetBooksQuery,
    useAddBookMutation,
} from '../../store/api/mainTheMindApi';
import { useGetBooksAnalyticsQuery } from '../../store/api/dashboardApi';
import ModalShell from '../../components/common/ModalShell';
import { downloadCsv } from '../../utils/downloadCsv';
import { formatApiError } from '../../utils/apiError';
import { useToast } from '../../hooks/useToast';
import AnalyticsRoomSchedule from '../Analytics/sections/AnalyticsRoomSchedule';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const ORANGE = '#F37021';
const ANALYTICS_COLORS = ['#4C6FFF', '#2ECC8A', ORANGE, '#E74C3C', '#9B59B6', '#00C7BE'];

function updatedLabel() {
    const now = new Date();
    return `Updated today · ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

function AppCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-[18px] border border-[#F0F1F5] p-4 shadow-[0_2px_12px_rgba(26,34,51,0.04)] ${className}`}>
            {children}
        </div>
    );
}

function AnalyticsStatCard({
    title,
    value,
    index,
    icon: Icon,
    onClick,
}: {
    title: string;
    value: number;
    index: number;
    icon: typeof Users;
    onClick: () => void;
}) {
    const color = ANALYTICS_COLORS[index % ANALYTICS_COLORS.length];
    return (
        <button
            type="button"
            onClick={onClick}
            className="bg-white rounded-[18px] border border-[#F0F1F5] p-4 shadow-[0_2px_12px_rgba(26,34,51,0.04)] flex flex-col min-h-[118px] min-w-[160px] lg:min-w-0 text-left hover:border-[#F37021]/30 transition-colors"
        >
            <div className="flex items-center gap-2.5">
                <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}1A` }}
                >
                    <Icon size={16} style={{ color }} />
                </div>
                <span className="text-[10px] font-bold text-[#8A9BB8] truncate">{title}</span>
            </div>
            <div className="mt-auto pt-3">
                <div className="text-[22px] font-black text-[#1A2233] leading-none">{value}</div>
                <div className="text-[9px] text-[#A0AEC0] mt-2 font-semibold">{updatedLabel()}</div>
            </div>
        </button>
    );
}

function SalesFunnelSection() {
    const { data, isLoading } = useGetSalesFunnelQuery();
    const steps = [
        { key: 'requests', label: 'Requests' },
        { key: 'trialArrived', label: 'Trial Arrived' },
        { key: 'trialLeft', label: 'Trial Left' },
        { key: 'paid', label: 'Paid' },
    ] as const;

    const max = data
        ? Math.max(data.requests, data.trialArrived, data.trialLeft, data.paid, 1)
        : 1;

    return (
        <AppCard>
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-[15px] font-extrabold text-[#1A2233]">Sales Funnel</h3>
                <span className="text-[11px] font-bold text-[#F37021]">
                    Conversion: {(data?.conversion ?? 0).toFixed(1)}%
                </span>
            </div>

            {isLoading ? (
                <p className="text-[11px] font-semibold text-[#8A9BB8] py-8 text-center">Loading...</p>
            ) : (
                <div className="space-y-4">
                    {steps.map((step) => {
                        const count = data ? (data[step.key] as number) : 0;
                        const pct = Math.round((count / max) * 100);
                        const fillOpacity = (0.45 + (pct / 100) * 0.55).toFixed(2);
                        return (
                            <div key={step.key}>
                                <div className="flex justify-between items-end mb-1.5">
                                    <span className="text-[12px] font-semibold text-[#5A6376]">{step.label}</span>
                                    <span className="text-[12px] font-black text-[#1A2233]">
                                        {count} ({pct}%)
                                    </span>
                                </div>
                                <div className="h-6 w-full bg-[#F37021]/10 rounded-lg overflow-hidden">
                                    <div
                                        className="h-full rounded-lg transition-all duration-700"
                                        style={{
                                            width: `${pct}%`,
                                            backgroundColor: `rgba(243, 112, 33, ${fillOpacity})`,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </AppCard>
    );
}

function FinanceSection({ onDownload }: { onDownload: () => void }) {
    const { data, isLoading } = useGetFinanceAnalyticsQuery();
    const [tab, setTab] = useState<'new' | 'existing'>('new');

    const monthLabel = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    if (isLoading) {
        return (
            <AppCard>
                <p className="text-[11px] font-semibold text-[#8A9BB8] py-12 text-center">Loading finance...</p>
            </AppCard>
        );
    }

    const newCount = data?.studentNew ?? 0;
    const existingCount = data?.studentExisting ?? 0;

    return (
        <AppCard className="flex flex-col">
            <h3 className="text-[15px] font-extrabold text-[#1A2233] mb-4">Finance</h3>

            <div className="flex gap-6 border-b border-[#F0F1F5] mb-4">
                {([
                    { id: 'new' as const, label: 'New', count: newCount },
                    { id: 'existing' as const, label: 'Existing', count: existingCount },
                ]).map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setTab(item.id)}
                        className={`pb-2 text-[12px] font-bold transition-colors ${
                            tab === item.id
                                ? 'text-[#1A2233] border-b-2 border-[#F37021]'
                                : 'text-[#8A9BB8]'
                        }`}
                    >
                        {item.label}{' '}
                        <span className={tab === item.id ? 'text-[#F37021]' : ''}>{item.count}</span>
                    </button>
                ))}
            </div>

            <p className="text-[10px] font-bold text-[#8A9BB8] mb-3">
                Payment Method · Current month · {monthLabel}
            </p>

            <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                    { label: 'Cash', icon: Banknote, color: '#2ECC8A', value: data?.cash ?? 0 },
                    { label: 'Card', icon: CreditCard, color: ORANGE, value: data?.card ?? 0 },
                    { label: 'Online', icon: Smartphone, color: '#4C6FFF', value: data?.online ?? 0 },
                ].map((p) => (
                    <div key={p.label} className="text-center">
                        <div
                            className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${p.color}1A` }}
                        >
                            <p.icon size={16} style={{ color: p.color }} />
                        </div>
                        <p className="text-[10px] font-bold text-[#8A9BB8]">{p.label}</p>
                        <p className="text-[14px] font-black text-[#1A2233]">{p.value}</p>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={onDownload}
                className="mt-auto w-full rounded-xl bg-[#F37021] py-3 text-[12px] font-black text-white hover:bg-[#E5651A] transition-colors"
            >
                Download Report
            </button>
        </AppCard>
    );
}

function BooksAnalyticsSection({ onAddBook }: { onAddBook: () => void }) {
    const { data: analytics } = useGetBooksAnalyticsQuery();
    const { data: books = [] } = useGetBooksQuery();

    const categoryRows = useMemo(() => {
        const map = new Map<string, { total: number; issued: number; wait: number; empty: number }>();
        for (const book of books) {
            const cat = book.category?.trim() || 'Uncategorized';
            const row = map.get(cat) ?? { total: 0, issued: 0, wait: 0, empty: 0 };
            row.total += book.copies ?? 0;
            row.issued += book.issued ?? 0;
            row.wait += Math.max(0, (book.copies ?? 0) - (book.issued ?? 0) - (book.returned ?? 0));
            row.empty += Math.max(0, (book.copies ?? 0) - (book.issued ?? 0));
            map.set(cat, row);
        }
        if (map.size === 0) {
            map.set('Uncategorized', { total: analytics?.totalBooks ?? 0, issued: 0, wait: 0, empty: 0 });
        }
        return Array.from(map.entries()).map(([category, stats]) => ({ category, ...stats }));
    }, [books, analytics?.totalBooks]);

    const miniStats = [
        { label: 'Total Books', value: analytics?.totalBooks ?? books.length, icon: Folder, color: ORANGE },
        { label: 'Issued Books', value: analytics?.issuedBooks ?? 0, icon: BookOpen, color: '#4C6FFF' },
        { label: 'Returned Books', value: analytics?.returnedBooks ?? 0, icon: CheckCircle2, color: '#2ECC8A' },
    ];

    return (
        <AppCard>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-extrabold text-[#1A2233]">Books Analytics</h3>
                <button
                    type="button"
                    onClick={onAddBook}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#F37021] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#E5651A]"
                >
                    <Plus size={14} />
                    Add Book
                </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
                {miniStats.map((s) => (
                    <div key={s.label} className="rounded-xl border border-[#F0F1F5] p-3">
                        <div
                            className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${s.color}1A` }}
                        >
                            <s.icon size={15} style={{ color: s.color }} />
                        </div>
                        <p className="text-[18px] font-black text-[#1A2233] leading-none">{s.value}</p>
                        <p className="text-[10px] font-bold text-[#8A9BB8] mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <p className="text-[11px] font-extrabold text-[#1A2233] mb-2">Books by category</p>
            <div className="overflow-x-auto rounded-xl border border-[#F0F1F5]">
                <table className="w-full min-w-[480px]">
                    <thead>
                        <tr className="border-b border-[#F0F1F5] bg-[#FAFBFC]">
                            {['Category', 'Total', 'Issued', 'Wait', 'Empty'].map((h) => (
                                <th key={h} className="px-3 py-2 text-left text-[9px] font-black tracking-widest text-[#8A9BB8]">
                                    {h.toUpperCase()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {categoryRows.map((row) => (
                            <tr key={row.category} className="border-b border-[#F0F1F5] last:border-b-0">
                                <td className="px-3 py-2.5 text-[12px] font-semibold text-[#1A2233]">{row.category}</td>
                                <td className="px-3 py-2.5 text-[12px] font-semibold text-[#1A2233]">{row.total}</td>
                                <td className="px-3 py-2.5 text-[12px] font-semibold text-[#1A2233]">{row.issued}</td>
                                <td className="px-3 py-2.5 text-[12px] font-semibold text-[#1A2233]">{row.wait}</td>
                                <td className="px-3 py-2.5 text-[12px] font-semibold text-[#1A2233]">{row.empty}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppCard>
    );
}

function AttendanceSection() {
    const { data = [], isLoading } = useGetAttendanceLast30DaysQuery();

    const chartData = useMemo(
        () =>
            data.map((d) => ({
                date: d.date.toISOString().slice(5, 10),
                Attended: d.attended,
                Absent: d.absent,
            })),
        [data],
    );

    return (
        <AppCard>
            <h3 className="text-[15px] font-extrabold text-[#1A2233] mb-1">Attendance</h3>
            <p className="text-[11px] font-semibold text-[#8A9BB8] mb-4">Last 30 days</p>

            {isLoading ? (
                <p className="py-8 text-center text-[11px] font-semibold text-[#8A9BB8]">Loading...</p>
            ) : chartData.length === 0 ? (
                <p className="py-8 text-center text-[11px] font-semibold text-[#8A9BB8]">
                    No attendance data from the server for the last 30 days.
                </p>
            ) : (
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F1F5" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8A9BB8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8A9BB8' }} />
                            <Tooltip />
                            <Bar dataKey="Attended" fill="#2ECC81" radius={[4, 4, 0, 0]} barSize={8} />
                            <Bar dataKey="Absent" fill={ORANGE} radius={[4, 4, 0, 0]} barSize={8} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </AppCard>
    );
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const { data: stats, isLoading } = useGetMainStatsQuery();
    const { data: finance } = useGetFinanceAnalyticsQuery();
    const [addBook] = useAddBookMutation();
    const [showAddBook, setShowAddBook] = useState(false);

    const analyticsItems = [
        { title: 'Active Leads', value: stats?.leads ?? 0, icon: UserPlus, view: 'leads' },
        { title: 'Active Students', value: stats?.students ?? 0, icon: Users, view: 'students' },
        { title: 'Trial Lesson', value: stats?.trial ?? 0, icon: GraduationCap, view: 'trial' },
        { title: 'Debtors', value: stats?.debtors ?? 0, icon: AlertCircle, view: 'debtors' },
        { title: 'Books', value: stats?.books ?? 0, icon: BookText, view: 'books' },
        { title: 'Groups', value: stats?.groups ?? 0, icon: BookOpen, view: 'groups' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[320px]">
                <div className="w-10 h-10 border-4 border-[#F37021]/20 border-t-[#F37021] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-6">
            <div className="flex lg:grid lg:grid-cols-6 gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {analyticsItems.map((item, i) => (
                    <AnalyticsStatCard
                        key={item.view}
                        title={item.title}
                        value={item.value}
                        index={i}
                        icon={item.icon}
                        onClick={() => navigate(`/analytics-debtors-detail?view=${item.view}`)}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-3">
                    <SalesFunnelSection />
                </div>
                <div className="lg:col-span-2">
                    <FinanceSection
                        onDownload={() =>
                            downloadCsv('finance-report.csv', [{
                                total: finance?.total ?? 0,
                                cash: finance?.cash ?? 0,
                                card: finance?.card ?? 0,
                                online: finance?.online ?? 0,
                                studentNew: finance?.studentNew ?? 0,
                                studentExisting: finance?.studentExisting ?? 0,
                            }])
                        }
                    />
                </div>
            </div>

            <AttendanceSection />

            <AnalyticsRoomSchedule />

            <BooksAnalyticsSection onAddBook={() => setShowAddBook(true)} />

            {showAddBook && (
                <AddBookDialog
                    onClose={() => setShowAddBook(false)}
                    onSubmit={async (payload) => {
                        await addBook(payload).unwrap();
                    }}
                />
            )}
        </div>
    );
}

function AddBookDialog({
    onClose,
    onSubmit,
}: {
    onClose: () => void;
    onSubmit: (data: { title: string; category: string; total: number }) => Promise<void>;
}) {
    const [form, setForm] = useState({ title: '', category: '', total: '1' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const toast = useToast();

    return (
        <ModalShell title="Add Book" onClose={onClose}>
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    setError('');
                    try {
                        await onSubmit({
                            title: form.title.trim(),
                            category: form.category.trim() || 'Uncategorized',
                            total: Math.max(1, Number(form.total) || 1),
                        });
                        toast.success('Book added successfully');
                        onClose();
                    } catch (err) {
                        setError(formatApiError(err, 'Could not add book.'));
                        toast.error(formatApiError(err, 'Could not add book.'));
                    } finally {
                        setLoading(false);
                    }
                }}
                className="space-y-3"
            >
                {error && (
                    <div className="rounded-xl border border-[#E74C3C]/30 bg-[#E74C3C]/10 px-3 py-2 text-[11px] font-semibold text-[#C0392B]">
                        {error}
                    </div>
                )}
                <input
                    className="w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] px-4 py-3 text-[13px] font-semibold outline-none focus:border-[#F37021]/50 focus:bg-white"
                    placeholder="Book title"
                    value={form.title}
                    onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
                />
                <input
                    className="w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] px-4 py-3 text-[13px] font-semibold outline-none focus:border-[#F37021]/50 focus:bg-white"
                    placeholder="Category"
                    value={form.category}
                    onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))}
                />
                <input
                    className="w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] px-4 py-3 text-[13px] font-semibold outline-none focus:border-[#F37021]/50 focus:bg-white"
                    type="number"
                    min={1}
                    placeholder="Copies"
                    value={form.total}
                    onChange={(e) => setForm((v) => ({ ...v, total: e.target.value }))}
                />
                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-[12px] font-bold text-[#8A9BB8]">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !form.title.trim()}
                        className="rounded-xl bg-[#F37021] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
