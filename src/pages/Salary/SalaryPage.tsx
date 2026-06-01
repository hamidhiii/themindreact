import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, TrendingDown, AlertCircle,
    Plus, LayoutGrid, Download, Wallet
} from 'lucide-react';
import { useGetSalaryDashboardQuery, useGetSalaryReportQuery } from '../../store/api/salaryApi';
import { useGetFinanceQuery } from '../../store/api/dashboardApi';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { downloadCsv } from '../../utils/downloadCsv';

export default function SalaryPage() {
    const navigate = useNavigate();
    const { data: salaryDashboard } = useGetSalaryDashboardQuery();
    const { data: financeData } = useGetFinanceQuery();
    const { data: report = [], isLoading: isReportLoading } = useGetSalaryReportQuery();
    const [period, setPeriod] = useState('Month');

    // Stats mapping
    const stats = [
        {
            label: 'Total Income',
            value: financeData?.paid ? `${Number(financeData.paid).toLocaleString()} UZS` : '0 UZS',
            trend: '+12%',
            icon: Wallet,
            color: '#4C6FFF'
        },
        {
            label: 'Salary Fund',
            value: salaryDashboard?.totalIncome ? `${Number(salaryDashboard.totalIncome).toLocaleString()} UZS` : '0 UZS',
            trend: '+5%',
            icon: Calendar,
            color: '#ED6A2E'
        },
        {
            label: 'Expenses',
            value: salaryDashboard?.totalExpenses ? `${Number(salaryDashboard.totalExpenses).toLocaleString()} UZS` : '0 UZS',
            trend: '-2%',
            icon: TrendingDown,
            color: '#F15F5F'
        },
        {
            label: 'Student Debts',
            value: '7.2M UZS', // Hardcoded as in screenshot but usually would be from debtors query
            trend: 'Attention',
            icon: AlertCircle,
            color: '#ED6A2E'
        },
    ];

    const chartData = [
        { name: 'Jan', income: 0 },
        { name: 'Feb', income: 0 },
        { name: 'Mar', income: 0 },
        { name: 'Apr', income: 0 },
    ];

    const exportReport = () => {
        downloadCsv(
            'salary-report.csv',
            report.map((row) => ({
                name: row.name,
                role: row.role,
                salary: row.salary,
                bonus: row.bonus,
                fine: row.fine,
                total: row.total,
                status: row.status,
            }))
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-[24px] font-extrabold text-[#1A2233] tracking-tight">Finance</h1>
                <p className="text-[13px] text-[#8A9BB8] font-bold mt-1">Manage income, expenses and salaries</p>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white rounded-[24px] border border-[#F0F1F5] p-5 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                                <s.icon size={20} style={{ color: s.color }} />
                            </div>
                            <span className={`text-[12px] font-black ${s.trend === 'Attention' ? 'text-[#ED6A2E]' : 'text-[#2ECC81]'}`}>
                                {s.trend}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[12px] font-bold text-[#8A9BB8]">{s.label}</p>
                            <p className="text-[18px] font-black text-[#1A2233]">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* My Tariffs Section */}
            <div className="flex items-center justify-between mt-8">
                <div>
                    <h2 className="text-[18px] font-extrabold text-[#1A2233]">My Tariffs</h2>
                    <p className="text-[12px] text-[#8A9BB8] font-bold">Manage student tariff plans</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/tariff')}
                        className="bg-[#ED6A2E] text-white px-5 py-2.5 rounded-xl text-[13px] font-black flex items-center gap-2 hover:bg-[#D95B24] transition-all shadow-md"
                    >
                        <Plus size={18} strokeWidth={3} />
                        Add Tariff
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/tariff')}
                        className="bg-white border border-[#F0F1F5] text-[#1A2233] px-5 py-2.5 rounded-xl text-[13px] font-black flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <LayoutGrid size={18} className="text-[#8A9BB8]" />
                        All Tariffs
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[24px] border border-[#F0F1F5] py-16 text-center text-[#8A9BB8] font-bold text-[14px] shadow-sm italic">
                No tariffs yet
            </div>

            {/* Income Dynamics Chart */}
            <div className="bg-white rounded-[24px] border border-[#F0F1F5] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-[16px] font-black text-[#1A2233]">Income Dynamics</h3>
                        <p className="text-[12px] text-[#8A9BB8] font-bold">{period} {new Date().getFullYear()}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-[#F5F6FA] p-1 rounded-xl">
                        {['Month', 'Year'].map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-5 py-1.5 rounded-lg text-[12px] font-black transition-all ${period === p ? 'bg-white text-[#1A2233] shadow-sm' : 'text-[#8A9BB8] hover:text-[#5A6376]'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ED6A2E" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#ED6A2E" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="#F0F1F5" strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#8A9BB8', fontWeight: 'bold' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#8A9BB8', fontWeight: 'bold' }}
                                dx={-10}
                                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '16px',
                                    border: 'none',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                                    padding: '12px'
                                }}
                                formatter={(v) => [`${Number(v).toLocaleString()} UZS`, 'Income']}
                            />
                            <Area
                                type="monotone"
                                dataKey="income"
                                stroke="#ED6A2E"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorIncome)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Employee Salaries Table */}
            <div className="bg-white rounded-[24px] border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] overflow-hidden pb-4">
                <div className="px-6 py-5 flex items-center justify-between border-b border-[#F0F1F5]">
                    <div>
                        <h3 className="text-[16px] font-black text-[#1A2233]">Employee Salaries</h3>
                        <p className="text-[11px] text-[#8A9BB8] font-bold">Payment tracking for selected period</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-[#F7F8FA] border border-[#F0F1F5] px-4 py-2.5 rounded-xl">
                            <Calendar size={16} className="text-[#8A9BB8]" />
                            <span className="text-[12px] font-bold text-[#5A6376]">Current Period</span>
                        </div>
                        <button
                            type="button"
                            onClick={exportReport}
                            className="bg-[#ED6A2E] text-white px-5 py-2.5 rounded-xl text-[12px] font-black flex items-center gap-2 hover:bg-[#D95B24] transition-all"
                        >
                            <Download size={16} strokeWidth={3} />
                            Report
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F7F8FA] border-y border-[#F0F1F5]">
                            <tr>
                                <th className="text-left px-6 py-3 text-[9px] font-black text-[#8A9BB8] uppercase tracking-widest w-[30%]">Employee</th>
                                <th className="text-left px-6 py-3 text-[9px] font-black text-[#8A9BB8] uppercase tracking-widest w-[20%]">Period</th>
                                <th className="text-left px-6 py-3 text-[9px] font-black text-[#8A9BB8] uppercase tracking-widest">Amount</th>
                                <th className="text-left px-6 py-3 text-[9px] font-black text-[#8A9BB8] uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F1F5]">
                            {isReportLoading ? (
                                <tr><td colSpan={4} className="py-10 text-center text-[13px] text-[#8A9BB8] font-bold">Loading report...</td></tr>
                            ) : report.length === 0 ? (
                                <tr><td colSpan={4} className="py-10 text-center text-[13px] text-[#8A9BB8] font-bold uppercase tracking-widest italic">No salary data recorded</td></tr>
                            ) : report.map((r, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary-50`}>
                                                <span className="text-[12px] font-black text-[#ED6A2E] uppercase">{(r.name?.[0] || 'E')}</span>
                                            </div>
                                            <span className="text-[13px] font-bold text-[#1A2233]">{r.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[11px] font-black text-[#8A9BB8] uppercase">{r.role || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-[13px] font-black text-[#121212]">{Number(r.total).toLocaleString()} UZS</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-block bg-[#E9FAF0] text-[#2ECC81] px-4 py-1.5 rounded-full text-[11px] font-black border border-[#2ECC81]/10">
                                            Paid
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
