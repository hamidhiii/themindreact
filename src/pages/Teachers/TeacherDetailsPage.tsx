import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Phone, Mail, BookOpen, Users, Calendar, Wallet,
    GraduationCap, Award, AlertCircle, Edit2, ToggleLeft, ToggleRight,
} from 'lucide-react';
import {
    useGetTeacherDetailQuery,
    useGetTeacherGroupsQuery,
    useGetTeacherTodayLessonsQuery,
    useGetTeachersQuery,
    useUpdateTeacherStatusMutation,
} from '../../store/api/teacherApi';

type TabId = 'overview' | 'groups' | 'today' | 'history';

interface TabDef {
    id: TabId;
    label: string;
    icon: typeof User;
}

const TABS: TabDef[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'groups', label: 'Groups', icon: BookOpen },
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'history', label: 'History', icon: Award },
];

export default function TeacherDetailsPage() {
    const { teacherId } = useParams<{ teacherId: string }>();
    const navigate = useNavigate();
    const id = teacherId ?? '';
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    const { data: detail, isLoading } = useGetTeacherDetailQuery(id, { skip: !id });
    const { data: groups = [] } = useGetTeacherGroupsQuery(id, { skip: !id });
    const { data: today = [] } = useGetTeacherTodayLessonsQuery(id, { skip: !id });
    const { data: teachers = [] } = useGetTeachersQuery();
    const [updateStatus] = useUpdateTeacherStatusMutation();

    const teacher = teachers.find((t) => t.id === id);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-[#ED6A2E]/30 border-t-[#ED6A2E] rounded-full animate-spin" />
            </div>
        );
    }

    if (!teacher && !detail) {
        return (
            <div className="text-center py-20">
                <p className="text-[#8A9BB8] font-bold mb-3">Teacher not found</p>
                <button
                    type="button"
                    onClick={() => navigate('/teachers')}
                    className="text-[#ED6A2E] font-bold hover:underline"
                >
                    ← Back
                </button>
            </div>
        );
    }

    const fullName = teacher?.fullName ?? 'Unknown teacher';
    const initial = fullName[0]?.toUpperCase() ?? 'T';
    const balance = Number(detail?.balance ?? 0);

    return (
        <div className="space-y-5 max-w-6xl mx-auto animate-in fade-in duration-300">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[12px] font-bold text-[#8A9BB8] hover:text-[#1A2233] transition-colors"
            >
                <ArrowLeft size={14} /> Back
            </button>

            {/* Header */}
            <div className="bg-white rounded-2xl border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] p-6">
                <div className="flex flex-col lg:flex-row items-start gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ED6A2E] to-[#FF9A6C] flex items-center justify-center shadow-md shrink-0">
                        <span className="text-white text-[28px] font-black uppercase">
                            {initial}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <h1 className="text-[22px] font-extrabold text-[#1A2233]">
                                {fullName}
                            </h1>
                            <span
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                    teacher?.isActive
                                        ? 'bg-[#2ECC8A]/10 text-[#2ECC8A]'
                                        : 'bg-[#8A9BB8]/10 text-[#8A9BB8]'
                                }`}
                            >
                                {teacher?.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {teacher?.isSupport && (
                                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#4C6FFF]/10 text-[#4C6FFF]">
                                    Support
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <InfoRow icon={Phone} label="Phone" value={teacher?.phoneNumber} />
                            <InfoRow icon={Mail} label="Username" value={teacher?.username} />
                            <InfoRow
                                icon={GraduationCap}
                                label="Experience"
                                value={teacher?.experienceYear ? `${teacher.experienceYear} years` : undefined}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A9BB8] mb-1 text-right">
                                Balance
                            </p>
                            <p className={`text-[24px] font-black ${balance >= 0 ? 'text-[#2ECC8A]' : 'text-[#E74C3C]'}`}>
                                {balance.toLocaleString()} UZS
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#F0F1F5] bg-white text-[#8A9BB8] hover:text-[#1A2233] hover:border-gray-300 text-[12px] font-bold transition-all"
                            >
                                <Edit2 size={13} /> Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => updateStatus({ id, isActive: !teacher?.isActive })}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-white hover:brightness-95 text-[12px] font-bold transition-all"
                                style={{
                                    borderColor: teacher?.isActive ? '#E74C3C30' : '#2ECC8A30',
                                    color: teacher?.isActive ? '#E74C3C' : '#2ECC8A',
                                    backgroundColor: teacher?.isActive ? '#E74C3C0F' : '#2ECC8A0F',
                                }}
                            >
                                {teacher?.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                                {teacher?.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-[#F0F1F5]">
                    <MetricCard
                        label="Lessons this month"
                        value={detail?.lessonsThisMonth ?? 0}
                        icon={Calendar}
                        color="#4C6FFF"
                    />
                    <MetricCard
                        label="Students"
                        value={detail?.studentsCount ?? 0}
                        icon={Users}
                        color="#2ECC8A"
                    />
                    <MetricCard
                        label="Groups"
                        value={groups.length}
                        icon={BookOpen}
                        color="#ED6A2E"
                    />
                    <MetricCard
                        label="Fines"
                        value={`${Number(detail?.fine ?? 0).toLocaleString()} UZS`}
                        icon={AlertCircle}
                        color="#E74C3C"
                    />
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
                                    active ? 'text-[#ED6A2E]' : 'text-[#8A9BB8] hover:text-[#1A2233]'
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
                    {activeTab === 'overview' && (
                        <OverviewTab teacher={teacher} detail={detail} />
                    )}
                    {activeTab === 'groups' && (
                        <GroupsTab groups={groups} navigate={navigate} />
                    )}
                    {activeTab === 'today' && (
                        <TodayLessonsTab today={today} />
                    )}
                    {activeTab === 'history' && (
                        <HistoryTab history={detail?.history ?? []} />
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof User;
    label: string;
    value?: string | null;
}) {
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

function MetricCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: string | number;
    icon: typeof User;
    color: string;
}) {
    return (
        <div className="bg-[#F8F9FB] p-4 rounded-xl border border-[#F0F1F5]">
            <div className="flex items-center gap-2 mb-2">
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}1A` }}
                >
                    <Icon size={13} style={{ color }} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8A9BB8]">
                    {label}
                </span>
            </div>
            <div className="text-[20px] font-black text-[#1A2233]">{value}</div>
        </div>
    );
}

function OverviewTab({
    teacher,
    detail,
}: {
    teacher?: { education?: string; createdAt?: string };
    detail?: { historySummary?: { totalLessons?: number; ownLessons?: number; substituteLessons?: number; totalAmount?: string } };
}) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-[14px] font-extrabold text-[#1A2233] mb-3">Biography</h3>
                <p className="text-[13px] font-semibold text-[#5A6376]">
                    {teacher?.education?.trim() || 'No education info provided.'}
                </p>
            </div>

            {detail?.historySummary && (
                <div>
                    <h3 className="text-[14px] font-extrabold text-[#1A2233] mb-3">Salary summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <SummaryItem label="Total lessons" value={detail.historySummary.totalLessons ?? 0} />
                        <SummaryItem label="Own lessons" value={detail.historySummary.ownLessons ?? 0} />
                        <SummaryItem label="Substitute" value={detail.historySummary.substituteLessons ?? 0} />
                        <SummaryItem
                            label="Total amount"
                            value={`${Number(detail.historySummary.totalAmount ?? 0).toLocaleString()} UZS`}
                            color="#2ECC8A"
                        />
                    </div>
                </div>
            )}

            {teacher?.createdAt && (
                <p className="text-[10px] font-black uppercase tracking-widest text-[#C7CCD4]">
                    Joined {String(teacher.createdAt).slice(0, 10)}
                </p>
            )}
        </div>
    );
}

function SummaryItem({
    label,
    value,
    color = '#1A2233',
}: {
    label: string;
    value: string | number;
    color?: string;
}) {
    return (
        <div className="bg-[#F8F9FB] rounded-xl p-3 border border-[#F0F1F5]">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#8A9BB8] mb-1">
                {label}
            </div>
            <div className="text-[18px] font-black" style={{ color }}>
                {value}
            </div>
        </div>
    );
}

function GroupsTab({
    groups,
    navigate,
}: {
    groups: Array<{ id?: number; name?: string; studentCount?: number; level?: string; levelDisplay?: string; weekDays?: string; startTime?: string; endTime?: string; isActive?: boolean }>;
    navigate: (path: string) => void;
}) {
    if (groups.length === 0) {
        return (
            <p className="text-center py-12 text-[#8A9BB8] text-[12px] font-bold uppercase tracking-widest">
                No groups assigned
            </p>
        );
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groups.map((g) => (
                <button
                    key={g.id}
                    type="button"
                    onClick={() => g.id && navigate(`/groups/details/${g.id}`)}
                    className="bg-[#F8F9FB] rounded-xl p-4 border border-[#F0F1F5] text-left hover:border-[#ED6A2E]/40 hover:bg-white transition-all"
                >
                    <div className="flex items-start justify-between mb-2">
                        <span className="text-[14px] font-extrabold text-[#1A2233]">{g.name ?? `Group #${g.id}`}</span>
                        <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                g.isActive !== false
                                    ? 'bg-[#2ECC8A]/10 text-[#2ECC8A]'
                                    : 'bg-[#8A9BB8]/10 text-[#8A9BB8]'
                            }`}
                        >
                            {g.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-[#8A9BB8]">
                        <span className="capitalize">{g.levelDisplay ?? g.level ?? '—'}</span>
                        <span>·</span>
                        <span>{g.studentCount ?? 0} students</span>
                        {g.startTime && g.endTime && (
                            <>
                                <span>·</span>
                                <span>{g.startTime} - {g.endTime}</span>
                            </>
                        )}
                    </div>
                </button>
            ))}
        </div>
    );
}

function TodayLessonsTab({
    today,
}: {
    today: Array<{ id?: number; time?: string; name?: string; subtitle?: string; type?: string; status?: string; isGroup?: boolean }>;
}) {
    if (today.length === 0) {
        return (
            <p className="text-center py-12 text-[#8A9BB8] text-[12px] font-bold uppercase tracking-widest">
                No lessons today
            </p>
        );
    }
    return (
        <div className="space-y-3">
            {today.map((l, i) => (
                <div
                    key={l.id ?? i}
                    className="flex items-center gap-3 p-4 rounded-xl border border-[#F0F1F5] bg-[#F8F9FB]"
                >
                    <div className="w-12 h-12 rounded-xl bg-[#ED6A2E]/10 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-[#ED6A2E] uppercase">{l.time?.split(':')[0] ?? '--'}</span>
                        <span className="text-[10px] font-bold text-[#ED6A2E]">{l.time?.split(':')[1] ?? '--'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-extrabold text-[#1A2233]">{l.name ?? 'Lesson'}</p>
                        {l.subtitle && (
                            <p className="text-[11px] font-bold text-[#8A9BB8] mt-0.5">{l.subtitle}</p>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {l.isGroup && (
                            <span className="px-2 py-0.5 bg-[#4C6FFF]/10 text-[#4C6FFF] rounded text-[9px] font-black uppercase">
                                Group
                            </span>
                        )}
                        {l.status && (
                            <span className="text-[10px] font-bold text-[#8A9BB8] uppercase">{l.status}</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function HistoryTab({
    history,
}: {
    history: Array<{ lessonDate: string; groupName: string; studentCount: number; salaryType: string; salaryValue: number; lessonAmount: number; isSubstitute: boolean }>;
}) {
    if (history.length === 0) {
        return (
            <p className="text-center py-12 text-[#8A9BB8] text-[12px] font-bold uppercase tracking-widest">
                No history
            </p>
        );
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-[#F7F8FA] text-[10px] font-black text-[#8A9BB8] uppercase tracking-widest">
                    <tr>
                        <th className="text-left px-4 py-3 rounded-l-lg">Date</th>
                        <th className="text-left px-4 py-3">Group</th>
                        <th className="text-left px-4 py-3">Students</th>
                        <th className="text-left px-4 py-3">Type</th>
                        <th className="text-left px-4 py-3 rounded-r-lg">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F1F5]">
                    {history.map((h, i) => (
                        <tr key={i}>
                            <td className="px-4 py-3 text-[12px] font-bold text-[#5A6376]">
                                {h.lessonDate}
                            </td>
                            <td className="px-4 py-3 text-[12px] font-extrabold text-[#1A2233]">
                                {h.groupName}
                            </td>
                            <td className="px-4 py-3 text-[12px] font-bold text-[#5A6376]">
                                {h.studentCount}
                            </td>
                            <td className="px-4 py-3 text-[11px] font-bold text-[#5A6376] capitalize">
                                {h.salaryType}{h.isSubstitute && ' · sub'}
                            </td>
                            <td className="px-4 py-3 text-[12px] font-black text-[#2ECC8A]">
                                {Number(h.lessonAmount).toLocaleString()} UZS
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export { Wallet };
