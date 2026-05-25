import { MessageSquare, Star } from 'lucide-react';
import UtilityPage from '../../components/UtilityPage/UtilityPage';

export default function FeedbackPage() {
  return (
    <UtilityPage
      title="Feedback"
      subtitle="Student and parent feedback overview."
      icon={MessageSquare}
      metrics={[
        { label: 'New', value: 0, tone: '#ED6A2E' },
        { label: 'Reviewed', value: 0, tone: '#2ECC8A' },
        { label: 'Rating', value: '5.0', tone: '#F39C12' },
      ]}
    >
      <div className="flex items-center gap-4 rounded-[16px] border border-[#F0F1F5] bg-[#F8F9FB] p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F39C12]/10 text-[#F39C12]">
          <Star size={20} />
        </div>
        <div>
          <p className="font-extrabold text-[#1A2233]">No feedback yet</p>
          <p className="text-[12px] font-semibold text-[#8A9BB8]">
            New feedback will appear here in the same compact style as the Dart app.
          </p>
        </div>
      </div>
    </UtilityPage>
  );
}
