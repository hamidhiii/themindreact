import { MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import UtilityPage from '../../components/UtilityPage/UtilityPage';
import { useSendRemindersMutation } from '../../store/api/dashboardApi';

export default function SMSPage() {
  const [sendReminders, { isLoading }] = useSendRemindersMutation();
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    try {
      await sendReminders({ audience: 'active' }).unwrap();
      setMessage('Messages sent');
    } catch {
      setMessage('Could not send messages');
    }
  };

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
      <button
        type="button"
        onClick={handleSend}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-xl bg-[#ED6A2E] px-4 py-3 text-[13px] font-black text-white shadow-[0_6px_18px_rgba(237,106,46,0.25)] disabled:opacity-50"
      >
        <Send size={16} />
        {isLoading ? 'Sending...' : 'Send message'}
      </button>
      {message && <p className="mt-3 text-[12px] font-bold text-[#8A9BB8]">{message}</p>}
    </UtilityPage>
  );
}
