import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Phone, MapPin,
    MoreVertical, UserPlus, ChevronDown,
    ArrowUpDown, Pencil, Trash2,
} from 'lucide-react';
import {
    useCreateWorkerMutation,
    useDeleteWorkerMutation,
    useGetWorkersQuery,
    useUpdateWorkerMutation,
} from '../../store/api/workerApi';
import type { AdminModel } from '../../types';
import ModalShell from '../../components/common/ModalShell';
import CustomSelect from '../../components/common/CustomSelect';
import { formatApiError } from '../../utils/apiError';
import { useToast } from '../../hooks/useToast';

export default function WorkersPage() {
    const navigate = useNavigate();
    const { data: workers = [], isLoading } = useGetWorkersQuery();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortAsc, setSortAsc] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editWorker, setEditWorker] = useState<AdminModel | null>(null);
    const [deleteWorker, setDeleteWorker] = useState<AdminModel | null>(null);
    const [menuWorkerId, setMenuWorkerId] = useState<string | null>(null);

    const roles = ['All', 'Superadmin', 'Admin', 'Teacher', 'Support'];
    const statuses = ['All', 'Active', 'Inactive'];

    const filtered = workers.filter(w => {
        const matchesSearch = `${w.firstName} ${w.lastName} ${w.phoneNumber}`.toLowerCase().includes(search.toLowerCase());

        let matchesRole = true;
        if (roleFilter !== 'All') {
            const roleStr = (w.role || '').toLowerCase().replace(/\s+/g, '');
            const filterStr = roleFilter.toLowerCase().replace(/\s+/g, '');
            matchesRole = roleStr === filterStr;
        }

        let matchesStatus = true;
        if (statusFilter !== 'All') {
            matchesStatus = statusFilter === 'Active' ? w.isActive : !w.isActive;
        }

        return matchesSearch && matchesRole && matchesStatus;
    }).sort((a, b) => {
        const left = `${a.firstName} ${a.lastName}`.trim();
        const right = `${b.firstName} ${b.lastName}`.trim();
        return sortAsc ? left.localeCompare(right) : right.localeCompare(left);
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-extrabold text-[#1A2233] tracking-tight">Employees</h1>
                    <p className="text-[13px] text-[#8A9BB8] font-bold mt-1">Team and access management</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="w-full sm:w-auto bg-[#ED6A2E] text-white px-5 py-2.5 rounded-xl text-[13px] font-black flex items-center justify-center gap-2 hover:bg-[#D95B24] transition-all shadow-[0_4px_12px_rgba(237,106,46,0.3)]"
                >
                    <UserPlus size={18} strokeWidth={3} />
                    Add employee
                </button>
            </div>

            {/* Filter Bar */}
            <div className="space-y-4">
                <div className="flex flex-col lg:flex-row items-center gap-3">
                    <div className="flex-1 w-full relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-white border border-[#F0F1F5] rounded-xl pl-12 pr-4 py-2.5 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none shadow-sm transition-all focus:border-[#ED6A2E]"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-[#F0F1F5] p-1.5 rounded-xl shadow-sm overflow-x-auto w-full lg:w-auto">
                        {roles.map(r => (
                            <button
                                key={r}
                                onClick={() => setRoleFilter(r)}
                                className={`px-4 py-1.5 rounded-lg text-[12px] font-black transition-all whitespace-nowrap ${roleFilter === r ? 'bg-[#ED6A2E] text-white' : 'text-[#8A9BB8] hover:text-[#5A6376]'
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-[#1A2233] p-1 rounded-xl shadow-inner">
                        {statuses.map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-1.5 rounded-lg text-[12px] font-black transition-all ${statusFilter === s ? 'bg-[#2D3748] text-white shadow-sm' : 'text-[#8A9BB8] hover:text-white'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => setSortAsc((value) => !value)}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-[#F0F1F5] rounded-xl text-[12px] font-black text-[#8A9BB8] hover:text-[#5A6376] transition-all shadow-sm"
                    >
                        <ArrowUpDown size={14} />
                        {sortAsc ? 'A - Z' : 'Z - A'}
                        <ChevronDown size={14} />
                    </button>
                </div>
            </div>

            {/* Employee Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-[24px] border border-[#F0F1F5] p-5 h-[260px] animate-pulse">
                            <div className="flex justify-between mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-gray-100" />
                                <div className="w-16 h-6 rounded-full bg-gray-100" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-100 rounded w-3/4" />
                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                            </div>
                        </div>
                    ))
                ) : (
                    <>
                        {filtered.map((w) => (
                            <div key={w.id} className="bg-white rounded-[24px] border border-[#F0F1F5] p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                {/* Status Pill Overlay */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-[#FFEEE0] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                        <span className="text-[#ED6A2E] text-[18px] font-black uppercase">
                                            {(w.firstName?.[0] || 'A')}{(w.lastName?.[0] || '')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#F0F1F5] text-[10px] font-black ${w.isActive ? 'text-[#2ECC81]' : 'text-[#F15F5F]'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${w.isActive ? 'bg-[#2ECC81]' : 'bg-[#F15F5F]'}`} />
                                            {w.isActive ? 'Active' : 'Inactive'}
                                        </div>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setMenuWorkerId(menuWorkerId === w.id ? null : w.id)}
                                                className="p-1 text-[#8A9BB8] hover:text-[#1A2233] transition-colors rounded-lg hover:bg-gray-50"
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            {menuWorkerId === w.id && (
                                                <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-xl border border-[#F0F1F5] bg-white py-1 shadow-xl">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setEditWorker(w); setMenuWorkerId(null); }}
                                                        className="flex w-full items-center gap-2 px-3 py-2 text-[12px] font-bold text-[#5A6376] hover:bg-[#F8F9FB]"
                                                    >
                                                        <Pencil size={14} /> Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setDeleteWorker(w); setMenuWorkerId(null); }}
                                                        className="flex w-full items-center gap-2 px-3 py-2 text-[12px] font-bold text-[#E74C3C] hover:bg-red-50"
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="space-y-1 mb-6">
                                    <h3 className="text-[15px] font-black text-[#1A2233] truncate leading-tight">{w.firstName} {w.lastName}</h3>
                                    <p className="text-[11px] font-black text-[#ED6A2E] uppercase tracking-wider bg-[#FFF5F2] inline-block px-2 py-0.5 rounded-md">
                                        {w.role?.replace('_', ' ') || 'Superadmin'}
                                    </p>
                                </div>

                                <div className="space-y-2.5 mb-6">
                                    <div className="flex items-center gap-2.5 text-[12px] font-bold text-[#8A9BB8]">
                                        <Phone size={14} className="shrink-0 text-[#ED6A2E]/60" />
                                        <span className="truncate">{w.phoneNumber || 'No phone'}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-[12px] font-bold text-[#8A9BB8]">
                                        <MapPin size={14} className="shrink-0 text-[#ED6A2E]/60" />
                                        <span className="truncate text-[10px] uppercase tracking-tight">ID: {String(w.id).slice(0, 8)}...</span>
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <button
                                    type="button"
                                    onClick={() => navigate(`/workers/details/${w.id}`)}
                                    className="w-full bg-[#F5F6FA] text-[#1A2233] py-2.5 rounded-xl text-[12px] font-black hover:bg-[#ED6A2E] hover:text-white transition-all shadow-sm border border-[#F0F2F5] hover:border-[#ED6A2E]"
                                >
                                    Profile
                                </button>
                            </div>
                        ))}

                        {/* New Employee Slot */}
                        <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="bg-transparent rounded-[24px] border-2 border-dashed border-[#F0F1F5] p-5 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer hover:border-[#ED6A2E] hover:bg-white min-h-[260px] group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-[#F7F8FA] flex items-center justify-center text-[#8A9BB8] group-hover:bg-[#FFEEE0] group-hover:text-[#ED6A2E] transition-all">
                                <Plus size={24} strokeWidth={3} />
                            </div>
                            <span className="text-[13px] font-black text-[#8A9BB8] group-hover:text-[#ED6A2E] transition-all">New employee</span>
                        </button>
                    </>
                )}
            </div>

            {showCreate && <WorkerFormDialog mode="create" onClose={() => setShowCreate(false)} />}
            {editWorker && (
                <WorkerFormDialog
                    mode="edit"
                    worker={editWorker}
                    onClose={() => setEditWorker(null)}
                />
            )}
            {deleteWorker && (
                <WorkerDeleteDialog worker={deleteWorker} onClose={() => setDeleteWorker(null)} />
            )}
        </div>
    );
}

function WorkerFormDialog({
    mode,
    worker,
    onClose,
}: {
    mode: 'create' | 'edit';
    worker?: AdminModel;
    onClose: () => void;
}) {
    const [createWorker, { isLoading: creating }] = useCreateWorkerMutation();
    const [updateWorker, { isLoading: updating }] = useUpdateWorkerMutation();
    const [error, setError] = useState('');
    const toast = useToast();
    const [form, setForm] = useState({
        username: '',
        firstName: worker?.firstName ?? '',
        lastName: worker?.lastName ?? '',
        role: worker?.role || 'admin',
        phoneNumber: worker?.phoneNumber ?? '',
        password: '',
        isActive: worker?.isActive ?? true,
    });

    const isLoading = creating || updating;

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        if (!form.firstName.trim()) return;
        if (mode === 'create' && !form.password.trim()) return;

        try {
            if (mode === 'create') {
                await createWorker({
                    username: form.username.trim() || undefined,
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    role: form.role,
                    phoneNumber: form.phoneNumber.trim() || undefined,
                    password: form.password,
                    isActive: form.isActive,
                }).unwrap();
                toast.success('Employee created successfully');
            } else if (worker) {
                await updateWorker({
                    id: worker.id,
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    role: form.role,
                    phoneNumber: form.phoneNumber.trim() || undefined,
                    isActive: form.isActive,
                    password: form.password.trim() || undefined,
                }).unwrap();
                toast.success('Employee updated successfully');
            }
            onClose();
        } catch (err) {
            setError(formatApiError(err, 'Could not save employee.'));
            toast.error(formatApiError(err, 'Could not save employee.'));
        }
    };

    return (
        <ModalShell title={mode === 'create' ? 'New employee' : 'Edit employee'} onClose={onClose}>
            <form onSubmit={submit} className="space-y-4 p-5">
                {error && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700">
                        {error}
                    </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                    <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name *" className="rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]" required />
                    <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" className="rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]" />
                </div>
                {mode === 'create' && (
                    <input
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        placeholder="Username (optional — auto from phone)"
                        className="w-full rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]"
                    />
                )}
                <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} placeholder="Phone" className="w-full rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]" />
                <CustomSelect
                    value={form.role}
                    onChange={(v) => setForm({ ...form, role: v || 'admin' })}
                    options={[
                        { value: 'admin', label: 'Admin' },
                        { value: 'teacher', label: 'Teacher' },
                        { value: 'superadmin', label: 'Superadmin' },
                        { value: 'support', label: 'Support' },
                    ]}
                    placeholder="Role"
                />
                <label className="flex items-center gap-2 text-[13px] font-bold text-[#5A6376]">
                    <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                        className="rounded border-[#F0F1F5]"
                    />
                    Active
                </label>
                <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={mode === 'create' ? 'Password *' : 'New password (leave empty to keep)'}
                    className="w-full rounded-xl border border-[#F0F1F5] px-4 py-3 text-[13px] font-bold outline-none focus:border-[#ED6A2E]"
                    required={mode === 'create'}
                    minLength={mode === 'create' ? 6 : undefined}
                />
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#8A9BB8] hover:bg-gray-50">Cancel</button>
                    <button
                        type="submit"
                        disabled={isLoading || !form.firstName.trim() || (mode === 'create' && !form.password.trim())}
                        className="rounded-xl bg-[#ED6A2E] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

function WorkerDeleteDialog({ worker, onClose }: { worker: AdminModel; onClose: () => void }) {
    const [deleteWorker, { isLoading }] = useDeleteWorkerMutation();
    const [error, setError] = useState('');
    const toast = useToast();

    const submit = async () => {
        setError('');
        try {
            await deleteWorker(worker.id).unwrap();
            toast.success('Employee deleted successfully');
            onClose();
        } catch (err) {
            setError(formatApiError(err, 'Could not delete employee.'));
            toast.error(formatApiError(err, 'Could not delete employee.'));
        }
    };

    return (
        <ModalShell title="Delete employee?" onClose={onClose}>
            <div className="space-y-4 p-5">
                <p className="text-[13px] font-semibold text-[#5A6376]">
                    Remove <strong>{worker.firstName} {worker.lastName}</strong> from the team?
                </p>
                {error && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700">
                        {error}
                    </p>
                )}
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#8A9BB8] hover:bg-gray-50">Cancel</button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={isLoading}
                        className="rounded-xl bg-[#E74C3C] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
                    >
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}
