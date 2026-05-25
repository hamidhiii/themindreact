import { KeyRound, ShieldCheck } from 'lucide-react';
import UtilityPage from '../../components/UtilityPage/UtilityPage';

export default function RolesPage() {
  return (
    <UtilityPage
      title="Create Role"
      subtitle="Configure role-based access to CRM modules."
      icon={ShieldCheck}
      metrics={[
        { label: 'Admin', value: 'Full', tone: '#ED6A2E' },
        { label: 'Teacher', value: 'Scoped', tone: '#6B7FD4' },
        { label: 'Custom roles', value: 0, tone: '#2ECC8A' },
      ]}
    >
      <div className="grid gap-3 md:grid-cols-3">
        {['View', 'Create', 'Edit'].map((permission) => (
          <div key={permission} className="flex items-center gap-3 rounded-[16px] border border-[#F0F1F5] bg-[#F8F9FB] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ED6A2E]/10 text-[#ED6A2E]">
              <KeyRound size={17} />
            </div>
            <span className="text-[13px] font-black text-[#1A2233]">{permission}</span>
          </div>
        ))}
      </div>
    </UtilityPage>
  );
}
