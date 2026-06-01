import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, ShoppingCart, Car, Coffee,
    Home, MoreVertical
} from 'lucide-react';
import { useCreateExpenseMutation, useDeleteExpenseMutation, useGetExpensesQuery } from '../../store/api/settingsApi';
import CustomSelect from '../../components/common/CustomSelect';

const tabs = [
    'Expenses', 'Marketing', 'Marketing Leads',
    'News', 'Feedback', 'SMS', 'Create Role', 'Create Branch'
];

const categories = [
    { name: 'Groceries', color: '#2ECC81', icon: ShoppingCart },
    { name: 'Transport', color: '#4C6FFF', icon: Car },
    { name: 'Entertainment', color: '#ED6A2E', icon: Coffee },
    { name: 'Housing', color: '#F15F5F', icon: Home },
];

const tabRoutes: Record<string, string> = {
    Marketing: '/marketing-analytics',
    'Marketing Leads': '/marketing-leads',
    News: '/news',
    Feedback: '/feedback',
    SMS: '/sms-active-users',
    'Create Role': '/create-role',
    'Create Branch': '/branch-manager',
};

export default function SettingsPage() {
    const navigate = useNavigate();
    const { data: expenses = [], isLoading } = useGetExpensesQuery();
    const [createExpense, { isLoading: isCreatingExpense }] = useCreateExpenseMutation();
    const [deleteExpense] = useDeleteExpenseMutation();
    const [activeTab, setActiveTab] = useState('Expenses');
    const [period, setPeriod] = useState('All');
    const [expenseForm, setExpenseForm] = useState({
        name: '',
        category: categories[0].name,
        amount: '',
        date: new Date().toISOString().split('T')[0],
    });

    const totalExpense = useMemo(() => {
        return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    }, [expenses]);

    const handleTabClick = (tab: string) => {
        const route = tabRoutes[tab];
        if (route) {
            navigate(route);
            return;
        }
        setActiveTab(tab);
    };

    const handleCreateExpense = async (event: React.FormEvent) => {
        event.preventDefault();
        const amount = Number(expenseForm.amount);
        if (!expenseForm.name.trim() || !Number.isFinite(amount) || amount <= 0) return;

        await createExpense({
            name: expenseForm.name.trim(),
            category: expenseForm.category,
            amount,
            date: expenseForm.date || undefined,
        }).unwrap();
        setExpenseForm({
            name: '',
            category: categories[0].name,
            amount: '',
            date: new Date().toISOString().split('T')[0],
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-[24px] font-extrabold text-[#1A2233] tracking-tight">Settings</h1>
                <p className="text-[13px] text-[#8A9BB8] font-bold mt-1">System Parameters Management</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-[#F0F1F5] flex items-center gap-8 overflow-x-auto no-scrollbar scroll-smooth">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => handleTabClick(tab)}
                        className={`pb-4 text-[13px] font-black transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-[#ED6A2E]' : 'text-[#8A9BB8] hover:text-[#5A6376]'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#ED6A2E] rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content for Expenses Tab */}
            {activeTab === 'Expenses' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-4">
                    {/* Left Column: Form and Stats */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-[24px] border border-[#F0F1F5] p-5 shadow-sm">
                                <p className="text-[10px] font-black text-[#8A9BB8] uppercase tracking-wider mb-2">This Month</p>
                                <p className="text-[18px] font-black text-[#ED6A2E]">{totalExpense.toLocaleString()} UZS</p>
                            </div>
                            <div className="bg-white rounded-[24px] border border-[#F0F1F5] p-5 shadow-sm">
                                <p className="text-[10px] font-black text-[#8A9BB8] uppercase tracking-wider mb-2">Transactions</p>
                                <p className="text-[18px] font-black text-[#1A2233]">{expenses.length}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[24px] border border-[#F0F1F5] p-6 shadow-sm space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#FFF5F2] flex items-center justify-center">
                                    <Plus size={20} className="text-[#ED6A2E]" strokeWidth={3} />
                                </div>
                                <h3 className="text-[16px] font-black text-[#1A2233]">New Expense</h3>
                            </div>

                            <form onSubmit={handleCreateExpense} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-[#1A2233] uppercase ml-1">Name</label>
                                    <input
                                        type="text"
                                        value={expenseForm.name}
                                        onChange={(e) => setExpenseForm((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder="E.g., Office Supplies"
                                        className="w-full bg-[#F7F8FA] border border-[#F0F1F5] rounded-xl px-4 py-3 text-[12px] font-bold text-[#1A2233] outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-[#1A2233] uppercase ml-1">Category</label>
                                        <CustomSelect
                                            value={expenseForm.category}
                                            onChange={(v) => setExpenseForm((prev) => ({ ...prev, category: v || categories[0]?.name || '' }))}
                                            placeholder="Category"
                                            options={categories.map((c) => ({ value: c.name, label: c.name }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-[#1A2233] uppercase ml-1">Amount</label>
                                        <input
                                            type="number"
                                            value={expenseForm.amount}
                                            onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                                            placeholder="0 UZS"
                                            className="w-full bg-[#F7F8FA] border border-[#F0F1F5] rounded-xl px-4 py-3 text-[12px] font-bold text-[#1A2233] outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-[#1A2233] uppercase ml-1">Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={expenseForm.date}
                                            onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))}
                                            className="w-full bg-[#F7F8FA] border border-[#F0F1F5] rounded-xl px-4 py-3 text-[12px] font-bold text-[#1A2233] outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isCreatingExpense || !expenseForm.name.trim() || Number(expenseForm.amount) <= 0}
                                    className="w-full bg-[#ED6A2E] text-white py-3.5 rounded-xl text-[13px] font-black flex items-center justify-center gap-2 hover:bg-[#D95B24] transition-all shadow-md mt-2 disabled:opacity-50"
                                >
                                    <Plus size={18} strokeWidth={3} />
                                    {isCreatingExpense ? 'Saving...' : 'Add Expense'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: History */}
                    <div className="xl:col-span-8">
                        <div className="bg-white rounded-[24px] border border-[#F0F1F5] p-6 shadow-sm min-h-[600px]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <h3 className="text-[18px] font-extrabold text-[#1A2233]">Transaction History</h3>
                                <div className="flex items-center gap-1 bg-[#F5F6FA] p-1 rounded-xl">
                                    {['All', 'Weekly', 'Monthly'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPeriod(p)}
                                            className={`px-5 py-1.5 rounded-lg text-[11px] font-black transition-all ${period === p ? 'bg-white text-[#ED6A2E] shadow-sm' : 'text-[#8A9BB8] hover:text-[#5A6376]'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="hidden sm:grid grid-cols-12 px-2 py-2 text-[10px] font-black text-[#8A9BB8] uppercase tracking-widest border-b border-[#F0F1F5]">
                                    <div className="col-span-5">Description</div>
                                    <div className="col-span-3">Category</div>
                                    <div className="col-span-2">Amount</div>
                                    <div className="col-span-2 px-4">Date</div>
                                </div>

                                {isLoading ? (
                                    <div className="py-20 text-center text-[#8A9BB8] font-bold">Loading history...</div>
                                ) : expenses.length === 0 ? (
                                    <div className="py-20 text-center text-[#8A9BB8] font-bold uppercase italic">No expenses recorded</div>
                                ) : (
                                    expenses.map((item, i) => {
                                        const cat = categories[i % categories.length];
                                        return (
                                            <div key={item.id || i} className="grid grid-cols-1 sm:grid-cols-12 items-center py-4 px-2 hover:bg-gray-50/50 transition-all group rounded-xl gap-4 sm:gap-0 border-b sm:border-b-0 border-[#F0F1F5] last:border-0 md:border-0">
                                                <div className="col-span-12 sm:col-span-5 flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
                                                        <cat.icon size={20} style={{ color: cat.color }} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-black text-[#1A2233] truncate">{item.name || 'General Expense'}</p>
                                                        <p className="text-[11px] font-bold text-[#8A9BB8] truncate">Expense ID: {item.id}</p>
                                                    </div>
                                                </div>
                                                <div className="col-span-12 sm:col-span-3">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${cat.color}10` }}>
                                                        <cat.icon size={12} style={{ color: cat.color }} />
                                                        <span className="text-[10px] font-black" style={{ color: cat.color }}>{cat.name}</span>
                                                    </div>
                                                </div>
                                                <div className="col-span-12 sm:col-span-2 text-[13px] font-black text-[#F15F5F]">
                                                    - {Number(item.amount).toLocaleString()} UZS
                                                </div>
                                                <div className="col-span-12 sm:col-span-2 flex items-center justify-between sm:px-4">
                                                    <span className="text-[11px] font-bold text-[#8A9BB8]">{item.createdAt || '-'}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (item.id && window.confirm('Delete this expense?')) {
                                                                deleteExpense(item.id);
                                                            }
                                                        }}
                                                        className="p-1 text-[#8A9BB8] hover:text-[#1A2233] transition-colors"
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
