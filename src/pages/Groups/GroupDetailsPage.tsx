import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Clock, ClipboardCheck, History } from 'lucide-react';
import { useState } from 'react';
import { useGetGroupByIdQuery, useGetGroupStudentsQuery } from '../../store/api/groupApi';

export default function GroupDetailsPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'students' | 'journal'>('students');

    const { data: group, isLoading } = useGetGroupByIdQuery(Number(groupId));
    const { data: students = [] } = useGetGroupStudentsQuery(Number(groupId));

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-5 max-w-5xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                <ArrowLeft size={16} /> Back to groups
            </button>

            {/* Header Info Card */}
            <div className="card">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-text-primary">{group?.name}</h1>
                        <p className="text-text-secondary text-sm mt-1">{group?.level}</p>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full ${group?.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {group?.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="bg-bg-app rounded-lg p-3">
                        <p className="text-text-secondary">Teacher</p>
                        <p className="font-medium truncate">{group?.teacherName ?? group?.teacher ?? '-'}</p>
                    </div>
                    <div className="bg-bg-app rounded-lg p-3">
                        <p className="text-text-secondary">Time</p>
                        <p className="font-medium">{group?.startTime} - {group?.endTime}</p>
                    </div>
                    <div className="bg-bg-app rounded-lg p-3">
                        <p className="text-text-secondary">Students</p>
                        <p className="font-medium flex items-center gap-1"><Users size={13} />{students.length}</p>
                    </div>
                    <div className="bg-bg-app rounded-lg p-3">
                        <p className="text-text-secondary">Price</p>
                        <p className="font-medium text-primary">{group?.price ? `${Number(group.price).toLocaleString()} UZS` : '-'}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('students')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
            ${activeTab === 'students' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    <Users size={16} />
                    Students
                </button>
                <button
                    onClick={() => setActiveTab('journal')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
            ${activeTab === 'journal' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    <ClipboardCheck size={16} />
                    Journal / Attendance
                </button>
            </div>

            {activeTab === 'students' ? (
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="section-title">Student List</h2>
                        <button className="btn-secondary text-xs py-1.5 px-3">Add Student</button>
                    </div>
                    {students.length === 0 ? (
                        <p className="text-text-secondary text-sm py-8 text-center">No students in this group</p>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {(students as { id: number; student_name?: string; student?: number }[]).map((s) => (
                                <div key={s.id} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                            {(s.student_name ?? String(s.student ?? '?'))[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-text-primary block">{s.student_name ?? `Student #${s.student}`}</span>
                                            <span className="text-xs text-text-secondary">Active</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-text-secondary transition-colors" title="Statistics">
                                            <History size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="section-title">Group Journal</h2>
                        <div className="flex gap-2">
                            <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="input text-xs py-1.5 px-3 w-fit" />
                            <button className="btn-primary text-xs py-1.5 px-3">Save</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-bg-app border-b border-gray-100">
                                <tr>
                                    <th className="table-header text-left">Student</th>
                                    <th className="table-header text-center w-24">Arrived</th>
                                    <th className="table-header text-center w-24">Lesson</th>
                                    <th className="table-header text-center w-24">Homework</th>
                                    <th className="table-header text-left">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(students as { id: number; student_name?: string }[]).map((s) => (
                                    <tr key={s.id}>
                                        <td className="table-cell">{s.student_name}</td>
                                        <td className="table-cell text-center">
                                            <input type="checkbox" defaultChecked className="accent-primary" />
                                        </td>
                                        <td className="table-cell">
                                            <input type="number" placeholder="0" className="w-full text-center input py-1 px-2 border-none bg-bg-app" />
                                        </td>
                                        <td className="table-cell">
                                            <input type="number" placeholder="0" className="w-full text-center input py-1 px-2 border-none bg-bg-app" />
                                        </td>
                                        <td className="table-cell">
                                            <input type="text" placeholder="..." className="w-full input py-1 px-2 border-none bg-bg-app text-xs" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {students.length === 0 && <div className="text-center py-12 text-text-secondary">No students to mark</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
