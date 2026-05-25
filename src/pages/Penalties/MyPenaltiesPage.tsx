import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Filter, Receipt } from 'lucide-react';
import { useGetPenaltiesQuery } from '../../store/api/penaltyApi';
import type { RootState } from '../../store/store';

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function MyPenaltiesPage() {
  const userId = useSelector((s: RootState) => {
    if (!s.auth.accessToken) return null;
    try {
      const parts = s.auth.accessToken.split('.');
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
      const decoded = JSON.parse(atob(padded));
      return decoded.user_id != null ? String(decoded.user_id) : null;
    } catch {
      return null;
    }
  });

  const { data: penalties = [], isLoading, error } = useGetPenaltiesQuery(
    userId ? { teacher: userId } : undefined,
    { skip: !userId },
  );

  const sorted = useMemo(
    () => [...penalties].sort((a, b) => (b.penaltyDate ?? '').localeCompare(a.penaltyDate ?? '')),
    [penalties],
  );

  const total = useMemo(
    () => sorted.reduce((s, p) => s + Number(p.amount || 0), 0),
    [sorted],
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#ED6A2E] to-[#FF9A6C] rounded-3xl p-6 text-white shadow-[0_8px_24px_rgba(237,106,46,0.25)]">
        <p className="text-[12px] font-bold uppercase tracking-wider opacity-90">Total penalties</p>
        <p className="text-[34px] font-black mt-1">{total.toLocaleString()} <span className="text-[18px] opacity-80">UZS</span></p>
        <p className="text-[12px] font-medium mt-1 opacity-90">{sorted.length} penalties</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-[#8A9BB8]" />
          <h2 className="text-[15px] font-extrabold text-[#1A2233]">Penalty list</h2>
        </div>
        <span className="px-3 py-1 rounded-full bg-[#F0F1F5] text-[#5A6B87] text-[11px] font-bold">
          {sorted.length} results
        </span>
      </div>

      {isLoading && (
        <div className="bg-white rounded-2xl border border-[#F0F1F5] p-8 text-center text-[#8A9BB8]">
          Loading...
        </div>
      )}
      {!!error && (
        <div className="bg-white rounded-2xl border border-[#F0F1F5] p-8 text-center text-[#E74C3C]">
          Something went wrong
        </div>
      )}
      {!isLoading && !error && sorted.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#F0F1F5] p-10 text-center">
          <Receipt size={32} className="mx-auto text-[#D8DCE5] mb-3" />
          <p className="text-[14px] font-bold text-[#1A2233]">No penalties yet</p>
          <p className="text-[12px] text-[#8A9BB8] mt-1">No penalties have been assigned to you.</p>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-[#F0F1F5] p-5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#FFE5D6] flex items-center justify-center shrink-0">
              <Receipt size={20} className="text-[#ED6A2E]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-extrabold text-[#1A2233]">{p.penaltyTypeName ?? 'Penalty'}</p>
              <p className="text-[12px] text-[#8A9BB8] font-medium mt-0.5">{formatDate(p.penaltyDate)}</p>
              {p.note && (
                <p className="text-[12px] text-[#5A6B87] mt-2 leading-snug">{p.note}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[15px] font-black text-[#ED6A2E]">
                -{Number(p.amount || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-[#8A9BB8] font-bold uppercase">UZS</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
