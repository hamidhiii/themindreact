import { Send, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UtilityPage from '../../components/UtilityPage/UtilityPage';

export default function SendTaskPage() {
  const navigate = useNavigate();

  return (
    <UtilityPage
      title="Send Task"
      subtitle="Create a task and send it to selected employees."
      icon={ClipboardList}
      metrics={[
        { label: 'Draft', value: 1, tone: '#ED6A2E' },
        { label: 'Recipients', value: 0, tone: '#6B7FD4' },
      ]}
    >
      <button
        type="button"
        onClick={() => navigate('/tasks?create=1')}
        className="flex items-center gap-2 rounded-xl bg-[#ED6A2E] px-4 py-3 text-[13px] font-black text-white shadow-[0_6px_18px_rgba(237,106,46,0.25)]"
      >
        <Send size={16} />
        Send task
      </button>
    </UtilityPage>
  );
}
