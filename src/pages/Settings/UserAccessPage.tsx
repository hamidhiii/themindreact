import { LockKeyhole, Users } from 'lucide-react';
import UtilityPage from '../../components/UtilityPage/UtilityPage';

export default function UserAccessPage() {
  return (
    <UtilityPage
      title="User Access"
      subtitle="Control employee visibility and permissions by module."
      icon={LockKeyhole}
      metrics={[
        { label: 'Users', value: 0, tone: '#ED6A2E' },
        { label: 'Modules', value: 13, tone: '#6B7FD4' },
        { label: 'Protected', value: 'On', tone: '#2ECC8A' },
      ]}
    >
      <div className="flex items-center gap-4 rounded-[16px] border border-[#F0F1F5] bg-[#F8F9FB] p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6B7FD4]/10 text-[#6B7FD4]">
          <Users size={20} />
        </div>
        <div>
          <p className="font-extrabold text-[#1A2233]">Access matrix</p>
          <p className="text-[12px] font-semibold text-[#8A9BB8]">
            Matches the Dart route group for custom role access.
          </p>
        </div>
      </div>
    </UtilityPage>
  );
}
