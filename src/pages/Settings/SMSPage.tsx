import { MessageCircle, Send } from 'lucide-react';
import UtilityPage from '../../components/UtilityPage/UtilityPage';

export default function SMSPage() {
  return (
    <UtilityPage
      title="SMS Active Users"
      subtitle="Campaigns and delivery history for active users."
      icon={MessageCircle}
      metrics={[
        { label: 'Recipients', value: 0, tone: '#ED6A2E' },
        { label: 'Sent today', value: 0, tone: '#2ECC8A' },
        { label: 'Templates', value: 3, tone: '#6B7FD4' },
      ]}
    >
      <button className="flex items-center gap-2 rounded-xl bg-[#ED6A2E] px-4 py-3 text-[13px] font-black text-white shadow-[0_6px_18px_rgba(237,106,46,0.25)]">
        <Send size={16} />
        Send message
      </button>
    </UtilityPage>
  );
}
