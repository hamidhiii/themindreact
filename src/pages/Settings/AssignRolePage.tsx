import { ShieldCheck, UserCog } from 'lucide-react';
import UtilityPage from '../../components/UtilityPage/UtilityPage';

export default function AssignRolePage() {
  return (
    <UtilityPage
      title="Assign Role"
      subtitle="Attach configured roles to employees."
      icon={UserCog}
      metrics={[
        { label: 'Roles', value: 0, tone: '#ED6A2E' },
        { label: 'Employees', value: 0, tone: '#6B7FD4' },
      ]}
    >
      <div className="flex items-center gap-3 text-[13px] font-semibold text-[#8A9BB8]">
        <ShieldCheck size={18} className="text-[#ED6A2E]" />
        Role assignments will use the same permission model as the Dart app.
      </div>
    </UtilityPage>
  );
}
