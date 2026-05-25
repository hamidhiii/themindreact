import { useGetBooksAnalyticsQuery } from '../../../store/api/dashboardApi';
import { BookOpen, BookCheck, BookMarked, AlertTriangle } from 'lucide-react';

const ICONS: Record<string, { icon: typeof BookOpen; color: string }> = {
  total: { icon: BookOpen, color: '#4C6FFF' },
  issued: { icon: BookCheck, color: '#F39C12' },
  returned: { icon: BookMarked, color: '#2ECC81' },
  overdue: { icon: AlertTriangle, color: '#E74C3C' },
};

export default function HomeBooksSection() {
  const { data, isLoading } = useGetBooksAnalyticsQuery();

  const baseCards = data
    ? [
        { type: 'total', label: 'Total', value: data.totalBooks },
        { type: 'issued', label: 'Issued', value: data.issuedBooks },
        { type: 'returned', label: 'Returned', value: data.returnedBooks },
        { type: 'overdue', label: 'Overdue', value: data.overdueBooks },
      ]
    : [];

  const cards = data && data.cards.length > 0 ? data.cards : baseCards;

  return (
    <div className="bg-white rounded-2xl border border-[#F0F1F5] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4C6FFF]/15 flex items-center justify-center">
            <BookOpen size={20} className="text-[#4C6FFF]" />
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold text-[#1A2233]">{data?.title ?? 'Books'}</h3>
            <p className="text-[11px] text-[#8A9BB8] font-medium">{data?.subtitle || 'Library analytics'}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-[#8A9BB8] text-[12px]">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c) => {
            const meta = ICONS[c.type] ?? ICONS.total;
            const Icon = meta.icon;
            return (
              <div key={c.type + c.label} className="rounded-xl border border-[#F0F1F5] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${meta.color}1A` }}
                  >
                    <Icon size={14} style={{ color: meta.color }} />
                  </div>
                </div>
                <p className="text-[20px] font-black text-[#1A2233] leading-none">{Number(c.value).toLocaleString()}</p>
                <p className="text-[11px] text-[#8A9BB8] font-bold mt-1">{c.label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
