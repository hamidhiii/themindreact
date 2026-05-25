import { Megaphone, TrendingUp } from 'lucide-react';
import UtilityPage from '../../components/UtilityPage/UtilityPage';

export default function MarketingAnalyticsPage() {
  return (
    <UtilityPage
      title="Marketing"
      subtitle="Expense analytics and campaign performance."
      icon={Megaphone}
      metrics={[
        { label: 'Campaigns', value: 0, tone: '#ED6A2E' },
        { label: 'Leads', value: 0, tone: '#6B7FD4' },
        { label: 'Conversion', value: '0%', tone: '#2ECC8A' },
      ]}
    >
      <div className="flex items-center gap-3 text-[13px] font-semibold text-[#8A9BB8]">
        <TrendingUp size={18} className="text-[#ED6A2E]" />
        Marketing charts will fill as soon as the backend returns campaign data.
      </div>
    </UtilityPage>
  );
}
