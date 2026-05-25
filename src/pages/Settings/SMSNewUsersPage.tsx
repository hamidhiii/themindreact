import { MessageCircle } from 'lucide-react';
import UtilityPage from '../../components/UtilityPage/UtilityPage';

export default function SMSNewUsersPage() {
  return (
    <UtilityPage
      title="SMS New Users"
      subtitle="Welcome campaigns for new leads and students."
      icon={MessageCircle}
      metrics={[
        { label: 'Recipients', value: 0, tone: '#ED6A2E' },
        { label: 'Queued', value: 0, tone: '#6B7FD4' },
        { label: 'Templates', value: 3, tone: '#2ECC8A' },
      ]}
    >
      <p className="text-[13px] font-semibold text-[#8A9BB8]">
        New-user SMS actions are grouped here, matching the Dart route.
      </p>
    </UtilityPage>
  );
}
