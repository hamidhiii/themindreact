import { Megaphone, UserPlus } from 'lucide-react';
import UtilityPage from '../../components/UtilityPage/UtilityPage';

export default function MarketingLeadsPage() {
  return (
    <UtilityPage
      title="Marketing Leads"
      subtitle="Lead analytics from advertising sources."
      icon={UserPlus}
      metrics={[
        { label: 'Leads', value: 0, tone: '#ED6A2E' },
        { label: 'Sources', value: 0, tone: '#6B7FD4' },
      ]}
    >
      <div className="flex items-center gap-3 text-[13px] font-semibold text-[#8A9BB8]">
        <Megaphone size={18} className="text-[#ED6A2E]" />
        Source-based lead rows will appear here after API integration.
      </div>
    </UtilityPage>
  );
}
