import { Bell, BellOff, CheckCheck } from 'lucide-react';
import {
  useGetNotificationsQuery,
  useReadAllNotificationsMutation,
  useReadNotificationMutation,
} from '../../store/api/taskApi';

function formatRelative(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} d ago`;
  return d.toLocaleDateString();
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading, error, refetch } = useGetNotificationsQuery();
  const [readAll, { isLoading: readingAll }] = useReadAllNotificationsMutation();
  const [readOne] = useReadNotificationMutation();

  const handleReadAll = async () => {
    await readAll();
    refetch();
  };

  const handleReadOne = async (id: string, isRead: boolean) => {
    if (isRead) return;
    await readOne(id);
    refetch();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold text-[#1A2233] tracking-tight inline-flex items-center gap-2">
            <Bell size={22} /> Notifications
          </h1>
          <p className="text-[13px] text-[#8A9BB8] font-bold mt-1">
            {notifications.length} notifications
            {unreadCount > 0 && <> / <span className="text-[#ED6A2E]">{unreadCount} unread</span></>}
          </p>
        </div>
        <button
          onClick={handleReadAll}
          disabled={readingAll || unreadCount === 0}
          className="px-4 py-2.5 rounded-xl bg-white border border-[#F0F1F5] text-[13px] font-bold text-[#1A2233] hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2"
        >
          <CheckCheck size={16} /> Mark all as read
        </button>
      </div>

      {isLoading && (
        <div className="bg-white rounded-2xl border border-[#F0F1F5] p-8 text-center text-[#8A9BB8]">Loading...</div>
      )}
      {!!error && (
        <div className="bg-white rounded-2xl border border-[#F0F1F5] p-8 text-center text-[#E74C3C]">Something went wrong</div>
      )}
      {!isLoading && !error && notifications.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#F0F1F5] p-10 text-center">
          <BellOff size={32} className="mx-auto text-[#D8DCE5] mb-3" />
          <p className="text-[14px] font-bold text-[#1A2233]">No notifications</p>
          <p className="text-[12px] text-[#8A9BB8] mt-1">There are no new notifications yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => handleReadOne(n.id, n.isRead)}
            className={`w-full text-left bg-white rounded-2xl border p-4 flex items-start gap-4 transition-colors ${
              n.isRead
                ? 'border-[#F0F1F5] hover:bg-[#FBFCFD]'
                : 'border-[#ED6A2E]/30 bg-[#FFF8F4] hover:bg-[#FFEEE3]'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                n.isRead ? 'bg-[#F5F6FA] text-[#8A9BB8]' : 'bg-[#FFE5D6] text-[#ED6A2E]'
              }`}
            >
              <Bell size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[14px] leading-snug ${n.isRead ? 'text-[#5A6B87] font-medium' : 'text-[#1A2233] font-bold'}`}>
                {n.message}
              </p>
              <p className="text-[11px] text-[#8A9BB8] font-medium mt-1">{formatRelative(n.createdAt)}</p>
            </div>
            {!n.isRead && (
              <span className="w-2 h-2 rounded-full bg-[#ED6A2E] mt-2 shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
