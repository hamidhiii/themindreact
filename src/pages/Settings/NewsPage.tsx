import { Newspaper } from 'lucide-react';
import UtilityPage from '../../components/UtilityPage/UtilityPage';

export default function NewsPage() {
  return (
    <UtilityPage
      title="News"
      subtitle="Announcements and center updates."
      icon={Newspaper}
      metrics={[
        { label: 'Published', value: 0, tone: '#ED6A2E' },
        { label: 'Drafts', value: 0, tone: '#6B7FD4' },
      ]}
    >
      <p className="text-[13px] font-semibold text-[#8A9BB8]">
        News cards will appear here after they are returned by the API.
      </p>
    </UtilityPage>
  );
}
