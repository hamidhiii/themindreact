import { useGetSalesFunnelQuery } from '../../../store/api/dashboardApi';
import { Filter, Users, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';

const STAGES = [
  { key: 'requests', label: 'Requests', icon: Users, color: '#4C6FFF' },
  { key: 'trialArrived', label: 'Trial arrived', icon: CheckCircle, color: '#9B59B6' },
  { key: 'trialLeft', label: 'Trial left', icon: TrendingUp, color: '#F39C12' },
  { key: 'paid', label: 'Paid', icon: DollarSign, color: '#2ECC81' },
] as const;

export default function HomeSalesFunnel() {
  const { data, isLoading } = useGetSalesFunnelQuery();

  const max = data
    ? Math.max(data.requests, data.trialArrived, data.trialLeft, data.paid, 1)
    : 1;

  return (
    <div className="bg-white rounded-2xl border border-[#F0F1F5] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#9B59B6]/15 flex items-center justify-center">
            <Filter size={20} className="text-[#9B59B6]" />
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold text-[#1A2233]">Sales Funnel</h3>
            <p className="text-[11px] text-[#8A9BB8] font-medium">
              Conversion: <b className="text-[#2ECC81]">{(data?.conversion ?? 0).toFixed(1)}%</b>
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[180px] flex items-center justify-center text-[#8A9BB8] text-[12px]">Loading...</div>
      ) : (
        <div className="space-y-3">
          {STAGES.map((s) => {
            const value = data ? (data[s.key] as number) : 0;
            const pct = (value / max) * 100;
            return (
              <div key={s.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <s.icon size={14} style={{ color: s.color }} />
                    <span className="text-[12px] font-bold text-[#5A6B87]">{s.label}</span>
                  </div>
                  <span className="text-[13px] font-extrabold text-[#1A2233]">{value}</span>
                </div>
                <div className="h-2 bg-[#F5F6FA] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
