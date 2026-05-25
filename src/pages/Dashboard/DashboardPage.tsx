import React, { useState } from 'react';
import {
    Users, BookOpen, GraduationCap, TrendingUp, UserPlus,
    AlertCircle, BarChart3, BookText, CalendarDays,
    ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle,
    Info, Search, Bell, Plus, MoreHorizontal, LayoutGrid,
    CreditCard, Banknote, Smartphone, ChevronRight, Folder
} from 'lucide-react';
import {
    useGetWeeklyQuery,
    useGetFinanceQuery,
    useGetTrialStatsQuery,
} from '../../store/api/dashboardApi';
import { useGetMainStatsQuery } from '../../store/api/mainTheMindApi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell,
} from 'recharts';

// --- Types & Constants ---
const COLORS = {
    primary: '#ED6A2E',
    blue: '#4C6FFF',
    green: '#34C759',
    orange: '#FF9F0A',
    red: '#FF453A',
    purple: '#9B59B6',
    teal: '#00C7BE',
    grey: '#8A9BB8',
    textPrimary: '#1A2233',
    textSecondary: '#5A6376',
    bgLight: '#F4F6FA',
    border: '#F0F2F5'
};

const ANALYTICS_COLORS = [
    COLORS.blue, COLORS.green, COLORS.orange, COLORS.red, COLORS.purple, COLORS.teal
];

// --- Simple Components ---

const AppCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-2xl border border-[#F0F2F5] p-5 shadow-[0_2px_12px_rgba(26,34,51,0.04)] ${className}`}>
        {children}
    </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, action }: { icon: any, title: string, subtitle?: string, action?: React.ReactNode }) => (
    <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[#ED6A2E]/10 flex items-center justify-center text-[#ED6A2E]">
            <Icon size={18} />
        </div>
        <div className="flex-1">
            <h3 className="text-base font-bold text-[#1A2233] leading-none">{title}</h3>
            {subtitle && <p className="text-[11px] text-[#8A9BB8] mt-1 font-medium">{subtitle}</p>}
        </div>
        {action}
    </div>
);

// --- Main Dashboard Components ---

const AnalyticsCard = ({ title, value, index, icon: Icon }: { title: string, value: string | number, index: number, icon: any }) => {
    const color = ANALYTICS_COLORS[index % ANALYTICS_COLORS.length];
    return (
        <AppCard className="flex flex-col h-[130px] min-w-[175px] lg:min-w-0 p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <div className="flex items-center gap-3">
                <div
                    className="w-[34px] h-[34px] rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}1A` }}
                >
                    <Icon size={17} style={{ color: color }} />
                </div>
                <span className="text-[11px] font-bold text-[#8A9BB8] truncate uppercase tracking-tight">{title}</span>
            </div>
            <div className="mt-auto">
                <div className="text-[22px] font-extrabold text-[#1A2233] leading-none tracking-tight">{value}</div>
                <div className="text-[10px] text-[#A0AEC0] mt-2 font-bold uppercase tracking-wide">Updated today</div>
            </div>
        </AppCard>
    );
};

const BooksAnalytics = () => {
    const bookStats = [
        { label: 'Total Books', value: '3', icon: Folder, color: '#ED6A2E' },
        { label: 'Issued Books', value: '0', icon: BookOpen, color: '#6B7FD4' },
        { label: 'Returned Books', value: '0', icon: CheckCircle2, color: '#2ECC8A' },
        { label: 'Overdue Books', value: '0', icon: AlertCircle, color: '#E74C3C' },
    ];

    return (
        <AppCard className="p-6">
            <SectionHeader
                icon={BookText}
                title="Books Analytics"
                subtitle="Library overview"
                action={
                    <button className="bg-[#ED6A2E] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:shadow-lg hover:bg-[#D95B24] transition-all shadow-sm">
                        <Plus size={15} strokeWidth={3} />
                        Add Book
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {bookStats.map((s, i) => (
                    <div key={i} className="p-5 rounded-[20px] border border-[#F0F2F5] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[110px]" style={{ backgroundColor: `${s.color}06` }}>
                        <div className="flex justify-between items-start">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}1A` }}>
                                <s.icon size={16} style={{ color: s.color }} />
                            </div>
                            <div className="text-[10px] font-black text-[#8A9BB8] uppercase tracking-widest">{s.value}</div>
                        </div>
                        <div className="mt-4">
                            <div className="text-[20px] font-black text-[#1A2233] leading-none">{s.value}</div>
                            <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#8A9BB8] mt-2">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>
        </AppCard>
    );
};

const SalesFunnelCard = () => {
    const steps = [
        { label: "So'rovlar", count: 120 },
        { label: "Sinov keldi", count: 80 },
        { label: "Sinov ketdi", count: 100 },
        { label: "To'lov qildi", count: 40 },
    ];
    const max = 120;

    return (
        <AppCard className="p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-[18px] font-extrabold text-[#1A2233]">Sales Funnel</h3>
                </div>
                <div className="text-[#ED6A2E] text-[11px] font-bold">
                    Conversion: 0.0%
                </div>
            </div>

            <div className="space-y-6">
                {steps.map((step, i) => {
                    const progress = step.count / max;
                    const fillOpacity = (0.55 + progress * 0.45).toFixed(2);

                    return (
                        <div key={i} className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-[13px] text-[#5A6376] font-bold">{step.label}</span>
                                <span className="text-[13px] text-[#1A2233] font-black">{step.count} ({Math.round(progress * 100)}%)</span>
                            </div>
                            <div className="relative h-7 w-full bg-[#ED6A2E]/10 rounded-lg overflow-hidden border border-[#ED6A2E]/05">
                                <div
                                    className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out"
                                    style={{
                                        width: `${progress * 100}%`,
                                        backgroundColor: `rgba(237, 106, 46, ${fillOpacity})`,
                                        borderRadius: '6px'
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </AppCard>
    );
};

const FinanceCard = () => (
    <AppCard className="p-6">
        <div className="mb-6">
            <h3 className="text-[18px] font-extrabold text-[#1A2233]">Finance</h3>
            <p className="text-[11px] text-[#8A9BB8] font-bold uppercase mt-1">Revenue & Students</p>
        </div>

        <div className="bg-[#F7F8FA] rounded-xl p-5 mb-5 border border-[#F0F2F5]">
            <span className="text-[10px] font-black text-[#8A9BB8] tracking-widest uppercase mb-4 block">STUDENT TYPE</span>
            <div className="flex gap-6">
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-[#5A6376]">New</span>
                        <span className="text-[#ED6A2E]">30%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div className="h-full bg-[#ED6A2E]" style={{ width: '30%' }} />
                    </div>
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-[#5A6376]">Existing</span>
                        <span className="text-[#8A9BB8]">70%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div className="h-full bg-[#8A9BB8]" style={{ width: '70%' }} />
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-[#F7F8FA] rounded-xl p-5 mb-6 border border-[#F0F2F5]">
            <span className="text-[10px] font-black text-[#8A9BB8] tracking-widest uppercase mb-4 block">PAYMENT METHOD</span>
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Cash', icon: Banknote, color: '#2ECC8A', amt: '1.2M', pct: 40 },
                    { label: 'Card', icon: CreditCard, color: '#ED6A2E', amt: '2.5M', pct: 45 },
                    { label: 'Online', icon: Smartphone, color: '#6B7FD4', amt: '0.8M', pct: 15 }
                ].map((p, i) => (
                    <div key={i} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${p.color}1A` }}>
                                <p.icon size={15} style={{ color: p.color }} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[9px] text-[#A0AEC0] font-black uppercase tracking-tight truncate">{p.label}</div>
                                <div className="text-[13px] font-black leading-none mt-0.5" style={{ color: p.color }}>{p.pct}%</div>
                            </div>
                        </div>
                        <div className="text-[12px] font-black text-[#1A2233] tracking-tight">{p.amt} UZS</div>
                    </div>
                ))}
            </div>
        </div>

        <button className="w-full bg-[#ED6A2E] text-white h-[52px] rounded-xl text-[14px] font-black shadow-[0_6px_20px_rgba(237,106,46,0.25)] hover:shadow-[0_8px_25px_rgba(237,106,46,0.35)] transition-all active:scale-[0.98]">
            Download Report
        </button>
    </AppCard>
);

const AttendanceChartSection = () => {
    // Mock data for 1:1 look
    const chartData = [
        { date: '01.04', attended: 45, absent: 5 },
        { date: '05.04', attended: 42, absent: 8 },
        { date: '10.04', attended: 48, absent: 2 },
        { date: '15.04', attended: 35, absent: 15 },
        { date: '20.04', attended: 44, absent: 6 },
        { date: '25.04', attended: 50, absent: 0 },
        { date: '30.04', attended: 47, absent: 3 },
    ];

    return (
        <AppCard className="p-7">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-extrabold text-[#1A2233]">Attendance</h3>
                    <p className="text-xs text-[#8A9BB8] font-medium mt-1">Last 30 days overview</p>
                </div>
                <div className="flex gap-2">
                    {[
                        { label: 'Attended', value: '1,420', color: COLORS.green },
                        { label: 'Absent', value: '84', color: COLORS.primary },
                        { label: 'Rate', value: '94.2%', color: COLORS.blue }
                    ].map((s, i) => (
                        <div key={i} className="px-3.5 py-2.5 rounded-xl border transition-all" style={{ backgroundColor: `${s.color}0D`, borderColor: `${s.color}33` }}>
                            <div className="text-base font-extrabold leading-tight" style={{ color: s.color }}>{s.value}</div>
                            <div className="text-[9px] text-[#8A9BB8] font-bold uppercase tracking-wider mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-[280px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F2F5" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#8A9BB8', fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#8A9BB8', fontWeight: 600 }}
                        />
                        <Tooltip
                            cursor={{ fill: '#F7F8FA' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }}
                        />
                        <Bar
                            dataKey="absent"
                            fill={COLORS.primary}
                            radius={[4, 4, 0, 0]}
                            barSize={7}
                        />
                        <Bar
                            dataKey="attended"
                            fill={COLORS.green}
                            radius={[4, 4, 0, 0]}
                            barSize={7}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </AppCard>
    );
};

const RoomSchedule = () => {
    const rooms = [
        { name: 'Black', color: '#1A2233' },
        { name: 'Blue', color: '#6B7FD4' },
        { name: 'Green', color: '#2ECC8A' },
        { name: 'Orange', color: '#ED6A2E' },
    ];

    const generateTimes = () => {
        const times = [];
        for (let h = 7; h <= 20; h++) {
            times.push(`${h.toString().padStart(2, '0')}:00`);
            times.push(`${h.toString().padStart(2, '0')}:30`);
        }
        return times;
    };

    const lessons = [
        { room: 'Blue', title: 'Beginner', teacher: 'Teacher A', start: '09:00', end: '10:30' },
        { room: 'Black', title: 'IELTS 7.0', teacher: 'Teacher C', start: '10:00', end: '12:00' },
        { room: 'Green', title: 'Intermediate', teacher: 'Teacher B', start: '12:00', end: '13:00' },
        { room: 'Orange', title: 'Programming', teacher: 'Teacher D', start: '14:30', end: '16:00' },
    ];

    const timeToRow = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return (h - 7) * 2 + (m >= 30 ? 1 : 0);
    };

    const rowHeight = 44;
    const headerHeight = 44;
    const timeColWidth = 80;
    const roomWidth = 120;

    return (
        <AppCard className="p-0 overflow-hidden border-[#F0F2F5] shadow-xl">
            <div className="p-6 pb-2">
                <SectionHeader
                    icon={CalendarDays}
                    title="Room Schedule"
                    subtitle={`${rooms.length} rooms`}
                />

                <div className="flex overflow-x-auto gap-2 mb-4 scrollbar-hide">
                    {rooms.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border shrink-0 font-bold text-[10px]" style={{ backgroundColor: `${r.color}0D`, borderColor: `${r.color}33`, color: r.color }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.color }} />
                            {r.name.toUpperCase()}
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-[520px] overflow-hidden border-t border-[#F0F1F5] relative">
                <div className="h-full overflow-auto scrollbar-thin">
                    <div className="relative" style={{ width: `${timeColWidth + rooms.length * roomWidth}px` }}>
                        <div className="flex h-[44px] sticky top-0 z-20 bg-white border-b border-[#F0F1F5]">
                            <div className="w-[80px] flex items-center justify-center bg-[#F7F8FA] text-[10px] font-black text-[#8A9BB8] tracking-widest border-r border-[#F0F1F5]">
                                TIME
                            </div>
                            {rooms.map((r, i) => (
                                <div key={i} className="flex-1 flex items-center justify-center text-[10px] font-black tracking-widest border-r border-[#F0F1F5] last:border-0" style={{ backgroundColor: `${r.color}0A`, color: r.color }}>
                                    {r.name.toUpperCase()}
                                </div>
                            ))}
                        </div>

                        <div className="relative">
                            {generateTimes().map((t, i) => (
                                <div key={i} className="flex h-[44px] border-b border-[#F0F2F5]/50 last:border-0">
                                    <div className="w-[80px] flex items-center justify-center bg-[#F7F8FA] text-[9px] font-extrabold text-[#8A9BB8] border-r border-[#F0F1F5]">
                                        {t}
                                    </div>
                                    {rooms.map((_, ri) => (
                                        <div key={ri} className="flex-1 border-r border-[#F0F2F5]/30 last:border-0" />
                                    ))}
                                </div>
                            ))}

                            {lessons.map((l, i) => {
                                const ri = rooms.findIndex(r => r.name === l.room);
                                const color = rooms[ri].color;
                                const startRow = timeToRow(l.start);
                                const endRow = timeToRow(l.end);
                                const durationRows = endRow - startRow;

                                return (
                                    <div
                                        key={i}
                                        className="absolute p-2.5 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer z-10 overflow-hidden shadow-lg"
                                        style={{
                                            top: `${startRow * rowHeight + 4}px`,
                                            left: `${timeColWidth + ri * roomWidth + 5}px`,
                                            width: `${roomWidth - 10}px`,
                                            height: `${durationRows * rowHeight - 8}px`,
                                            backgroundColor: color,
                                            borderColor: `${color}4D`,
                                            boxShadow: `0 4px 12px ${color}4D`
                                        }}
                                    >
                                        <div className="text-[11px] font-black text-white leading-tight truncate">{l.title}</div>
                                        {durationRows > 1 && (
                                            <div className="text-[9px] text-white/80 font-bold mt-1 truncate">{l.teacher}</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-[#F0F1F5] flex justify-center">
                <button className="flex items-center gap-2 text-[#ED6A2E] text-xs font-black hover:opacity-80 transition-opacity">
                    <LayoutGrid size={15} />
                    OPEN FULL SCHEDULE
                </button>
            </div>
        </AppCard>
    );
};

export default function DashboardPage() {
    const { data: stats, isLoading: statsLoading } = useGetMainStatsQuery();

    const analyticsItems = [
        { title: 'Active Leads', value: stats?.leads ?? 0, icon: UserPlus },
        { title: 'Active Students', value: stats?.students ?? 0, icon: Users },
        { title: 'Trial Lesson', value: stats?.trial ?? 0, icon: GraduationCap },
        { title: 'Debtors', value: stats?.debtors ?? 0, icon: AlertCircle },
        { title: 'Books', value: stats?.books ?? 0, icon: BookText },
        { title: 'Groups', value: stats?.groups ?? 0, icon: BookOpen },
    ];

    if (statsLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-bg-app">
                <div className="w-12 h-12 border-4 border-[#ED6A2E]/20 border-t-[#ED6A2E] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-full pb-10 space-y-5 animate-in fade-in duration-500">
            {/* Analytics Grid */}
            <div className="flex lg:grid lg:grid-cols-6 gap-4 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
                {analyticsItems.map((item, i) => (
                    <AnalyticsCard key={i} {...item} index={i} />
                ))}
            </div>

            {/* Books Analytics */}
            <BooksAnalytics />

            {/* Top Area: Funnel & Finance */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3">
                    <SalesFunnelCard />
                </div>
                <div className="lg:col-span-2">
                    <FinanceCard />
                </div>
            </div>

            {/* Attendance Chart */}
            <AttendanceChartSection />

            {/* Room Schedule */}
            <RoomSchedule />
        </div>
    );
}
