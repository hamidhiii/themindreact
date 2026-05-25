import { useMemo } from 'react';
import {
    useGetStatsQuery,
    useGetFinanceQuery,
    useGetTrialStatsQuery,
    useGetDebtorsQuery,
    useGetTrialLessonsQuery,
    useGetAbsentQuery,
    useGetWeeklyQuery
} from '../../store/api/dashboardApi';
import {
    UserPlus, Users, Hourglass, CheckCircle,
    ChevronRight, CalendarDays, AlertCircle, UserMinus,
    DollarSign
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import HomeAttendanceChart from './sections/HomeAttendanceChart';
import HomeSalesFunnel from './sections/HomeSalesFunnel';
import HomeRoomsSection from './sections/HomeRoomsSection';
import HomeBooksSection from './sections/HomeBooksSection';

const COLORS = {
    purple: '#6B7FD4',
    orange: '#ED6A2E',
    green: '#2ECC8A',
    dark: '#1A2233',
    grey: '#8A9BB8',
    bgLight: '#F5F6FA'
};

const HomeAnalyticsCard = ({ title, value, trend, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] flex items-start justify-between min-h-[145px]">
        <div className="flex flex-col h-full justify-between">
            <div>
                <p className="text-[14px] font-bold text-[#8A9BB8] leading-none mb-4 uppercase tracking-wider">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-[28px] font-extrabold text-[#1A2233] leading-none">{value}</h2>
                </div>
            </div>
            <div className="flex items-center gap-1 mt-auto">
                <span className={`text-[12px] font-bold ${trend.startsWith('+') ? 'text-[#2ECC81]' : 'text-[#E74C3C]'}`}>
                    {trend}
                </span>
            </div>
        </div>
        <div className="w-10 h-10 flex items-center justify-center rounded-xl" style={{ backgroundColor: `${color}1A` }}>
            <Icon size={22} style={{ color: color }} />
        </div>
    </div>
);

const MiniListCard = ({ title, icon: Icon, data, count, color }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}1A` }}>
                    <Icon size={20} style={{ color: color }} />
                </div>
                <h3 className="text-[15px] font-extrabold text-[#1A2233]">{title}</h3>
            </div>
            <div className="bg-[#F5F6FA] text-[#8A9BB8] px-3 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-[12px] font-bold">{count}</span>
                <ChevronRight size={14} />
            </div>
        </div>

        <div className="space-y-4">
            {(Array.isArray(data) ? data : []).slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#ED6A2E]/10 flex items-center justify-center shrink-0">
                        <span className="text-[#ED6A2E] text-xs font-black uppercase">{(String(item.full_name || item.name || 'T')[0])}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#1A2233] truncate leading-tight">{item.full_name || item.name || 'Student'}</p>
                        <p className="text-[10px] text-[#8A9BB8] font-medium mt-0.5">{item.phone || '+998 -- --- -- --'}</p>
                    </div>
                </div>
            ))}
            {(!Array.isArray(data) || data.length === 0) && <p className="text-center py-4 text-[#8A9BB8] text-[10px] font-black uppercase tracking-widest italic">All caught up</p>}
        </div>
    </div>
);

export default function HomePage() {
    const { data: stats } = useGetStatsQuery();
    const { data: trialStats } = useGetTrialStatsQuery();
    const { data: finance } = useGetFinanceQuery();
    const { data: debtors } = useGetDebtorsQuery();
    const { data: trials } = useGetTrialLessonsQuery();
    const { data: absents } = useGetAbsentQuery();
    const { data: weekly } = useGetWeeklyQuery();

    const analytics = [
        { title: 'Total Leads', value: stats?.leads ?? 0, trend: '+12% from month', icon: UserPlus, color: '#4C6FFF' },
        { title: 'Active Students', value: stats?.students ?? 0, trend: '+5% from month', icon: Users, color: '#2ECC81' },
        { title: 'Trial Coming', value: trialStats?.coming ?? 0, trend: 'Next 7 days', icon: Hourglass, color: '#F39C12' },
        { title: 'New Today', value: stats?.newStudents ?? 0, trend: 'Leads registered', icon: CheckCircle, color: '#9B59B6' },
    ];

    const chartData = useMemo(() => {
        if (!weekly || weekly.length === 0) {
            return [
                { name: 'M', value: 0 }, { name: 'T', value: 0 }, { name: 'W', value: 0 },
                { name: 'T', value: 0 }, { name: 'F', value: 0 }, { name: 'S', value: 0 }, { name: 'S', value: 0 }
            ];
        }
        return weekly.map(w => ({
            name: new Date(w.date).toLocaleDateString('en-US', { weekday: 'narrow' }),
            value: Number(w.count || 0)
        }));
    }, [weekly]);

    const receivedAmount = Number(finance?.paid || 0);
    const expectedAmount = Number(finance?.expected || receivedAmount * 1.25 || 2500000);
    const progress = Math.min(100, Math.round((receivedAmount / expectedAmount) * 100)) || 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page Header */}
            <div>
                <h1 className="text-[24px] font-extrabold text-[#1A2233] tracking-tight">Overview Dashboard</h1>
                <p className="text-[13px] text-[#8A9BB8] font-bold mt-1">Real-time center performance metrics</p>
            </div>

            {/* Top Row: Analytics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {analytics.map((card, i) => (
                    <HomeAnalyticsCard key={i} {...card} />
                ))}
            </div>

            {/* Middle Row: Trial Lessons & Finance */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-4 bg-white p-7 rounded-[24px] border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-[17px] font-extrabold text-[#1A2233]">Trial Lessons Flow</h3>
                            <p className="text-[12px] text-[#8A9BB8] font-bold mt-1">Activity distribution for the current week</p>
                        </div>
                        <div className="bg-[#ED6A2E]/10 text-[#ED6A2E] px-4 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow-sm">
                            <CalendarDays size={14} />
                            LIVE FEED
                        </div>
                    </div>

                    {/* Stats Blocks */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'ENROLLED', value: trialStats?.enrolled ?? 0, color: '#4C6FFF' },
                            { label: 'EXPECTED', value: trialStats?.coming ?? 0, color: '#ED6A2E' },
                            { label: 'CAME', value: trialStats?.arrived ?? trialStats?.came ?? 0, color: '#2ECC81' },
                            { label: 'TOTAL', value: trialStats?.total ?? 0, color: '#1A2233' },
                        ].map((s, i) => (
                            <div key={i} className="rounded-2xl p-5 flex flex-col items-center justify-center py-8 border border-[#F0F1F5] bg-[#F9FAFC] group hover:border-[#ED6A2E]/30 transition-all">
                                <span className="text-[10px] font-black tracking-widest leading-none mb-3 text-[#8A9BB8] uppercase group-hover:text-[#ED6A2E]">{s.label}</span>
                                <span className="text-[28px] font-black leading-none text-[#1A2233]" style={{ color: i === 3 ? '#1A2233' : s.color }}>{s.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Weekly Chart */}
                    <div className="h-[200px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#8A9BB8', fontWeight: 800 }}
                                    dy={10}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                    {chartData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#ED6A2E' : '#ED6A2E20'} className="hover:fill-[#ED6A2E] transition-colors" />
                                    ))}
                                </Bar>
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-[#1A2233] text-white px-3 py-1.5 rounded-lg text-[11px] font-black shadow-xl">
                                                    {payload[0].value} Lessons
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Financial Plan Card */}
                <div className="lg:col-span-1 bg-[#ED6A2E] rounded-[24px] p-7 shadow-[0_15px_40px_rgba(237,106,46,0.3)] flex flex-col justify-between overflow-hidden relative min-h-[460px] group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

                    <div>
                        <div className="bg-white/10 backdrop-blur-md self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5 mb-8">
                            <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <DollarSign size={12} />
                                Revenue Target
                            </span>
                        </div>
                        <p className="text-white/70 text-[12px] font-bold mb-2">Target for current month</p>
                        <h2 className="text-white text-[28px] font-black leading-tight mb-10">{expectedAmount.toLocaleString()} UZS</h2>

                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-white text-[13px] font-bold">Progress</span>
                                    <span className="text-white text-[18px] font-black">{progress}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-black/10 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-white shadow-[0_0_15px_white] transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Received</p>
                                    <p className="text-white text-[18px] font-black italic">{receivedAmount.toLocaleString()} UZS</p>
                                </div>
                                <div className="bg-black/5 p-4 rounded-2xl">
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Balance Remaining</p>
                                    <p className="text-white/80 text-[14px] font-bold">{Math.max(0, expectedAmount - receivedAmount).toLocaleString()} UZS</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button className="w-full bg-white text-[#ED6A2E] py-4 rounded-2xl text-[14px] font-black shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group mt-8">
                        View Detailed Report
                    </button>
                </div>
            </div>

            {/* Bottom Row: Mini Lists */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MiniListCard
                    title="Trial Students"
                    icon={CalendarDays}
                    data={trials}
                    count={trials?.length ?? 0}
                    color="#4C6FFF"
                />
                <MiniListCard
                    title="Active Debtors"
                    icon={AlertCircle}
                    data={debtors}
                    count={debtors?.length ?? 0}
                    color="#F15F5F"
                />
                <MiniListCard
                    title="Absent Today"
                    icon={UserMinus}
                    data={absents}
                    count={absents?.length ?? 0}
                    color="#1A2233"
                />
            </div>

            {/* New Sections (Books, Sales Funnel, Rooms, Attendance) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HomeBooksSection />
                <HomeSalesFunnel />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HomeAttendanceChart />
                <HomeRoomsSection />
            </div>
        </div>
    );
}
