import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useGetStatsQuery,
    useGetFinanceQuery,
    useGetTrialStatsQuery,
    useGetDebtorsQuery,
    useGetTrialLessonsQuery,
    useGetAbsentQuery,
    useGetWeeklyQuery,
    useSendRemindersMutation,
} from '../../store/api/dashboardApi';
import { useGetStudentsQuery, useGetStudentDashboardQuery } from '../../store/api/studentApi';
import StudentListDialog, { type StudentListEntry } from '../../components/common/dialogs/StudentListDialog';
import HomeAttendanceChart from './sections/HomeAttendanceChart';
import { useToast } from '../../hooks/useToast';
import {
    ChevronRight, CalendarDays, AlertTriangle, UserX,
    FileText, GraduationCap, CalendarCheck, BadgeCheck,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const ORANGE = '#F37021';

function formatUzs(value: number): string {
    return `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} UZS`;
}

interface HomeStudent {
    id?: number;
    studentId?: number;
    full_name?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    phone_number?: string;
    group?: string;
    group_name?: string;
}

function toEntries(list: HomeStudent[]): StudentListEntry[] {
    return list.map((s, i) => {
        const id = String(s.id ?? s.studentId ?? i);
        const name =
            s.full_name ||
            s.name ||
            `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() ||
            'Unknown';
        const phone = s.phone ?? s.phone_number;
        const group = s.group_name ?? s.group;
        const studentId = s.id ?? s.studentId;
        const href = studentId != null ? `/student-details/${studentId}` : undefined;
        return { id, name, phone, group, href };
    });
}

export default function HomePage() {
    const navigate = useNavigate();
    const { data: stats, isLoading: statsLoading } = useGetStatsQuery();
    const { data: trialStats } = useGetTrialStatsQuery();
    const { data: finance } = useGetFinanceQuery();
    const { data: debtors = [] } = useGetDebtorsQuery();
    const { data: trials } = useGetTrialLessonsQuery();
    const { data: absents } = useGetAbsentQuery();
    const { data: weekly } = useGetWeeklyQuery();
    const { data: students = [] } = useGetStudentsQuery();
    const { data: studentDashboard } = useGetStudentDashboardQuery();

    const studentCount = stats?.students
        || studentDashboard?.cards.activeStudents
        || 0;
    const newStudentsCount = stats?.newStudents ?? 0;
    const debtorsCount = debtors.length || studentDashboard?.cards.debtors || 0;

    const chartData = useMemo(() => {
        if (!weekly || weekly.length === 0) {
            return [
                { name: 'M', value: 0 }, { name: 'T', value: 0 }, { name: 'W', value: 0 },
                { name: 'T', value: 0 }, { name: 'F', value: 0 }, { name: 'S', value: 0 }, { name: 'S', value: 0 },
            ];
        }
        return weekly.map((w) => ({
            name: new Date(w.date).toLocaleDateString('en-US', { weekday: 'narrow' }),
            value: Number(w.count || 0),
        }));
    }, [weekly]);

    const hasChartData = chartData.some((d) => d.value > 0);

    const expectedAmount = Number(finance?.expected ?? 0);
    const receivedAmount = Number(finance?.paid ?? 0);
    const remainingAmount = Number(finance?.remaining ?? Math.max(0, expectedAmount - receivedAmount));
    const progress = finance?.progress != null
        ? Math.min(100, Math.round(finance.progress))
        : expectedAmount > 0
            ? Math.min(100, Math.round((receivedAmount / expectedAmount) * 100))
            : 0;

    const studentEntries = useMemo(
        () =>
            students.map((s) => ({
                id: String(s.id ?? ''),
                name: `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || `Student #${s.id}`,
                phone: s.phone,
                group: s.groupName,
                href: s.id != null ? `/student-details/${s.id}` : undefined,
            })),
        [students],
    );

    const debtorsList = (debtors ?? []) as unknown as HomeStudent[];

    const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
    const [debtorsDialogOpen, setDebtorsDialogOpen] = useState(false);

    const topStats = [
        {
            title: 'Students',
            value: studentCount,
            icon: GraduationCap,
            color: '#4C6FFF',
            onClick: () => setStudentsDialogOpen(true),
            loading: statsLoading && !studentCount,
        },
        {
            title: 'Trial Lessons',
            value: trialStats?.coming ?? 0,
            icon: CalendarCheck,
            color: ORANGE,
        },
        {
            title: 'New Students',
            value: newStudentsCount,
            icon: BadgeCheck,
            color: '#9B59B6',
        },
        {
            title: 'Debtors',
            value: debtorsCount,
            icon: AlertTriangle,
            color: '#E74C3C',
            onClick: () => setDebtorsDialogOpen(true),
        },
    ];

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="lg:hidden">
                <h1 className="text-[18px] font-extrabold text-[#1A2233] tracking-tight leading-tight">
                    Overview of indicators
                </h1>
                <p className="text-[11px] text-[#8A9BB8] font-semibold mt-0.5">
                    Trial lessons today · New active students this month
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {topStats.map((card) => (
                    <StatCard key={card.title} {...card} />
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-3 items-stretch">
                <div className="flex-1 min-w-0 bg-white p-5 rounded-[18px] border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[15px] font-extrabold text-[#1A2233]">Trial Lessons</h3>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF5F0] px-2.5 py-1 text-[10px] font-bold text-[#F37021]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#F37021]" />
                            This Week
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
                        {[
                            { label: 'ENROLLED', value: trialStats?.enrolled ?? 0, bg: '#F3EEFF', color: '#9B59B6' },
                            { label: 'COMING', value: trialStats?.coming ?? 0, bg: '#FFF5F0', color: ORANGE },
                            { label: 'ARRIVED', value: trialStats?.arrived ?? 0, bg: '#ECFDF5', color: '#2ECC8A' },
                            { label: 'TOTAL', value: trialStats?.total ?? 0, bg: '#1A2233', color: '#fff' },
                        ].map((s) => (
                            <div
                                key={s.label}
                                className="rounded-xl px-3 py-3.5 flex flex-col items-center justify-center min-h-[80px]"
                                style={{ backgroundColor: s.bg }}
                            >
                                <span
                                    className="text-[9px] font-black tracking-[0.12em] mb-2"
                                    style={{ color: s.label === 'TOTAL' ? 'rgba(255,255,255,0.65)' : s.color }}
                                >
                                    {s.label}
                                </span>
                                <span
                                    className="text-[24px] font-black leading-none"
                                    style={{ color: s.color }}
                                >
                                    {s.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="h-[120px] w-full">
                        {!hasChartData ? (
                            <div className="h-full flex items-center text-[11px] font-semibold text-[#8A9BB8]">
                                Weekly chart has no data yet.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#8A9BB8', fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                                        {chartData.map((_entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={index === chartData.length - 1 ? ORANGE : `${ORANGE}33`}
                                            />
                                        ))}
                                    </Bar>
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        content={({ active, payload }) => {
                                            if (active && payload?.length) {
                                                return (
                                                    <div className="bg-[#1A2233] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-xl">
                                                        {payload[0].value} lessons
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div
                    className="w-full lg:w-[300px] lg:max-w-[300px] shrink-0 rounded-[18px] p-3.5 flex flex-col justify-between shadow-[0_15px_40px_rgba(243,112,33,0.22)] min-h-[280px]"
                    style={{ backgroundColor: ORANGE }}
                >
                    <div>
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2 py-1 mb-4">
                            <FileText size={10} className="text-white/90" />
                            <span className="text-white text-[8px] font-black uppercase tracking-[0.12em]">
                                Financial Plan
                            </span>
                        </div>

                        <p className="text-white/75 text-[9px] font-semibold mb-0.5 leading-snug">Expected payment amount</p>
                        <h2 className="text-white text-[17px] font-black leading-tight mb-4 tracking-tight break-words">
                            {formatUzs(expectedAmount)}
                        </h2>

                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-1.5 gap-1">
                                <span className="text-white/85 text-[9px] font-semibold leading-tight">Collection progress</span>
                                <span className="text-white text-[10px] font-black shrink-0">{progress}%</span>
                            </div>
                            <div className="h-[3px] w-full bg-white/25 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-700"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-white/55 text-[9px] font-semibold mb-0.5">Received</p>
                                <p className="text-white text-[11px] font-black leading-tight break-words">{formatUzs(receivedAmount)}</p>
                            </div>
                            <div className="border-t border-white/20 pt-3">
                                <p className="text-white/55 text-[9px] font-semibold mb-0.5">Remaining</p>
                                <p className="text-white text-[11px] font-black leading-tight break-words">{formatUzs(remainingAmount)}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/transactions')}
                        className="w-full mt-4 bg-white text-[#F37021] py-2 rounded-xl text-[10px] font-black hover:bg-white/95 transition-colors"
                    >
                        Open finances
                    </button>
                </div>
            </div>

            <HomeAttendanceChart />

            <BottomWidgets
                trials={(trials ?? []) as unknown as HomeStudent[]}
                debtors={debtorsList}
                absents={(absents ?? []) as unknown as HomeStudent[]}
            />

            {studentsDialogOpen && (
                <StudentListDialog
                    title="Students"
                    subtitle={`${studentEntries.length} students total`}
                    icon={GraduationCap}
                    iconBg="#9B59B61A"
                    iconColor="#9B59B6"
                    students={studentEntries}
                    onClose={() => setStudentsDialogOpen(false)}
                />
            )}

            {debtorsDialogOpen && (
                <StudentListDialog
                    title="Debtors"
                    subtitle={debtorsList.length === 0 ? 'No debtor records in the list' : `${debtorsList.length} debtors`}
                    icon={AlertTriangle}
                    iconBg="#E74C3C1A"
                    iconColor="#E74C3C"
                    students={toEntries(debtorsList)}
                    onClose={() => setDebtorsDialogOpen(false)}
                />
            )}
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    color,
    onClick,
    loading,
}: {
    title: string;
    value: number;
    icon: typeof GraduationCap;
    color: string;
    onClick?: () => void;
    loading?: boolean;
}) {
    const Wrapper = onClick ? 'button' : 'div';
    return (
        <Wrapper
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={`bg-white p-4 rounded-[18px] border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] flex items-start justify-between text-left min-h-[96px] ${
                onClick ? 'hover:border-[#F37021]/30 transition-colors cursor-pointer' : ''
            }`}
        >
            <div>
                <p className="text-[11px] font-bold text-[#8A9BB8] mb-2">{title}</p>
                <p className="text-[26px] font-black text-[#1A2233] leading-none">
                    {loading ? '…' : value}
                </p>
            </div>
            <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}1A` }}
            >
                <Icon size={18} style={{ color }} />
            </div>
        </Wrapper>
    );
}

function BottomWidgets({
    trials,
    debtors,
    absents,
}: {
    trials: HomeStudent[];
    debtors: HomeStudent[];
    absents: HomeStudent[];
}) {
    type DialogKind = 'trial' | 'debtors' | 'absent' | null;
    const [open, setOpen] = useState<DialogKind>(null);
    const [sendReminders, { isLoading: sendingReminders }] = useSendRemindersMutation();
    const toast = useToast();

    const handleSendReminders = async (kind: 'debtors' | 'absent' | 'trial') => {
        const audience = kind === 'trial' ? 'new' : 'active';
        try {
            await sendReminders({ audience }).unwrap();
            toast.success('Reminders sent successfully');
        } catch {
            toast.error('Could not send reminders');
        }
    };

    const widgets = [
        {
            kind: 'trial' as const,
            title: 'Trial lessons (today)',
            count: trials.length,
            icon: CalendarDays,
            iconColor: ORANGE,
            badgeBg: '#EEF2FF',
            badgeColor: '#4C6FFF',
        },
        {
            kind: 'debtors' as const,
            title: 'Debtors',
            count: debtors.length,
            icon: AlertTriangle,
            iconColor: '#E74C3C',
            badgeBg: '#FFF5F0',
            badgeColor: '#F37021',
        },
        {
            kind: 'absent' as const,
            title: 'Absent',
            count: absents.length,
            icon: UserX,
            iconColor: '#8A9BB8',
            badgeBg: '#F0F2F7',
            badgeColor: '#8A9BB8',
        },
    ];

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {widgets.map((w) => {
                    const Icon = w.icon;
                    return (
                        <div
                            key={w.kind}
                            className="bg-white rounded-[18px] border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] p-5 flex flex-col min-h-[178px]"
                        >
                            <button
                                type="button"
                                onClick={() => setOpen(w.kind)}
                                className="flex items-center justify-between mb-0 group w-full text-left"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <Icon size={17} style={{ color: w.iconColor }} className="shrink-0" />
                                    <span className="text-[13px] font-extrabold text-[#1A2233] truncate">{w.title}</span>
                                </div>
                                <span
                                    className="flex items-center gap-0.5 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-2 group-hover:opacity-80 transition-opacity"
                                    style={{ backgroundColor: w.badgeBg, color: w.badgeColor }}
                                >
                                    {w.count}
                                    <ChevronRight size={12} strokeWidth={2.5} />
                                </span>
                            </button>

                            <div className="flex-1 flex items-center justify-center py-6">
                                <p className="text-[11px] font-semibold text-[#8A9BB8]">
                                    {w.count === 0 ? 'No data' : `${w.count} students`}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleSendReminders(w.kind)}
                                disabled={sendingReminders}
                                className="w-full rounded-xl border border-[#E8EBF2] bg-white py-2.5 text-[11px] font-bold text-[#5A6376] hover:bg-[#F8F9FB] disabled:opacity-50 transition-colors"
                            >
                                Send reminders
                            </button>
                        </div>
                    );
                })}
            </div>

            {open === 'trial' && (
                <StudentListDialog
                    title="Trial lessons (today)"
                    subtitle={`${trials.length} students`}
                    icon={CalendarDays}
                    iconBg="#FFF5F0"
                    iconColor={ORANGE}
                    students={toEntries(trials)}
                    placeholder="Search by name or group..."
                    onClose={() => setOpen(null)}
                />
            )}
            {open === 'debtors' && (
                <StudentListDialog
                    title="Debtors"
                    subtitle={debtors.length === 0 ? 'No debtor records in the list' : `${debtors.length} debtors`}
                    icon={AlertTriangle}
                    iconBg="#E74C3C1A"
                    iconColor="#E74C3C"
                    students={toEntries(debtors)}
                    onClose={() => setOpen(null)}
                    onSendReminders={() => handleSendReminders('debtors')}
                    sendReminderLoading={sendingReminders}
                />
            )}
            {open === 'absent' && (
                <StudentListDialog
                    title="Absent"
                    subtitle={absents.length === 0 ? 'No absent students' : `${absents.length} students`}
                    icon={UserX}
                    iconBg="#F0F2F71A"
                    iconColor="#8A9BB8"
                    students={toEntries(absents)}
                    onClose={() => setOpen(null)}
                    onSendReminders={() => handleSendReminders('absent')}
                    sendReminderLoading={sendingReminders}
                />
            )}
        </>
    );
}
