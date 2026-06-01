import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Trash2, Edit2,
    CreditCard, Users, UserPlus, AlertTriangle,
    BookOpen, ChevronLeft, ChevronRight, Filter, X,
} from 'lucide-react';
import {
    useCreateStudentMutation,
    useGetStudentsQuery,
    useDeleteStudentMutation,
    useGetStudentDashboardQuery,
} from '../../store/api/studentApi';
import { useGetGroupsQuery } from '../../store/api/groupApi';
import { useCreatePaymentMutation } from '../../store/api/transactionApi';
import ModalShell from '../../components/common/ModalShell';
import CustomSelect from '../../components/common/CustomSelect';
import { useToast } from '../../hooks/useToast';
import type { StudentModel } from '../../types';

const PAGE_SIZE = 15;

export default function StudentsPage() {
    const navigate = useNavigate();
    const { data: students = [], isLoading } = useGetStudentsQuery();
    const { data: dashboard } = useGetStudentDashboardQuery();
    const { data: groups = [] } = useGetGroupsQuery();
    const [deleteStudent] = useDeleteStudentMutation();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [groupFilter, setGroupFilter] = useState('');
    const [page, setPage] = useState(1);
    const [showStudentForm, setShowStudentForm] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const toast = useToast();

    const filtered = useMemo(() => {
        return students.filter((s) => {
            const matchesSearch =
                !search ||
                `${s.firstName ?? ''} ${s.lastName ?? ''} ${s.phone ?? ''} ${s.groupName ?? ''} ${s.teacherName ?? ''}`
                    .toLowerCase()
                    .includes(search.toLowerCase());
            const matchesStatus = !statusFilter || s.status === statusFilter;
            const matchesGroup = !groupFilter || String(s.groupId) === groupFilter;
            return matchesSearch && matchesStatus && matchesGroup;
        });
    }, [students, search, statusFilter, groupFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const cards = dashboard?.cards;
    const debtorCount =
        cards?.debtors ??
        students.filter((s) => Number(s.balance ?? 0) < 0).length;
    const totalDebt =
        cards?.totalDebt ??
        students
            .filter((s) => Number(s.balance ?? 0) < 0)
            .reduce((sum, s) => sum + Math.abs(Number(s.balance ?? 0)), 0)
            .toString();
    const groupCount = cards?.groups ?? groups.length;

    const dirStats = [
        { label: 'Leads', value: cards?.activeLeads ?? 0, icon: UserPlus, color: '#4C6FFF' },
        { label: 'Students', value: cards?.activeStudents ?? students.length, icon: Users, color: '#2ECC8A' },
        { label: 'Debtors', value: debtorCount, icon: AlertTriangle, color: '#ED6A2E', subText: 'Behind on payments' },
        { label: 'Total debt', value: `${Number(totalDebt).toLocaleString()} UZS`, icon: CreditCard, color: '#E74C3C', subText: 'To receive' },
        { label: 'Groups', value: groupCount, icon: BookOpen, color: '#9B59B6' },
    ];

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('');
        setGroupFilter('');
        setPage(1);
    };

    const hasActiveFilters = !!search || !!statusFilter || !!groupFilter;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-[24px] font-extrabold text-[#1A2233] tracking-tight">
                        Students Directory
                    </h1>
                    <p className="text-[13px] text-[#8A9BB8] font-bold mt-1">
                        Manage your database and track payments
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowPaymentForm(true)}
                        className="hidden sm:flex items-center gap-2 bg-[#F5F6FA] text-[#1A2233] px-5 py-2.5 rounded-xl text-[13px] font-black border border-[#F0F1F5] hover:bg-gray-100 transition-all"
                    >
                        <CreditCard size={18} />
                        Add Payment
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowStudentForm(true)}
                        className="bg-[#ED6A2E] text-white px-5 py-2.5 rounded-xl text-[13px] font-black flex items-center gap-2 hover:bg-[#D95B24] transition-all shadow-[0_4px_12px_rgba(237,106,46,0.3)]"
                    >
                        <UserPlus size={18} strokeWidth={3} />
                        Add Student
                    </button>
                </div>
            </div>

            {/* Dir Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {dirStats.map((s, i) => (
                    <StatCard key={i} {...s} />
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={14} className="text-[#ED6A2E]" />
                    <span className="text-[10px] font-black text-[#8A9BB8] uppercase tracking-widest">
                        Filters
                    </span>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="ml-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#ED6A2E] hover:text-[#D95B24]"
                        >
                            <X size={12} /> Reset
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={15} />
                        <input
                            type="text"
                            placeholder="Search student..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-[#F8F9FB] border border-[#F0F1F5] rounded-xl pl-10 pr-3 py-2.5 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none focus:border-[#ED6A2E]/40"
                        />
                    </div>
                    <CustomSelect
                        value={statusFilter}
                        onChange={(v) => {
                            setStatusFilter(v);
                            setPage(1);
                        }}
                        placeholder="All statuses"
                        size="sm"
                        options={[
                            { value: 'active', label: 'Active' },
                            { value: 'waiting', label: 'Waiting' },
                            { value: 'stopped', label: 'Stopped' },
                            { value: 'frozen', label: 'Frozen' },
                            { value: 'blacklist', label: 'Blacklist' },
                        ]}
                    />
                    <CustomSelect
                        value={groupFilter}
                        onChange={(v) => {
                            setGroupFilter(v);
                            setPage(1);
                        }}
                        placeholder="All groups"
                        size="sm"
                        options={groups.map((g) => ({
                            value: String(g.id ?? ''),
                            label: g.name ?? `Group ${g.id}`,
                        }))}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F7F8FA] border-b border-[#F0F1F5]">
                            <tr>
                                {['Student', 'Phone', 'Group / Teacher', 'Balance', 'Status', 'Actions'].map((h) => (
                                    <th
                                        key={h}
                                        className="text-left px-6 py-4 text-[10px] font-black text-[#8A9BB8] uppercase tracking-[1.5px]"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F1F5]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-20">
                                        <div className="flex justify-center">
                                            <div className="w-8 h-8 border-4 border-[#ED6A2E]/20 border-t-[#ED6A2E] rounded-full animate-spin" />
                                        </div>
                                    </td>
                                </tr>
                            ) : paged.length > 0 ? (
                                paged.map((s) => (
                                    <StudentRow
                                        key={s.id ?? `${s.firstName}-${s.phone}`}
                                        student={s}
                                        onOpen={() => navigate(`/student-details/${s.id}`)}
                                        onDelete={() => s.id != null && setConfirmDelete(s.id)}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-16 text-center text-[#8A9BB8] font-bold uppercase tracking-widest text-[11px]"
                                    >
                                        No students found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    page={safePage}
                    totalPages={totalPages}
                    onChange={setPage}
                    total={filtered.length}
                    totalAll={students.length}
                />
            </div>

            {showStudentForm && (
                <StudentCreateDialog onClose={() => setShowStudentForm(false)} />
            )}
            {showPaymentForm && (
                <PaymentDialog
                    students={students}
                    onClose={() => setShowPaymentForm(false)}
                />
            )}
            {confirmDelete != null && (
                <ModalShell title="Delete student" onClose={() => setConfirmDelete(null)}>
                    <div className="p-5">
                        <p className="text-[13px] font-semibold text-[#5A6376]">
                            This student will be deleted.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#8A9BB8] hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        await deleteStudent(confirmDelete).unwrap();
                                        toast.success('Student deleted successfully');
                                        setConfirmDelete(null);
                                    } catch {
                                        toast.error('Could not delete student');
                                    }
                                }}
                                className="rounded-xl bg-red-500 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </ModalShell>
            )}
        </div>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    color,
    subText,
}: {
    label: string;
    value: string | number;
    icon: typeof Users;
    color: string;
    subText?: string;
}) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] flex flex-col justify-between min-h-[120px]">
            <div className="flex items-start justify-between">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <Icon size={14} style={{ color }} />
                        <span className="text-[11px] font-bold text-[#8A9BB8] uppercase tracking-tight">
                            {label}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-end justify-between mt-auto">
                <div className="text-[22px] font-black text-[#1A2233] leading-none break-all">
                    {value}
                </div>
                {subText && (
                    <span className="text-[9px] font-extrabold text-[#ED6A2E] uppercase tracking-wider">
                        {subText}
                    </span>
                )}
            </div>
        </div>
    );
}

function StudentRow({
    student,
    onOpen,
    onDelete,
}: {
    student: StudentModel;
    onOpen: () => void;
    onDelete: () => void;
}) {
    const balance = Number(student.balance ?? 0);
    const balanceColor = balance >= 0 ? 'text-[#2ECC8A]' : 'text-[#E74C3C]';
    const statusKey = (student.status ?? '').toLowerCase();
    const statusStyle =
        statusKey === 'active'
            ? 'bg-[#2ECC8A]/10 text-[#2ECC8A]'
            : statusKey === 'frozen'
            ? 'bg-[#4C6FFF]/10 text-[#4C6FFF]'
            : statusKey === 'stopped'
            ? 'bg-[#ED6A2E]/10 text-[#ED6A2E]'
            : statusKey === 'blacklist'
            ? 'bg-[#E74C3C]/10 text-[#E74C3C]'
            : 'bg-[#8A9BB8]/10 text-[#8A9BB8]';

    return (
        <tr
            onClick={onOpen}
            className="hover:bg-[#F8F9FB] cursor-pointer transition-colors"
        >
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-[#ED6A2E] to-[#FF9A6C] shrink-0 shadow-sm">
                        <span className="text-white text-[11px] font-black uppercase">
                            {(student.firstName?.[0] ?? '?')}
                            {(student.lastName?.[0] ?? '')}
                        </span>
                    </div>
                    <div>
                        <p className="text-[13px] font-extrabold text-[#1A2233] leading-tight">
                            {student.firstName} {student.lastName}
                        </p>
                        {student.birthDate && (
                            <p className="text-[10px] font-bold text-[#8A9BB8] mt-0.5">
                                {student.birthDate}
                            </p>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="text-[12px] font-bold text-[#5A6376]">
                    {student.phone || '—'}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-col">
                    <span className="text-[13px] font-black text-[#1A2233] leading-tight">
                        {student.groupName || '—'}
                    </span>
                    <span className="text-[10px] text-[#8A9BB8] font-bold mt-0.5">
                        {student.teacherName || ''}
                    </span>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`text-[13px] font-black ${balanceColor}`}>
                    {balance.toLocaleString()} UZS
                </span>
            </td>
            <td className="px-6 py-4">
                <span
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${statusStyle}`}
                >
                    {student.statusDisplay ?? student.status ?? '—'}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpen();
                        }}
                        className="p-2 hover:bg-[#ED6A2E]/10 rounded-lg transition-colors text-[#8A9BB8] hover:text-[#ED6A2E]"
                        title="Open"
                    >
                        <Edit2 size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-[#8A9BB8] hover:text-red-500"
                        title="Delete"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function Pagination({
    page,
    totalPages,
    onChange,
    total,
    totalAll,
}: {
    page: number;
    totalPages: number;
    onChange: (p: number) => void;
    total: number;
    totalAll: number;
}) {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i += 1) pages.push(i);

    return (
        <div className="px-6 py-4 bg-[#F7F8FA] flex flex-col sm:flex-row items-center justify-between border-t border-[#F0F1F5] gap-3">
            <span className="text-[11px] font-bold text-[#8A9BB8]">
                Showing {total} of {totalAll} students
            </span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-[#8A9BB8] hover:bg-white transition-all disabled:opacity-50"
                >
                    <ChevronLeft size={16} />
                </button>
                {pages.map((p) => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => onChange(p)}
                        className={`w-8 h-8 rounded-lg text-[12px] font-black transition-all ${
                            p === page
                                ? 'bg-[#ED6A2E] text-white shadow-md'
                                : 'border border-gray-200 text-[#8A9BB8] hover:bg-white'
                        }`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => onChange(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-[#8A9BB8] hover:bg-white transition-all disabled:opacity-50"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

function StudentCreateDialog({ onClose }: { onClose: () => void }) {
    const [createStudent, { isLoading }] = useCreateStudentMutation();
    const toast = useToast();
    const { data: groups = [] } = useGetGroupsQuery();
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        parentPhone: '',
        status: 'active',
        gender: '',
        birthDate: '',
        source: '',
        notes: '',
        groupId: '',
    });

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.firstName.trim()) return;
        await createStudent({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            phone: form.phone.trim() || undefined,
            parentPhone: form.parentPhone.trim() || undefined,
            status: form.status,
            gender: form.gender || undefined,
            birthDate: form.birthDate || undefined,
            source: form.source.trim() || undefined,
            notes: form.notes.trim() || undefined,
        }).unwrap();
        toast.success('Student created successfully');
        onClose();
    };

    return (
        <ModalShell title="Add new student" onClose={onClose} maxWidthClass="max-w-lg">
            <form onSubmit={submit} className="space-y-3 p-5 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="First name *"
                        value={form.firstName}
                        onChange={(v) => setForm({ ...form, firstName: v })}
                        required
                    />
                    <Input
                        label="Last name"
                        value={form.lastName}
                        onChange={(v) => setForm({ ...form, lastName: v })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="Phone"
                        value={form.phone}
                        onChange={(v) => setForm({ ...form, phone: v })}
                        placeholder="+998 90 123 45 67"
                    />
                    <Input
                        label="Parent phone"
                        value={form.parentPhone}
                        onChange={(v) => setForm({ ...form, parentPhone: v })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Select
                        label="Gender"
                        value={form.gender}
                        onChange={(v) => setForm({ ...form, gender: v })}
                        options={[
                            { value: '', label: 'Not specified' },
                            { value: 'male', label: 'Male' },
                            { value: 'female', label: 'Female' },
                        ]}
                    />
                    <Input
                        label="Birth date"
                        type="date"
                        value={form.birthDate}
                        onChange={(v) => setForm({ ...form, birthDate: v })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Select
                        label="Status"
                        value={form.status}
                        onChange={(v) => setForm({ ...form, status: v })}
                        options={[
                            { value: 'active', label: 'Active' },
                            { value: 'waiting', label: 'Waiting' },
                            { value: 'stopped', label: 'Stopped' },
                            { value: 'frozen', label: 'Frozen' },
                        ]}
                    />
                    <Input
                        label="Source"
                        value={form.source}
                        onChange={(v) => setForm({ ...form, source: v })}
                        placeholder="Instagram, walk in..."
                    />
                </div>
                <Select
                    label="Group"
                    value={form.groupId}
                    onChange={(v) => setForm({ ...form, groupId: v })}
                    options={[
                        { value: '', label: 'No group' },
                        ...groups.map((g) => ({ value: String(g.id ?? ''), label: g.name ?? '' })),
                    ]}
                />
                <Textarea
                    label="Notes"
                    value={form.notes}
                    onChange={(v) => setForm({ ...form, notes: v })}
                />
                <div className="flex justify-end gap-2 pt-3 border-t border-[#F0F1F5]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#8A9BB8] hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !form.firstName.trim()}
                        className="rounded-xl bg-[#ED6A2E] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-50 hover:bg-[#D95B24]"
                    >
                        {isLoading ? 'Saving…' : 'Create'}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

function PaymentDialog({
    students,
    onClose,
}: {
    students: StudentModel[];
    onClose: () => void;
}) {
    const [createPayment, { isLoading }] = useCreatePaymentMutation();
    const toast = useToast();
    const [form, setForm] = useState({
        studentId: '',
        amount: '',
        payWith: 'cash',
        paymentMonth: '',
    });

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.studentId || Number(form.amount) <= 0) return;
        await createPayment({
            studentId: form.studentId,
            amount: form.amount,
            payWith: form.payWith,
        }).unwrap();
        toast.success('Payment recorded successfully');
        onClose();
    };

    return (
        <ModalShell title="Add payment" onClose={onClose}>
            <form onSubmit={submit} className="space-y-3 p-5">
                <Select
                    label="Student *"
                    value={form.studentId}
                    onChange={(v) => setForm({ ...form, studentId: v })}
                    options={[
                        { value: '', label: 'Select student' },
                        ...students
                            .filter((s) => s.id != null)
                            .map((s) => ({
                                value: String(s.id),
                                label: `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || `#${s.id}`,
                            })),
                    ]}
                />
                <Input
                    label="Amount (UZS) *"
                    type="number"
                    value={form.amount}
                    onChange={(v) => setForm({ ...form, amount: v })}
                    required
                />
                <Select
                    label="Method"
                    value={form.payWith}
                    onChange={(v) => setForm({ ...form, payWith: v })}
                    options={[
                        { value: 'cash', label: 'Cash' },
                        { value: 'card', label: 'Card' },
                        { value: 'transfer', label: 'Transfer' },
                        { value: 'online', label: 'Online' },
                    ]}
                />
                <Input
                    label="Payment month"
                    type="month"
                    value={form.paymentMonth}
                    onChange={(v) => setForm({ ...form, paymentMonth: v })}
                />
                <div className="flex justify-end gap-2 pt-3 border-t border-[#F0F1F5]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#8A9BB8] hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !form.studentId || Number(form.amount) <= 0}
                        className="rounded-xl bg-[#ED6A2E] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-50 hover:bg-[#D95B24]"
                    >
                        {isLoading ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

function Input({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#8A9BB8]">
                {label}
            </span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                className="rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] px-4 py-3 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none focus:border-[#ED6A2E]/50 focus:bg-white transition-colors"
            />
        </label>
    );
}

function Select({
    label,
    value,
    onChange,
    options,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}) {
    const emptyOption = options.find((o) => o.value === '');
    const realOptions = options.filter((o) => o.value !== '');

    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#8A9BB8]">
                {label}
            </span>
            <CustomSelect
                value={value}
                onChange={onChange}
                options={realOptions}
                placeholder={placeholder ?? emptyOption?.label ?? label}
            />
        </label>
    );
}

function Textarea({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#8A9BB8]">
                {label}
            </span>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                className="rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] px-4 py-3 text-[13px] font-bold text-[#1A2233] outline-none focus:border-[#ED6A2E]/50 focus:bg-white transition-colors resize-y min-h-20"
            />
        </label>
    );
}
