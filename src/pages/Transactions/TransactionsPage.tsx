import { useState, useMemo } from 'react';
import {
    Calendar, Wallet, Search, Filter,
    ChevronLeft, ChevronRight,
    CreditCard, Banknote, Landmark
} from 'lucide-react';
import { useGetTransactionsQuery } from '../../store/api/transactionApi';

export default function TransactionsPage() {
    const { data: transactions = [], isLoading } = useGetTransactionsQuery();
    const [search, setSearch] = useState('');
    const [date, setDate] = useState(''); // Default empty for live data
    const [appliedDate, setAppliedDate] = useState('');

    // Real-time calculations from API data
    const stats = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const monthStr = now.toISOString().slice(0, 7);

        return transactions.reduce((acc, t) => {
            const amt = Number(t.amount || 0);
            acc.total += amt;

            if (t.createdAt?.startsWith(todayStr)) acc.today += amt;
            if (t.createdAt?.startsWith(monthStr)) acc.thisMonth += amt;

            const type = (t.payWith || '').toLowerCase();
            if (type === 'cash') acc.cash += amt;
            else if (type === 'card' || type === 'terminal') acc.card += amt;
            else if (type === 'transfer') acc.transfer += amt;

            return acc;
        }, { total: 0, today: 0, thisMonth: 0, cash: 0, card: 0, transfer: 0 });
    }, [transactions]);

    const normalizeDate = (value: string) => {
        if (!value.trim()) return '';
        const parts = value.trim().split('.');
        if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        return value.trim();
    };

    const filtered = transactions.filter(t => {
        const matchesSearch =
            (t.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
            (t.groupName || '').toLowerCase().includes(search.toLowerCase()) ||
            (t.payWithDisplay || '').toLowerCase().includes(search.toLowerCase());
        const normalizedDate = normalizeDate(appliedDate);
        const matchesDate = !normalizedDate || (t.createdAt || '').startsWith(normalizedDate);
        return matchesSearch && matchesDate;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-[24px] font-extrabold text-[#1A2233] tracking-tight">Transactions</h1>
                <p className="text-[13px] text-[#8A9BB8] font-bold mt-1">Payment and receipt history</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* Left Mini Stats */}
                <div className="lg:col-span-1 space-y-3">
                    <div className="bg-white rounded-[20px] border border-[#F0F1F5] p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#FFF5F2] flex items-center justify-center">
                                <Banknote size={20} className="text-[#ED6A2E]" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#8A9BB8] uppercase tracking-wider">Cash</p>
                                <p className="text-[15px] font-black text-[#1A2233]">{stats.cash.toLocaleString()} UZS</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-[20px] border border-[#F0F1F5] p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F0F3FF] flex items-center justify-center">
                                <CreditCard size={20} className="text-[#4C6FFF]" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#8A9BB8] uppercase tracking-wider">Card</p>
                                <p className="text-[15px] font-black text-[#1A2233]">{stats.card.toLocaleString()} UZS</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-[20px] border border-[#F0F1F5] p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#E9FAF0] flex items-center justify-center">
                                <Landmark size={20} className="text-[#2ECC81]" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#8A9BB8] uppercase tracking-wider">Transfer</p>
                                <p className="text-[15px] font-black text-[#1A2233]">{stats.transfer.toLocaleString()} UZS</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Stats Row */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white rounded-[24px] border border-[#F0F1F5] p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <p className="text-[13px] font-bold text-[#8A9BB8]">Today</p>
                            <div className="w-10 h-10 rounded-xl bg-[#FFF5F2] flex items-center justify-center">
                                <Calendar size={20} className="text-[#ED6A2E]" />
                            </div>
                        </div>
                        <p className="text-[20px] font-black text-[#1A2233] mt-4">{stats.today.toLocaleString()} UZS</p>
                    </div>
                    <div className="bg-white rounded-[24px] border border-[#F0F1F5] p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <p className="text-[13px] font-bold text-[#8A9BB8]">This month</p>
                            <div className="w-10 h-10 rounded-xl bg-[#FFF5F2] flex items-center justify-center">
                                <Calendar size={20} className="text-[#ED6A2E]" />
                            </div>
                        </div>
                        <p className="text-[20px] font-black text-[#1A2233] mt-4">{stats.thisMonth.toLocaleString()} UZS</p>
                    </div>
                    <div className="bg-[#ED6A2E] rounded-[24px] p-6 flex flex-col justify-between shadow-[0_8px_30px_rgba(237,106,46,0.25)] relative overflow-hidden group">
                        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full transition-transform group-hover:scale-125 duration-700" />
                        <div className="flex justify-between items-start">
                            <p className="text-[13px] font-bold text-white/80">Total received</p>
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Wallet size={20} className="text-white" />
                            </div>
                        </div>
                        <p className="text-[22px] font-black text-white mt-4">{stats.total.toLocaleString()} UZS</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-[24px] border border-[#F0F1F5] p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row items-center gap-5">
                    <div className="flex-1 w-full space-y-1.5">
                        <label className="text-[11px] font-black text-[#8A9BB8] uppercase tracking-wide ml-1">Search student</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={18} />
                            <input
                                type="text"
                                placeholder="Name or group"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-[#F7F8FA] border-none rounded-xl pl-12 pr-4 py-3 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none"
                            />
                        </div>
                    </div>
                    <div className="w-full lg:w-72 space-y-1.5">
                        <label className="text-[11px] font-black text-[#8A9BB8] uppercase tracking-wide ml-1">Date (dd.mm.yyyy)</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={18} />
                            <input
                                type="text"
                                placeholder="Select date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full bg-[#F7F8FA] border-none rounded-xl pl-12 pr-4 py-3 text-[13px] font-bold text-[#1A2233] outline-none"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAppliedDate(date)}
                        className="w-full lg:w-auto mt-auto lg:mt-6 bg-[#ED6A2E] text-white px-8 py-3 rounded-xl text-[13px] font-black flex items-center justify-center gap-2 hover:bg-[#D95B24] transition-all"
                    >
                        <Filter size={18} strokeWidth={3} />
                        Apply
                    </button>
                </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white rounded-[24px] border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] overflow-hidden">
                <div className="px-6 py-5 flex items-center justify-between">
                    <h3 className="text-[16px] font-black text-[#1A2233]">Recent transactions</h3>
                    <span className="text-[11px] font-black text-[#8A9BB8] uppercase tracking-widest">{filtered.length} records</span>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full">
                        <thead className="bg-[#F7F8FA] border-y border-[#F0F1F5]">
                            <tr>
                                <th className="text-left px-6 py-4 text-[9px] font-black text-[#8A9BB8] uppercase tracking-widest w-[40%]">Student / Group</th>
                                <th className="text-left px-6 py-4 text-[9px] font-black text-[#8A9BB8] uppercase tracking-widest">Date & Time</th>
                                <th className="text-left px-6 py-4 text-[9px] font-black text-[#8A9BB8] uppercase tracking-widest">Payment Type</th>
                                <th className="text-left px-6 py-4 text-[9px] font-black text-[#8A9BB8] uppercase tracking-widest text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={4} className="py-24 text-center text-[#8A9BB8] font-bold uppercase tracking-widest text-xs">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-24 text-center">
                                        <p className="text-[14px] font-bold text-[#8A9BB8] italic uppercase tracking-widest">No transactions found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(t => (
                                    <tr key={t.id} className="border-b border-[#F0F1F5] hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                                                    <span className="text-[11px] font-black text-[#ED6A2E] uppercase">{(t.studentName?.[0] || 'S')}</span>
                                                </div>
                                                <span className="text-[13px] font-bold text-[#1A2233]">{t.studentName || 'Anonymous'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[12px] font-bold text-[#5A6376]">{t.createdAt || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-[11px] font-black text-[#8A9BB8] uppercase bg-[#F5F6FA] px-2.5 py-1 rounded-lg border border-[#F0F1F5]">
                                                {t.payWithDisplay || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[14px] font-black text-[#1A2233] text-right">{Number(t.amount || 0).toLocaleString()} UZS</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 flex items-center justify-between border-t border-[#F0F1F5]">
                    <span className="text-[12px] font-bold text-[#8A9BB8]">Showing {filtered.length} of {transactions.length}</span>
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg border border-[#F0F1F5] text-[#8A9BB8] hover:bg-gray-50 transition-all disabled:opacity-50" disabled>
                            <ChevronLeft size={18} />
                        </button>
                        <button className="w-9 h-9 rounded-lg bg-[#ED6A2E] text-white text-[12px] font-black" disabled aria-current="page">1</button>
                        <button className="p-2 rounded-lg border border-[#F0F1F5] text-[#8A9BB8] hover:bg-gray-50 transition-all disabled:opacity-50" disabled>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
