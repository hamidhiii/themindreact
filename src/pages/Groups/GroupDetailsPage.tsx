import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Users, BookOpen, Calendar, BarChart3, ClipboardCheck,
    Clock, Edit2, Trash2, Plus, FileText, Save,
} from 'lucide-react';
import {
    useGetGroupByIdQuery,
    useGetGroupStudentsQuery,
} from '../../store/api/groupApi';
import { useSaveJournalMutation } from '../../store/api/teacherApi';

type TabId = 'info' | 'students' | 'journal' | 'calendar' | 'stats' | 'exams';

interface TabDef {
    id: TabId;
    label: string;
    icon: typeof Users;
}

const TABS: TabDef[] = [
    { id: 'info', label: 'Info', icon: BookOpen },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'journal', label: 'Journal', icon: ClipboardCheck },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'exams', label: 'Exams', icon: FileText },
];

interface GroupStudentRow {
    id: number;
    student?: number;
    studentId?: number;
    student_name?: string;
    studentName?: string;
    full_name?: string;
    phone?: string;
    balance?: string;
}

interface JournalDraftRow {
    arrived: boolean;
    classScore: string;
    homeworkScore: string;
    reason: string;
}

const emptyJournalRow: JournalDraftRow = {
    arrived: true,
    classScore: '',
    homeworkScore: '',
    reason: '',
};

export default function GroupDetailsPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabId>('info');

    const groupIdNum = Number(groupId);
    const { data: group, isLoading } = useGetGroupByIdQuery(groupIdNum, { skip: !groupIdNum });
    const { data: students = [] } = useGetGroupStudentsQuery(groupIdNum, { skip: !groupIdNum });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-[#ED6A2E]/30 border-t-[#ED6A2E] rounded-full animate-spin" />
            </div>
        );
    }

    if (!group) {
        return (
            <div className="text-center py-20">
                <p className="text-[#8A9BB8] font-bold mb-3">Group not found</p>
                <button
                    type="button"
                    onClick={() => navigate('/groups')}
                    className="text-[#ED6A2E] font-bold hover:underline"
                >
                    ← Back to groups
                </button>
            </div>
        );
    }

    const groupStudents = students as unknown as GroupStudentRow[];

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

            {/* Header */}
            <div className="bg-white rounded-2xl border border-[#F0F1F5] shadow-[0_2px_12px_rgba(26,34,51,0.04)] p-6">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ED6A2E] to-[#FF9A6C] flex items-center justify-center shadow-md shrink-0">
                            <BookOpen size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-[22px] font-extrabold text-[#1A2233]">{group.name}</h1>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                {group.level && (
                                    <span className="bg-[#F5F6FA] text-[#1A2233] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-[#F0F1F5] capitalize">
                                        {group.levelDisplay ?? group.level}
                                    </span>
                                )}
                                <span
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                        group.isActive !== false
                                            ? 'bg-[#2ECC8A]/10 text-[#2ECC8A]'
                                            : 'bg-[#8A9BB8]/10 text-[#8A9BB8]'
                                    }`}
                                >
                                    {group.isActive !== false ? 'Active' : 'Inactive'}
                                </span>
                                {group.teacherName && (
                                    <span className="text-[12px] font-bold text-[#8A9BB8] flex items-center gap-1">
                                        <Users size={12} /> {group.teacherName}
                                    </span>
                                )}
                            </div>
                        </div>
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
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 text-[12px] font-bold transition-all"
                        >
                            <Trash2 size={13} /> Delete
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#F0F1F5]">
                    <Meta icon={Clock} label="Schedule" value={`${group.startTime ?? ''} - ${group.endTime ?? ''}`} />
                    <Meta icon={Calendar} label="Days" value={group.weekDays ?? '—'} />
                    <Meta icon={Users} label="Students" value={`${group.studentCount ?? groupStudents.length}`} />
                    <Meta icon={BookOpen} label="Room" value={group.roomName ?? '—'} />
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
                    {activeTab === 'info' && <InfoTab group={group as unknown as Record<string, unknown>} />}
                    {activeTab === 'students' && <StudentsTab students={groupStudents} navigate={navigate} />}
                    {activeTab === 'journal' && <JournalTab groupId={groupIdNum} students={groupStudents} teacherId={String(group.teacher ?? '')} />}
                    {activeTab === 'calendar' && <PlaceholderTab icon={Calendar} text="Calendar view coming soon" />}
                    {activeTab === 'stats' && <PlaceholderTab icon={BarChart3} text="Statistics coming soon" />}
                    {activeTab === 'exams' && <PlaceholderTab icon={FileText} text="Exams will appear here" />}
                </div>
            </div>
        </div>
    );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
    return (
        <div>
            <div className="flex items-center gap-1.5 text-[#8A9BB8]">
                <Icon size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-[13px] font-extrabold text-[#1A2233] mt-1 capitalize">{value}</p>
        </div>
    );
}

function InfoTab({ group }: { group: Record<string, unknown> }) {
    const fields: { label: string; value?: unknown }[] = [
        { label: 'Name', value: group.name },
        { label: 'Level', value: group.levelDisplay ?? group.level },
        { label: 'Teacher', value: group.teacherName },
        { label: 'Room', value: group.roomName },
        { label: 'Start time', value: group.startTime },
        { label: 'End time', value: group.endTime },
        { label: 'Week days', value: group.weekDays },
        { label: 'Start date', value: group.startDate },
        { label: 'End date', value: group.endDate },
        { label: 'Price', value: group.price },
        { label: 'Teacher salary', value: group.teacherFixedSalary },
        { label: 'Created', value: group.createdAt },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {fields.map((f) => (
                <div key={f.label} className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8A9BB8]">
                        {f.label}
                    </span>
                    <span className="text-[13px] font-bold text-[#1A2233] capitalize">
                        {f.value != null && String(f.value).trim() !== '' ? String(f.value) : '—'}
                    </span>
                </div>
            ))}
        </div>
    );
}

function StudentsTab({
    students,
    navigate,
}: {
    students: GroupStudentRow[];
    navigate: (path: string) => void;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[14px] font-extrabold text-[#1A2233]">
                    Enrolled students ({students.length})
                </h3>
                <button
                    type="button"
                    className="flex items-center gap-1.5 bg-[#ED6A2E] text-white px-3 py-2 rounded-lg text-[12px] font-black hover:bg-[#D95B24] transition-all"
                >
                    <Plus size={14} /> Add student
                </button>
            </div>
            {students.length === 0 ? (
                <p className="text-center py-12 text-[#8A9BB8] text-[12px] font-bold uppercase tracking-widest">
                    No students in this group
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F7F8FA] text-[10px] font-black text-[#8A9BB8] uppercase tracking-widest">
                            <tr>
                                <th className="text-left px-4 py-3 rounded-l-lg">Student</th>
                                <th className="text-left px-4 py-3">Phone</th>
                                <th className="text-left px-4 py-3 rounded-r-lg">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F1F5]">
                            {students.map((s) => {
                                const name = s.studentName ?? s.student_name ?? s.full_name ?? `Student #${s.studentId ?? s.student ?? s.id}`;
                                const balance = Number(s.balance ?? 0);
                                const studentId = s.studentId ?? s.student ?? s.id;
                                return (
                                    <tr
                                        key={s.id}
                                        onClick={() => studentId && navigate(`/student-details/${studentId}`)}
                                        className="hover:bg-[#F8F9FB] cursor-pointer"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ED6A2E] to-[#FF9A6C] flex items-center justify-center">
                                                    <span className="text-white text-[10px] font-black uppercase">
                                                        {name[0]}
                                                    </span>
                                                </div>
                                                <span className="text-[13px] font-extrabold text-[#1A2233]">{name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[12px] font-bold text-[#5A6376]">
                                            {s.phone ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[12px] font-black ${balance >= 0 ? 'text-[#2ECC8A]' : 'text-[#E74C3C]'}`}>
                                                {balance.toLocaleString()} UZS
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function JournalTab({
    groupId,
    students,
    teacherId,
}: {
    groupId: number;
    students: GroupStudentRow[];
    teacherId: string;
}) {
    const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
    const [rows, setRows] = useState<Record<number, JournalDraftRow>>({});
    const [message, setMessage] = useState('');
    const [saveJournal, { isLoading: saving }] = useSaveJournalMutation();

    const updateRow = (id: number, patch: Partial<JournalDraftRow>) => {
        setRows((value) => ({
            ...value,
            [id]: { ...emptyJournalRow, ...value[id], ...patch },
        }));
    };

    const handleSave = async () => {
        if (!groupId) return;
        const payload = students.map((s) => {
            const row = rows[s.id] ?? emptyJournalRow;
            return {
                student_id: s.studentId ?? s.student ?? s.id,
                attendance: row.arrived ? 'arrived' : 'absent',
                class_score: Number(row.classScore) || 0,
                homework_score: Number(row.homeworkScore) || 0,
                absence_reason: row.reason,
            };
        });
        try {
            await saveJournal({
                groupId,
                lessonDate: journalDate,
                teacherId: teacherId || localStorage.getItem('userId') || '1',
                students: payload,
            }).unwrap();
            setMessage('Journal saved successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch {
            setMessage('Could not save journal');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[14px] font-extrabold text-[#1A2233]">Daily journal</h3>
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={journalDate}
                        onChange={(e) => setJournalDate(e.target.value)}
                        className="rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] px-3 py-2 text-[12px] font-bold text-[#1A2233] outline-none focus:border-[#ED6A2E]/40"
                    />
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || students.length === 0}
                        className="flex items-center gap-1.5 bg-[#ED6A2E] text-white px-4 py-2 rounded-xl text-[12px] font-black hover:bg-[#D95B24] disabled:opacity-50 transition-all"
                    >
                        <Save size={14} />
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>

            {message && (
                <div className="rounded-xl bg-[#2ECC8A]/10 text-[#2ECC8A] text-[12px] font-bold p-3">
                    {message}
                </div>
            )}

            {students.length === 0 ? (
                <p className="text-center py-12 text-[#8A9BB8] text-[12px] font-bold uppercase tracking-widest">
                    No students to journal
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F7F8FA] text-[10px] font-black text-[#8A9BB8] uppercase tracking-widest">
                            <tr>
                                <th className="text-left px-4 py-3 rounded-l-lg">Student</th>
                                <th className="text-center px-4 py-3">Attended</th>
                                <th className="text-center px-4 py-3">Class</th>
                                <th className="text-center px-4 py-3">Homework</th>
                                <th className="text-left px-4 py-3 rounded-r-lg">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F1F5]">
                            {students.map((s) => {
                                const name = s.studentName ?? s.student_name ?? s.full_name ?? `#${s.id}`;
                                const row = rows[s.id] ?? emptyJournalRow;
                                return (
                                    <tr key={s.id}>
                                        <td className="px-4 py-3 text-[13px] font-extrabold text-[#1A2233]">
                                            {name}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={row.arrived}
                                                onChange={(e) => updateRow(s.id, { arrived: e.target.checked })}
                                                className="w-4 h-4 accent-[#2ECC8A]"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min={0}
                                                max={10}
                                                value={row.classScore}
                                                onChange={(e) => updateRow(s.id, { classScore: e.target.value })}
                                                className="w-16 rounded-lg border border-[#F0F1F5] bg-white px-2 py-1.5 text-[12px] font-bold text-[#1A2233] outline-none text-center focus:border-[#ED6A2E]/40"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min={0}
                                                max={10}
                                                value={row.homeworkScore}
                                                onChange={(e) => updateRow(s.id, { homeworkScore: e.target.value })}
                                                className="w-16 rounded-lg border border-[#F0F1F5] bg-white px-2 py-1.5 text-[12px] font-bold text-[#1A2233] outline-none text-center focus:border-[#ED6A2E]/40"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={row.reason}
                                                onChange={(e) => updateRow(s.id, { reason: e.target.value })}
                                                placeholder={row.arrived ? '—' : 'Absence reason'}
                                                disabled={row.arrived}
                                                className="w-full rounded-lg border border-[#F0F1F5] bg-white px-3 py-1.5 text-[12px] font-bold text-[#1A2233] outline-none focus:border-[#ED6A2E]/40 disabled:bg-[#F7F8FA] disabled:text-[#C7CCD4]"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function PlaceholderTab({ icon: Icon, text }: { icon: typeof BookOpen; text: string }) {
    return (
        <div className="text-center py-16">
            <Icon size={32} className="mx-auto text-[#C7CCD4] mb-3" />
            <p className="text-[#8A9BB8] font-bold text-[13px]">{text}</p>
        </div>
    );
}
