import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Calendar, CreditCard } from 'lucide-react';
import { useGetStudentByIdQuery, useGetStudentPaymentsQuery } from '../../store/api/studentApi';

export default function StudentDetailsPage() {
    const { id, studentId } = useParams<{ id?: string; studentId?: string }>();
    const resolvedId = id ?? studentId ?? '';
    const navigate = useNavigate();
    const { data: student, isLoading } = useGetStudentByIdQuery(resolvedId);
    const { data: payments = [] } = useGetStudentPaymentsQuery(resolvedId);

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
    );

    if (!student) return <div className="text-center py-20 text-text-secondary">Student not found</div>;

    return (
        <div className="space-y-5 max-w-4xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                <ArrowLeft size={16} />
                Back to students
            </button>

            {/* Header card */}
            <div className="card flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-md">
                    <User size={28} className="text-white" />
                </div>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-text-primary">{student.firstName} {student.lastName}</h1>
                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                        {student.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                                <Phone size={13} />
                                {student.phone}
                            </div>
                        )}
                        {student.birthDate && (
                            <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                                <Calendar size={13} />
                                {student.birthDate}
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <span className="badge-orange text-sm px-3 py-1">{student.status}</span>
                </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card">
                    <h2 className="section-title mb-4">Information</h2>
                    <dl className="space-y-3">
                        {[
                            { label: 'Group', value: student.groupName },
                            { label: 'Gender', value: student.gender === 'male' ? 'Male' : student.gender === 'female' ? 'Female' : student.gender },
                            { label: 'Source', value: student.source },
                            { label: 'Notes', value: student.notes },
                            { label: 'Parent', value: student.parentPhone },
                        ].map(({ label, value }) => value ? (
                            <div key={label} className="flex items-start justify-between text-sm">
                                <dt className="text-text-secondary">{label}</dt>
                                <dd className="text-text-primary font-medium text-right max-w-[60%]">{String(value)}</dd>
                            </div>
                        ) : null)}
                    </dl>
                </div>

                <div className="card">
                    <h2 className="section-title mb-4 flex items-center gap-2">
                        <CreditCard size={16} className="text-primary" />
                        Payments
                    </h2>
                    {payments.length === 0 ? (
                        <p className="text-sm text-text-secondary">No payments</p>
                    ) : (
                        <div className="space-y-2">
                            {payments.map((p) => (
                                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">{Number(p.amount).toLocaleString()} UZS</p>
                                        <p className="text-xs text-text-secondary">{p.createdAt} / {p.payWith}</p>
                                    </div>
                                    <span className="badge-green text-xs">Paid</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
