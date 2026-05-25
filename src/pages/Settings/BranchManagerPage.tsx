import { Building2, MapPin, Users } from 'lucide-react';
import UtilityPage from '../../components/UtilityPage/UtilityPage';

export default function BranchManagerPage() {
  return (
    <UtilityPage
      title="Branch Manager"
      subtitle="Branches, managers and local access settings."
      icon={Building2}
      metrics={[
        { label: 'Branches', value: 2, tone: '#ED6A2E' },
        { label: 'Managers', value: 4, tone: '#6B7FD4' },
        { label: 'Active users', value: 38, tone: '#2ECC8A' },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {['Main', 'C1'].map((branch, index) => (
          <div key={branch} className="rounded-[16px] border border-[#F0F1F5] bg-[#F8F9FB] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ED6A2E]/10 text-[#ED6A2E]">
                <MapPin size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-[#1A2233]">{branch}</p>
                <p className="text-[12px] font-semibold text-[#8A9BB8]">
                  {index === 0 ? 'Primary campus' : 'Secondary campus'}
                </p>
              </div>
              <Users size={18} className="text-[#8A9BB8]" />
            </div>
          </div>
        ))}
      </div>
    </UtilityPage>
  );
}
