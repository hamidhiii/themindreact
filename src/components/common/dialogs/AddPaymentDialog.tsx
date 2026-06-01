import { useMemo, useState } from 'react';
import {
    X, Wallet, Banknote, CreditCard, Landmark, Check,
    Search, Calendar, DollarSign, Printer, User,
} from 'lucide-react';
import { useCreatePaymentMutation } from '../../../store/api/transactionApi';
import { useGetStudentsQuery } from '../../../store/api/studentApi';
import { formatApiError } from '../../../utils/apiError';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '../modalStyles';
import { useToast } from '../../../hooks/useToast';

type PayMethod = 'cash' | 'card' | 'transfer';

const METHODS: { value: PayMethod; label: string; icon: typeof Banknote; color: string }[] = [
    { value: 'cash', label: 'Cash', icon: Banknote, color: '#ED6A2E' },
    { value: 'card', label: 'Card', icon: CreditCard, color: '#4C6FFF' },
    { value: 'transfer', label: 'Transfer', icon: Landmark, color: '#9B59B6' },
];

export default function AddPaymentDialog({ onClose }: { onClose: () => void }) {
    const { data: students = [] } = useGetStudentsQuery();
    const [createPayment, { isLoading }] = useCreatePaymentMutation();
    const toast = useToast();
    const [studentQuery, setStudentQuery] = useState('');
    const [studentId, setStudentId] = useState('');
    const [studentOpen, setStudentOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [payWith, setPayWith] = useState<PayMethod>('cash');
    const [date, setDate] = useState('');
    const [printReceipt, setPrintReceipt] = useState(false);
    const [error, setError] = useState('');

    const selected = students.find((s) => String(s.id) === studentId);
    const selectedLabel = selected
        ? `${selected.firstName ?? ''} ${selected.lastName ?? ''}`.trim() || `#${selected.id}`
        : '';

    const filtered = useMemo(() => {
        const q = studentQuery.trim().toLowerCase();
        if (!q) return students.slice(0, 30);
        return students
            .filter((s) =>
                `${s.firstName ?? ''} ${s.lastName ?? ''} ${s.phone ?? ''} ${s.groupName ?? ''}`
                    .toLowerCase()
                    .includes(q)
            )
            .slice(0, 30);
    }, [students, studentQuery]);

    const canSubmit = !!studentId && Number(amount) > 0;

    const submit = async () => {
        if (!canSubmit) return;
        setError('');
        try {
            await createPayment({
                studentId,
                amount,
                payWith,
                groupId: selected?.groupId,
            }).unwrap();
            toast.success('Payment recorded successfully');
            onClose();
        } catch (err) {
            setError(formatApiError(err, 'Could not record payment.'));
            toast.error(formatApiError(err, 'Could not record payment.'));
        }
    };

    return (
        <div className={MODAL_OVERLAY_CLASS}>
            <div className={`w-full max-w-md rounded-3xl ${MODAL_PANEL_CLASS} animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#ED6A2E]/10 flex items-center justify-center">
                            <Wallet size={20} className="text-[#ED6A2E]" />
                        </div>
                        <div>
                            <h2 className="text-[18px] font-extrabold text-[#1A2233] leading-tight">New Payment</h2>
                            <p className="text-[12px] font-bold text-[#8A9BB8] mt-0.5">Enter payment details</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-[#8A9BB8] hover:bg-gray-50 hover:text-[#1A2233]"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 flex-1 overflow-y-auto min-h-0 space-y-5">
                    {error && (
                        <div className="rounded-xl border border-[#E74C3C]/30 bg-[#E74C3C]/10 px-3 py-2 text-[11px] font-semibold text-[#C0392B]">
                            {error}
                        </div>
                    )}
                    {/* Student search */}
                    <div className="space-y-2">
                        <div className="text-[11px] font-black uppercase tracking-widest text-[#8A9BB8] px-1">
                            Student
                        </div>
                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8] pointer-events-none" />
                            <input
                                value={studentId ? selectedLabel : studentQuery}
                                onChange={(e) => {
                                    setStudentQuery(e.target.value);
                                    if (studentId) setStudentId('');
                                    setStudentOpen(true);
                                }}
                                onFocus={() => setStudentOpen(true)}
                                placeholder="Name, phone or group..."
                                className="w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] pl-11 pr-4 py-3 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none focus:border-[#ED6A2E]/50 focus:bg-white transition-colors"
                            />

                            {studentOpen && (studentQuery.trim() || !studentId) && (
                                <div className="absolute left-0 right-0 top-14 z-10 max-h-72 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg">
                                    {filtered.length === 0 ? (
                                        <div className="px-4 py-4 text-[12px] font-bold text-[#8A9BB8] text-center">
                                            No students found
                                        </div>
                                    ) : (
                                        filtered.map((s) => {
                                            const label = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || `#${s.id}`;
                                            return (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setStudentId(String(s.id));
                                                        setStudentQuery('');
                                                        setStudentOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8F9FB] border-b border-[#F0F1F5] last:border-b-0"
                                                >
                                                    <div className="w-9 h-9 rounded-full bg-[#ED6A2E]/15 flex items-center justify-center shrink-0">
                                                        <span className="text-[#ED6A2E] text-[11px] font-black uppercase">
                                                            {label[0]}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-extrabold text-[#1A2233] truncate">{label}</p>
                                                        {(s.phone || s.groupName) && (
                                                            <p className="text-[11px] font-bold text-[#8A9BB8] truncate">
                                                                {[s.phone, s.groupName].filter(Boolean).join(' · ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                        {selected && !studentOpen && (
                            <div className="flex items-center gap-2 px-1 text-[11px] font-bold text-[#5A6376]">
                                <User size={12} /> {selectedLabel}
                            </div>
                        )}
                    </div>

                    {/* Payment method */}
                    <div className="space-y-2">
                        <div className="text-[11px] font-black uppercase tracking-widest text-[#8A9BB8] px-1">
                            Payment method
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {METHODS.map((m) => {
                                const Icon = m.icon;
                                const active = payWith === m.value;
                                return (
                                    <button
                                        key={m.value}
                                        type="button"
                                        onClick={() => setPayWith(m.value)}
                                        className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 text-[12px] font-black uppercase tracking-wider transition-all"
                                        style={{
                                            backgroundColor: active ? m.color : '#fff',
                                            borderColor: active ? m.color : '#F0F1F5',
                                            color: active ? '#fff' : '#8A9BB8',
                                        }}
                                    >
                                        <Icon size={18} />
                                        {m.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Amount + Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <div className="text-[11px] font-black uppercase tracking-widest text-[#8A9BB8] px-1">
                                Amount
                            </div>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8]" />
                                <input
                                    type="number"
                                    min={0}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] pl-11 pr-4 py-3 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none focus:border-[#ED6A2E]/50 focus:bg-white transition-colors"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-[11px] font-black uppercase tracking-widest text-[#8A9BB8] px-1">
                                Date
                            </div>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8]" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    placeholder="Select"
                                    className="w-full rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] pl-11 pr-4 py-3 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none focus:border-[#ED6A2E]/50 focus:bg-white transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Print receipt */}
                    <div
                        className={`rounded-xl border p-3 flex items-center justify-between transition-all ${
                            printReceipt ? 'border-[#ED6A2E]/40 bg-[#ED6A2E]/[0.04]' : 'border-[#F0F1F5] bg-[#F8F9FB]'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Printer size={16} className={printReceipt ? 'text-[#ED6A2E]' : 'text-[#8A9BB8]'} />
                            <span className={`text-[13px] font-bold ${printReceipt ? 'text-[#ED6A2E]' : 'text-[#1A2233]'}`}>
                                Print receipt
                            </span>
                        </div>
                        <Toggle checked={printReceipt} onChange={setPrintReceipt} />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#F0F1F5] shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#8A9BB8] hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={isLoading || !canSubmit}
                        className="flex items-center gap-1.5 rounded-xl bg-[#ED6A2E] px-6 py-2.5 text-[13px] font-black text-white hover:bg-[#D95B24] disabled:opacity-50"
                    >
                        <Check size={14} strokeWidth={3} />
                        {isLoading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
                checked ? 'bg-[#F37021]' : 'bg-[#9CA3AF]'
            }`}
        >
            <span
                className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
}
