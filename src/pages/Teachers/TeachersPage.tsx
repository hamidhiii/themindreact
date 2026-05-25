import { useMemo, useState } from 'react';
import {
    Calendar,
    ChevronDown,
    Download,
    DollarSign,
    Eye,
    Percent,
    Search,
    Wallet,
} from 'lucide-react';
import { useGetFinanceQuery } from '../../store/api/dashboardApi';
import { useGetTeachersQuery } from '../../store/api/teacherApi';
import {
    useGetSalaryDashboardQuery,
    useGetStaffSalariesQuery,
} from '../../store/api/salaryApi';

interface StatCardProps {
    label: string;
    value: string;
    trend: string;
    icon: typeof DollarSign;
    color: string;
    trendColor: string;
}

const StatCard = ({ label, value, trend, icon: Icon, color, trendColor }: StatCardProps) => (
    <div className="bg-white rounded-[24px] border border-[#F0F1F5] p-6 flex flex-col justify-between h-[160px] shadow-sm hover:shadow-md transition-all cursor-pointer group">
        <div className="flex justify-between items-start">
            <span className="text-[14px] font-bold text-[#8A9BB8]">{label}</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: `${color}1A` }}>
                <Icon size={20} style={{ color }} />
            </div>
        </div>
        <div className="mt-auto">
            <div className="text-[24px] lg:text-[28px] font-black text-[#1A2233] leading-none tracking-tight">{value}</div>
            <div className="flex items-center gap-1.5 mt-3">
                <span className="text-[12px] font-black" style={{ color: trendColor }}>{trend}</span>
                <span className="text-[11px] text-[#8A9BB8] font-bold truncate">compared to last month</span>
            </div>
        </div>
    </div>
);

export default function TeachersPage() {
    const { data: teachers = [], isLoading: isTeachersLoading } = useGetTeachersQuery();
    const { data: staffSalaries = [] } = useGetStaffSalariesQuery();
    const { data: salaryDashboard } = useGetSalaryDashboardQuery();
    const { data: financeData } = useGetFinanceQuery();
    const [search, setSearch] = useState('');

    const salaryTotal = staffSalaries.reduce((sum, row) => sum + Number(row.fixedAmount ?? 0), 0);
    const staffRows = useMemo(() => {
        if (staffSalaries.length > 0) {
            return staffSalaries
                .filter((row) => row.userFullName.toLowerCase().includes(search.toLowerCase()))
                .map((row) => ({
                    id: row.userId || String(row.id),
                    fullName: row.userFullName || row.username,
                    salary: Number(row.fixedAmount ?? 0),
                    income: 0,
                    profit: 0,
                }));
        }

        return teachers
            .filter((teacher) => teacher.fullName.toLowerCase().includes(search.toLowerCase()))
            .map((teacher) => ({ ...teacher, salary: 0, income: 0, profit: 0 }));
    }, [teachers, staffSalaries, search]);

    const stats = [
        {
            label: 'Total income',
            value: financeData?.paid ? `${Number(financeData.paid).toLocaleString()} UZS` : '0 UZS',
            trend: '+12%',
            icon: DollarSign,
            color: '#4C6FFF',
            trendColor: '#2ECC8A',
        },
        {
            label: 'Salaries paid',
            value: salaryTotal
                ? `${salaryTotal.toLocaleString()} UZS`
                : `${Number(salaryDashboard?.totalIncome ?? 0).toLocaleString()} UZS`,
            trend: '0% from revenue',
            icon: Wallet,
            color: '#ED6A2E',
            trendColor: '#8A9BB8',
        },
        {
            label: 'Total profit',
            value: financeData?.remaining ? `${Number(financeData.remaining).toLocaleString()} UZS` : '0 UZS',
            trend: '+8.4% margin',
            icon: Percent,
            color: '#2ECC8A',
            trendColor: '#2ECC8A',
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-extrabold text-[#1A2233] tracking-tight">Teacher Income Analysis</h1>
                    <p className="text-[13px] text-[#8A9BB8] font-bold mt-1">Tracking the financial performance of teaching staff</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button className="bg-white border border-[#F0F1F5] px-4 py-2.5 rounded-xl text-[13px] font-bold text-[#1A2233] flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Calendar size={16} className="text-[#8A9BB8]" />
                        Current Month
                        <ChevronDown size={16} className="text-[#8A9BB8]" />
                    </button>
                    <button className="bg-[#ED6A2E] text-white px-5 py-2.5 rounded-xl text-[13px] font-black flex items-center gap-2 hover:bg-[#D95B24] transition-all shadow-[0_4px_12px_rgba(237,106,46,0.3)]">
                        <Download size={18} strokeWidth={3} />
                        Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {stats.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                ))}
            </div>

            <div className="bg-white rounded-[24px] border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] overflow-hidden">
                <div className="px-6 py-5 flex items-center justify-between gap-4">
                    <h3 className="text-[16px] lg:text-[18px] font-extrabold text-[#1A2233]">Teachers' Financial Statement</h3>
                    <div className="relative w-full max-w-[280px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={16} />
                        <input
                            type="text"
                            placeholder="Search teacher..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full bg-[#F7F8FA] border-none rounded-xl pl-11 pr-4 py-2 text-[12px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F7F8FA] border-y border-[#F0F1F5]">
                            <tr>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px] w-[30%]">Teacher's Name</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Students</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Income</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Salary</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]">Profit</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F1F5]">
                            {isTeachersLoading ? (
                                <tr><td colSpan={6} className="py-20 text-center text-[#8A9BB8] font-bold uppercase tracking-widest text-xs animate-pulse">Loading data...</td></tr>
                            ) : staffRows.length > 0 ? (
                                staffRows.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#FFEEE0]">
                                                    <span className="text-[#ED6A2E] text-[12px] font-black uppercase">{(row.fullName?.[0] || 'T')}{(row.fullName?.split(' ')?.[1]?.[0] || 'T')}</span>
                                                </div>
                                                <span className="text-[14px] font-bold text-[#1A2233]">{row.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-[14px] font-bold text-[#1A2233] italic">0</td>
                                        <td className="px-6 py-5 text-[14px] font-bold text-[#1A2233]">{row.income.toLocaleString()} UZS</td>
                                        <td className="px-6 py-5 text-[14px] font-bold text-[#5A6376]">{row.salary.toLocaleString()} UZS</td>
                                        <td className="px-6 py-5">
                                            <span className="text-[14px] font-black text-[#2ECC81]">{row.profit.toLocaleString()} UZS</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-[#8A9BB8] hover:text-[#ED6A2E] hover:bg-white rounded-lg transition-all border border-transparent hover:border-[#F0F1F5]">
                                                <Eye size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} className="py-20 text-center text-[#8A9BB8] font-bold uppercase tracking-widest text-xs">No records found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-5 bg-white flex flex-col sm:flex-row items-center justify-between border-t border-[#F0F1F5] gap-4 text-[12px] font-bold text-[#8A9BB8]">
                    <span>Shown {staffRows.length} from {staffRows.length || teachers.length} teachers</span>
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg border border-[#F0F1F5] hover:bg-gray-50 transition-all disabled:opacity-50" disabled>&lt;</button>
                        <button className="w-8 h-8 rounded-lg bg-[#ED6A2E] text-white text-[12px] font-black shadow-lg shadow-[#ED6A2E]/30">1</button>
                        <button className="p-2 rounded-lg border border-[#F0F1F5] hover:bg-gray-50 transition-all disabled:opacity-50" disabled>&gt;</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
