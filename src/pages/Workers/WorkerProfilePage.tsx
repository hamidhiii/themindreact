import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { BadgeDollarSign, Briefcase, CalendarDays, UserRound } from 'lucide-react';
import { useGetWorkerFinanceQuery, useGetWorkersQuery } from '../../store/api/workerApi';

function money(value: number | undefined) {
  return `${Number(value ?? 0).toLocaleString()} UZS`;
}

export default function WorkerProfilePage() {
  const { workerId = '' } = useParams();
  const { data: workers = [] } = useGetWorkersQuery();
  const { data: finance, isLoading } = useGetWorkerFinanceQuery(workerId, {
    skip: !workerId,
  });

  const worker = useMemo(
    () => workers.find((item) => item.id === workerId),
    [workers, workerId],
  );

  const fullName = worker
    ? `${worker.firstName} ${worker.lastName}`.trim() || 'Employee'
    : finance?.fullName || 'Employee';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-[22px] border border-[#E7EAF1] bg-white p-6 shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[26px] font-black text-[#1A2233]">
              {fullName}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-[10px] border border-[#2ECC8A]/20 bg-[#2ECC8A]/10 px-3 py-2 text-[12px] font-bold text-[#2ECC8A]">
                <span className="h-2 w-2 rounded-full bg-[#2ECC8A]" />
                {worker?.isActive ?? true ? 'Active' : 'Inactive'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-[10px] border border-[#ED6A2E]/20 bg-[#ED6A2E]/10 px-3 py-2 text-[12px] font-bold text-[#ED6A2E]">
                <Briefcase size={15} />
                {worker?.roleDisplay || worker?.role || 'Worker'}
              </span>
            </div>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#ED6A2E]/10 text-[#ED6A2E]">
            <UserRound size={26} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#ED6A2E]/20 border-t-[#ED6A2E]" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Current balance', value: money(finance?.currentBalance), icon: BadgeDollarSign, color: '#ED6A2E' },
            { label: 'Salary', value: money(finance?.salary), icon: Briefcase, color: '#6B7FD4' },
            { label: 'Bonus', value: money(finance?.bonus), icon: BadgeDollarSign, color: '#2ECC8A' },
            { label: 'Next payment', value: finance?.nextPaymentDate || '-', icon: CalendarDays, color: '#F39C12' },
          ].map((item) => (
            <div key={item.label} className="rounded-[18px] border border-[#F0F1F5] bg-white p-5 shadow-[0_2px_12px_rgba(26,34,51,0.04)]">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#8A9BB8]">
                  {item.label}
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ color: item.color, backgroundColor: `${item.color}1A` }}>
                  <item.icon size={18} />
                </div>
              </div>
              <p className="text-[20px] font-black text-[#1A2233]">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
