import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Phone, Calendar, CreditCard, GraduationCap,
    Activity, Snowflake, ShieldOff, ShieldCheck, Edit2, Trash2,
    BookOpen, Users as UsersIcon, Mail, MapPin,
} from 'lucide-react';
import {
    useGetStudentByIdQuery,
    useGetStudentPaymentsQuery,
    useGetStudentActivityQuery,
    useGetStudentGradesQuery,
    useDeleteStudentMutation,
} from '../../store/api/studentApi';
import ModalShell from '../../components/common/ModalShell';
import { useToast } from '../../hooks/useToast';

type TabId = 'info' | 'finance' | 'academic' | 'calendar' | 'activity';

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
    { id: 'info', label: 'Profile', icon: User },
    { id: 'finance', label: 'Finance', icon: CreditCard },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'activity', label: 'Activity', icon: Activity },
];

export default function StudentDetailsPage() {
    const { id, studentId } = useParams<{ id?: string; studentId?: string }>();
    const resolvedId = id ?? studentId ?? '';
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabId>('info');
    const [confirmDelete, setConfirmDelete] = useState(false);

    const { data: student, isLoading, error } = useGetStudentByIdQuery(resolvedId);
    const { data: payments = [] } = useGetStudentPaymentsQuery(resolvedId, { skip: !resolvedId });
    const { data: grades } = useGetStudentGradesQuery(resolvedId, { skip: !resolvedId });
    const { data: activity = [] } = useGetStudentActivityQuery(resolvedId, { skip: !resolvedId });
    const [deleteStudent] = useDeleteStudentMutation();
    const toast = useToast();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-[#ED6A2E]/30 border-t-[#ED6A2E] rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="text-center py-20">
                <p className="text-[#8A9BB8] font-bold mb-3">Student not found</p>
                <button
                    type="button"
                    onClick={() => navigate('/students')}
                    className="text-[#ED6A2E] font-bold hover:underline"
                >
                    ← Back to students
                </button>
            </div>
        );
    }

    const fullName = `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || 'Unnamed';
    const initials = (
        (student.firstName?.[0] ?? '') + (student.lastName?.[0] ?? '')
    ).toUpperCase() || 'U';

    const balance = Number(student.balance ?? 0);
    const balanceColor =
        balance >= 0
            ? 'text-[#2ECC8A]'
            : 'text-[#E74C3C]';
    const statusColor =
        student.status === 'active'
            ? 'bg-[#2ECC8A]/10 text-[#2ECC8A]'
            : student.status === 'frozen'
            ? 'bg-[#4C6FFF]/10 text-[#4C6FFF]'
            : student.status === 'stopped'
            ? 'bg-[#ED6A2E]/10 text-[#ED6A2E]'
            : 'bg-[#8A9BB8]/10 text-[#8A9BB8]';

    return (
        <div className="space-y-5 max-w-6xl mx-auto animate-in fade-in duration-300">
            {/* Back link */}
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[12px] font-bold text-[#8A9BB8] hover:text-[#1A2233] transition-colors"
            >
                <ArrowLeft size={14} />
                Back
            </button>

            {/* Header card */}
            <div className="bg-white rounded-2xl border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] p-6">
                <div className="flex flex-col lg:flex-row items-start gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ED6A2E] to-[#FF9A6C] flex items-center justify-center shadow-md shrink-0">
                        <span className="text-white text-[26px] font-black uppercase">
                            {initials}
                        </span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3 flex-wrap">
                            <h1 className="text-[22px] font-extrabold text-[#1A2233]">
                                {fullName}
                            </h1>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${statusColor}`}>
                                {student.statusDisplay ?? student.status ?? '—'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[12px]">
                            <InfoRow icon={Phone} label="Phone" value={student.phone} />
                            <InfoRow icon={Mail} label="Parent" value={student.parentPhone} />
                            <InfoRow icon={UsersIcon} label="Group" value={student.groupName} />
                            <InfoRow icon={GraduationCap} label="Teacher" value={student.teacherName} />
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A9BB8] mb-1 text-right">
                                Balance
                            </p>
                            <p className={`text-[24px] font-black ${balanceColor}`}>
                                {balance.toLocaleString()} UZS
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#F0F1F5] bg-white text-[#8A9BB8] hover:text-[#1A2233] hover:border-gray-300 transition-all text-[12px] font-bold"
                                title="Edit student"
                            >
                                <Edit2 size={13} /> Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(true)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-all text-[12px] font-bold"
                            >
                                <Trash2 size={13} /> Delete
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-[#F0F1F5]">
                    <ActionPill icon={CreditCard} label="Add Payment" color="#ED6A2E" />
                    <ActionPill icon={Snowflake} label="Freeze" color="#4C6FFF" />
                    <ActionPill icon={ShieldOff} label="Blacklist" color="#E74C3C" />
                    <ActionPill icon={ShieldCheck} label="Restore" color="#2ECC8A" />
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] overflow-hidden">
                <div className="flex border-b border-[#F0F1F5] overflow-x-auto scrollbar-hide">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-4 text-[12px] font-black uppercase tracking-wider shrink-0 transition-all relative ${
                                    active
                                        ? 'text-[#ED6A2E]'
                                        : 'text-[#8A9BB8] hover:text-[#1A2233]'
                                }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                                {active && (
                                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#ED6A2E] rounded-t" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="p-6">
                    {activeTab === 'info' && <InfoTab student={student as unknown as Record<string, unknown>} />}
                    {activeTab === 'finance' && (
                        <FinanceTab payments={payments as unknown as PaymentRow[]} />
                    )}
                    {activeTab === 'academic' && <AcademicTab grades={grades} />}
                    {activeTab === 'calendar' && <CalendarTab studentId={resolvedId} />}
                    {activeTab === 'activity' && <ActivityTab activity={activity} />}
                </div>
            </div>

            {confirmDelete && (
                <ModalShell title="Delete student?" onClose={() => setConfirmDelete(false)}>
                    <div className="p-5">
                        <p className="text-[13px] text-[#5A6376] font-semibold">
                            This action removes <b>{fullName}</b> permanently.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(false)}
                                className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#8A9BB8] hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (student.id != null) {
                                        await deleteStudent(student.id).unwrap();
                                        toast.success('Student deleted successfully');
                                        navigate('/students');
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

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value?: string | null }) {
    return (
        <div className="flex items-center gap-2 text-[#5A6376]">
            <Icon size={13} className="text-[#8A9BB8] shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8A9BB8]">
                {label}:
            </span>
            <span className="text-[12px] font-bold text-[#1A2233] truncate">
                {value || '—'}
            </span>
        </div>
    );
}

function ActionPill({ icon: Icon, label, color }: { icon: typeof User; label: string; color: string }) {
    return (
        <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-[12px] font-black uppercase tracking-wider transition-all hover:brightness-95"
            style={{
                backgroundColor: `${color}1A`,
                borderColor: `${color}30`,
                color,
            }}
        >
            <Icon size={13} />
            {label}
        </button>
    );
}

function InfoTab({ student }: { student: Record<string, unknown> }) {
    const fields: { label: string; value?: unknown }[] = [
        { label: 'First name', value: student.firstName },
        { label: 'Last name', value: student.lastName },
        { label: 'Phone', value: student.phone },
        { label: 'Parent phone', value: student.parentPhone },
        { label: 'Gender', value: student.gender },
        { label: 'Birth date', value: student.birthDate },
        { label: 'Source', value: student.source },
        { label: 'Group', value: student.groupName },
        { label: 'Teacher', value: student.teacherName },
        { label: 'Course', value: student.courseName },
        { label: 'Joined', value: student.joinedAt },
        { label: 'Group price', value: student.groupPrice },
        { label: 'Discount', value: student.discountAmount },
        { label: 'Final price', value: student.finalPrice },
        { label: 'Paid', value: student.paidAmount },
        { label: 'Notes', value: student.notes },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {fields.map((f) => (
                <div key={f.label} className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8A9BB8]">
                        {f.label}
                    </span>
                    <span className="text-[13px] font-bold text-[#1A2233]">
                        {f.value != null && String(f.value).trim() !== '' ? String(f.value) : '—'}
                    </span>
                </div>
            ))}
        </div>
    );
}

interface PaymentRow {
    id?: number;
    amount?: string;
    payWith?: string;
    createdAt?: string;
    paymentMonth?: string;
}

function FinanceTab({ payments }: { payments: PaymentRow[] }) {
    const total = payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[14px] font-extrabold text-[#1A2233]">Payment history</h3>
                <span className="text-[12px] font-bold text-[#8A9BB8]">
                    {payments.length} payment{payments.length === 1 ? '' : 's'} ·{' '}
                    <span className="text-[#2ECC8A] font-black">{total.toLocaleString()} UZS</span>
                </span>
            </div>
            {payments.length === 0 ? (
                <p className="text-center py-12 text-[#8A9BB8] text-[12px] font-bold uppercase tracking-widest">
                    No payments yet
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F7F8FA] text-[10px] font-black text-[#8A9BB8] uppercase tracking-widest">
                            <tr>
                                <th className="text-left px-4 py-3 rounded-l-lg">Date</th>
                                <th className="text-left px-4 py-3">Amount</th>
                                <th className="text-left px-4 py-3">Method</th>
                                <th className="text-left px-4 py-3 rounded-r-lg">Period</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F1F5]">
                            {payments.map((p) => (
                                <tr key={p.id ?? Math.random()}>
                                    <td className="px-4 py-3 text-[12px] font-bold text-[#5A6376]">
                                        {String(p.createdAt ?? '').slice(0, 10) || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-[13px] font-black text-[#1A2233]">
                                        {Number(p.amount ?? 0).toLocaleString()} UZS
                                    </td>
                                    <td className="px-4 py-3 text-[12px] font-bold text-[#5A6376] capitalize">
                                        {String(p.payWith ?? '—').replace(/_/g, ' ')}
                                    </td>
                                    <td className="px-4 py-3 text-[12px] font-bold text-[#5A6376]">
                                        {String(p.paymentMonth ?? '—')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function AcademicTab({ grades }: { grades?: Record<string, unknown> }) {
    if (!grades) {
        return (
            <p className="text-center py-12 text-[#8A9BB8] text-[12px] font-bold uppercase tracking-widest">
                No academic data
            </p>
        );
    }

    const lessons = Array.isArray(grades['lessons']) ? (grades['lessons'] as Record<string, unknown>[]) : [];
    const overall = grades['overall'] ?? grades['summary'] ?? {};
    const attendance = (overall as Record<string, unknown>)['attendance'] ?? '—';
    const avgClass = (overall as Record<string, unknown>)['class_score'] ?? '—';
    const avgHw = (overall as Record<string, unknown>)['homework_score'] ?? '—';

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
                <MetricCard label="Attendance" value={String(attendance)} color="#4C6FFF" />
                <MetricCard label="Class avg" value={String(avgClass)} color="#2ECC8A" />
                <MetricCard label="Homework avg" value={String(avgHw)} color="#ED6A2E" />
            </div>

            {lessons.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F7F8FA] text-[10px] font-black text-[#8A9BB8] uppercase tracking-widest">
                            <tr>
                                <th className="text-left px-4 py-3 rounded-l-lg">Date</th>
                                <th className="text-left px-4 py-3">Topic</th>
                                <th className="text-left px-4 py-3">Class</th>
                                <th className="text-left px-4 py-3">Homework</th>
                                <th className="text-left px-4 py-3 rounded-r-lg">Attendance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F1F5]">
                            {lessons.map((l, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 text-[12px] font-bold text-[#5A6376]">
                                        {String(l['date'] ?? l['lesson_date'] ?? '—').slice(0, 10)}
                                    </td>
                                    <td className="px-4 py-3 text-[12px] font-bold text-[#1A2233]">
                                        {String(l['topic'] ?? l['title'] ?? '—')}
                                    </td>
                                    <td className="px-4 py-3 text-[12px] font-black text-[#2ECC8A]">
                                        {String(l['class_score'] ?? '—')}
                                    </td>
                                    <td className="px-4 py-3 text-[12px] font-black text-[#ED6A2E]">
                                        {String(l['homework_score'] ?? '—')}
                                    </td>
                                    <td className="px-4 py-3 text-[12px] font-bold text-[#5A6376] capitalize">
                                        {String(l['attendance'] ?? '—')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div
            className="rounded-2xl border p-4"
            style={{
                backgroundColor: `${color}0F`,
                borderColor: `${color}30`,
            }}
        >
            <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color }}>
                {label}
            </div>
            <div className="text-[22px] font-black text-[#1A2233]">{value}</div>
        </div>
    );
}

function CalendarTab({ studentId }: { studentId: string }) {
    if (!studentId) return null;
    return (
        <div className="text-center py-12">
            <BookOpen size={32} className="mx-auto text-[#C7CCD4] mb-3" />
            <p className="text-[#8A9BB8] font-bold text-[13px]">
                Calendar view coming soon
            </p>
            <p className="text-[#C7CCD4] text-[11px] mt-1 font-bold uppercase tracking-widest">
                Lesson schedule will appear here
            </p>
        </div>
    );
}

function ActivityTab({ activity }: { activity: Record<string, unknown>[] }) {
    if (!activity.length) {
        return (
            <p className="text-center py-12 text-[#8A9BB8] text-[12px] font-bold uppercase tracking-widest">
                No activity recorded
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {activity.map((a, i) => (
                <div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-xl border border-[#F0F1F5] hover:bg-[#F7F8FA] transition-colors"
                >
                    <div className="w-9 h-9 rounded-lg bg-[#ED6A2E]/10 flex items-center justify-center text-[#ED6A2E] shrink-0">
                        <Activity size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-extrabold text-[#1A2233]">
                            {String(a['title'] ?? a['type'] ?? 'Activity')}
                        </p>
                        {a['description'] != null && String(a['description']).trim() !== '' && (
                            <p className="text-[12px] text-[#5A6376] font-semibold mt-0.5">
                                {String(a['description'])}
                            </p>
                        )}
                        <p className="text-[10px] font-bold text-[#8A9BB8] uppercase tracking-wider mt-1">
                            {String(a['date'] ?? a['created_at'] ?? '—').slice(0, 16)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export { MapPin };
