import { useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Settings as SettingsIcon,
  Trash2, X, Receipt, AlertCircle,
} from 'lucide-react';
import {
  useGetPenaltyTypesQuery,
  useGetPenaltyHistoryQuery,
  useGetPenaltyTeacherChoicesQuery,
  useCreatePenaltyTypeMutation,
  useUpdatePenaltyTypeMutation,
  useDeletePenaltyTypeMutation,
  useCreatePenaltyMutation,
  useBulkCreatePenaltyMutation,
} from '../../store/api/penaltyApi';
import type { PenaltyTypeModel } from '../../types';

const MONTHS_RU = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function dayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function AdminPenaltiesPage() {
  const [month, setMonth] = useState<Date>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const monthStr = monthKey(month);

  const { data: types = [] } = useGetPenaltyTypesQuery();
  const { data: history } = useGetPenaltyHistoryQuery({ month: monthStr });
  const { data: teacherChoices = [] } = useGetPenaltyTeacherChoicesQuery();

  const [showTypes, setShowTypes] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const totalDays = daysInMonth(month);
  const days = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => i + 1),
    [totalDays],
  );

  const teachers = history?.teachers ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold text-[#1A2233] tracking-tight">Penalties</h1>
          <p className="text-[13px] text-[#8A9BB8] font-bold mt-1">Employee penalty history by month</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTypes(true)}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#F0F1F5] text-[13px] font-bold text-[#1A2233] hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <SettingsIcon size={16} /> Penalty types
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2.5 rounded-xl bg-[#ED6A2E] text-white text-[13px] font-bold hover:bg-[#d85d27] inline-flex items-center gap-2"
          >
            <Plus size={16} /> Add penalty
          </button>
        </div>
      </div>

      {/* Month picker */}
      <div className="bg-white rounded-2xl border border-[#F0F1F5] p-4 flex items-center justify-between">
        <button
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="p-2 rounded-lg hover:bg-gray-50"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-[15px] font-extrabold text-[#1A2233]">
          {MONTHS_RU[month.getMonth()]} {month.getFullYear()}
        </span>
        <button
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="p-2 rounded-lg hover:bg-gray-50"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#F0F1F5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-[12px]">
            <thead className="bg-[#F8F9FB] text-[#8A9BB8] uppercase tracking-wider">
              <tr>
                <th className="sticky left-0 bg-[#F8F9FB] px-4 py-3 text-left font-extrabold">Employee</th>
                {days.map((d) => (
                  <th key={d} className="px-2 py-3 text-center font-extrabold w-9">{d}</th>
                ))}
                <th className="px-4 py-3 text-right font-extrabold">Total</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={days.length + 2} className="px-4 py-8 text-center text-[#8A9BB8]">
                    <Receipt size={28} className="inline mr-2 opacity-50" />
                    No data for the selected month
                  </td>
                </tr>
              ) : (
                teachers.map((t) => {
                  let total = 0;
                  return (
                    <tr key={t.id} className="border-t border-[#F0F1F5] hover:bg-[#FBFCFD]">
                      <td className="sticky left-0 bg-white px-4 py-3 font-bold text-[#1A2233]">
                        <div className="leading-tight">
                          <div>{t.name}</div>
                          <div className="text-[10px] text-[#8A9BB8] font-medium">{t.role}</div>
                        </div>
                      </td>
                      {days.map((d) => {
                        const k = dayKey(month.getFullYear(), month.getMonth(), d);
                        const entries = t.penalties[k] ?? [];
                        const dayTotal = entries.reduce((s, e) => s + Number(e.amount || 0), 0);
                        total += dayTotal;
                        return (
                          <td key={d} className="px-2 py-2 text-center">
                            {entries.length === 0 ? (
                              <span className="text-[#D8DCE5]">.</span>
                            ) : (
                              <span className="inline-block min-w-[32px] px-1.5 py-0.5 rounded-md bg-[#FFE5D6] text-[#ED6A2E] font-bold text-[10px]">
                                {dayTotal.toLocaleString()}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right font-extrabold text-[#1A2233]">
                        {total.toLocaleString()} UZS
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showTypes && (
        <PenaltyTypesDialog types={types} onClose={() => setShowTypes(false)} />
      )}
      {showAdd && (
        <AddPenaltyDialog
          types={types}
          teachers={teacherChoices}
          monthStr={monthStr}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
// ── Penalty Types Dialog ─────────────────────────────────────────────────────
function PenaltyTypesDialog({ types, onClose }: { types: PenaltyTypeModel[]; onClose: () => void }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [createType, { isLoading: creating }] = useCreatePenaltyTypeMutation();
  const [updateType] = useUpdatePenaltyTypeMutation();
  const [deleteType] = useDeletePenaltyTypeMutation();

  const handleSubmit = async () => {
    if (!name.trim() || !amount.trim()) return;
    if (editingId) {
      await updateType({ id: editingId, name: name.trim(), defaultAmount: amount.trim() });
    } else {
      await createType({ name: name.trim(), defaultAmount: amount.trim() });
    }
    setName('');
    setAmount('');
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-extrabold text-[#1A2233]">Penalty types</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-50"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <input
            className="px-3 py-2.5 rounded-xl border border-[#F0F1F5] text-[13px] focus:border-[#ED6A2E] outline-none"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="px-3 py-2.5 rounded-xl border border-[#F0F1F5] text-[13px] focus:border-[#ED6A2E] outline-none"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={creating || !name.trim() || !amount.trim()}
          className="w-full mb-4 py-2.5 rounded-xl bg-[#ED6A2E] text-white text-[13px] font-bold disabled:opacity-50"
        >
          {editingId ? 'Save' : 'Add type'}
        </button>

        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {types.length === 0 && (
            <p className="text-center py-6 text-[#8A9BB8] text-[12px]">No penalty types</p>
          )}
          {types.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#F0F1F5]">
              <div className="flex-1">
                <p className="text-[13px] font-bold text-[#1A2233]">{t.name}</p>
                <p className="text-[11px] text-[#8A9BB8]">{Number(t.defaultAmount).toLocaleString()} UZS</p>
              </div>
              <button
                onClick={() => { setEditingId(t.id); setName(t.name); setAmount(t.defaultAmount); }}
                className="text-[12px] font-bold text-[#1A2233] hover:text-[#ED6A2E]"
              >
                Edit
              </button>
              <button
                onClick={() => deleteType(t.id)}
                className="p-1.5 rounded-lg text-[#E74C3C] hover:bg-red-50"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Add Penalty Dialog ───────────────────────────────────────────────────────
function AddPenaltyDialog({
  types,
  teachers,
  monthStr,
  onClose,
}: {
  types: PenaltyTypeModel[];
  teachers: { id: string; name: string; role: string }[];
  monthStr: string;
  onClose: () => void;
}) {
  const [typeId, setTypeId] = useState<string>('');
  const [date, setDate] = useState<string>(`${monthStr}-${String(new Date().getDate()).padStart(2, '0')}`);
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [createOne, { isLoading: l1 }] = useCreatePenaltyMutation();
  const [bulkCreate, { isLoading: l2 }] = useBulkCreatePenaltyMutation();

  const submitting = l1 || l2;

  const onTypeSelected = (id: string) => {
    setTypeId(id);
    const t = types.find((x) => x.id === id);
    if (t && !amount) setAmount(t.defaultAmount);
  };

  const handleSave = async () => {
    if (!typeId || selectedTeachers.length === 0 || !amount) return;
    if (selectedTeachers.length === 1) {
      await createOne({
        teacher: selectedTeachers[0],
        penaltyType: typeId,
        amount,
        penaltyDate: date,
        note: note || undefined,
      });
    } else {
      await bulkCreate({
        penaltyType: typeId,
        penaltyDate: date,
        amount,
        note: note || undefined,
        teacherIds: selectedTeachers,
      });
    }
    onClose();
  };

  const toggleTeacher = (id: string) => {
    setSelectedTeachers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-extrabold text-[#1A2233]">New penalty</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-50"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[11px] font-bold text-[#8A9BB8] mb-1 block uppercase tracking-wider">Penalty type</label>
            <select
              value={typeId}
              onChange={(e) => onTypeSelected(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#F0F1F5] text-[13px] focus:border-[#ED6A2E] outline-none bg-white"
            >
              <option value="">Choose type</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#8A9BB8] mb-1 block uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#F0F1F5] text-[13px] focus:border-[#ED6A2E] outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[11px] font-bold text-[#8A9BB8] mb-1 block uppercase tracking-wider">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#F0F1F5] text-[13px] focus:border-[#ED6A2E] outline-none"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#8A9BB8] mb-1 block uppercase tracking-wider">Note</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#F0F1F5] text-[13px] focus:border-[#ED6A2E] outline-none"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="text-[11px] font-bold text-[#8A9BB8] mb-1 block uppercase tracking-wider">
            Employees ({selectedTeachers.length} selected)
          </label>
          <div className="border border-[#F0F1F5] rounded-xl max-h-[260px] overflow-y-auto">
            {teachers.length === 0 ? (
              <p className="text-center py-6 text-[#8A9BB8] text-[12px]">No employees</p>
            ) : (
              teachers.map((t) => (
                <label key={t.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#FBFCFD] cursor-pointer border-b border-[#F0F1F5] last:border-0">
                  <input
                    type="checkbox"
                    checked={selectedTeachers.includes(t.id)}
                    onChange={() => toggleTeacher(t.id)}
                    className="accent-[#ED6A2E]"
                  />
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#1A2233]">{t.name}</p>
                    <p className="text-[11px] text-[#8A9BB8]">{t.role}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-[#8A9BB8] hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting || !typeId || selectedTeachers.length === 0 || !amount}
            className="px-5 py-2.5 rounded-xl bg-[#ED6A2E] text-white text-[13px] font-bold disabled:opacity-50 inline-flex items-center gap-2"
          >
            {submitting ? 'Saving...' : <><AlertCircle size={15} /> Apply</>}
          </button>
        </div>
      </div>
    </div>
  );
}
