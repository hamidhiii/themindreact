import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Clock3,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import {
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useReadAllNotificationsMutation,
  useReadNotificationMutation,
} from '../../store/api/taskApi';
import type { TaskNotificationModel } from '../../types';

type Filter = 'all' | 'unread' | 'read';

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

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

function notificationText(n: TaskNotificationModel): string {
  return [n.title, n.message, n.taskTitle, n.type].filter(Boolean).join(' ').toLowerCase();
}

function titleFor(n: TaskNotificationModel): string {
  return n.title || n.taskTitle || (n.type ? `${n.type} notification` : 'Notification');
}

export default function NotificationsPage() {
  const {
    data: notifications = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30_000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [readAll, { isLoading: readingAll }] = useReadAllNotificationsMutation();
  const [readOne] = useReadNotificationMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const visibleNotifications = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notifications.filter((n) => {
      if (activeFilter === 'unread' && n.isRead) return false;
      if (activeFilter === 'read' && !n.isRead) return false;
      if (!q) return true;
      return notificationText(n).includes(q);
    });
  }, [activeFilter, notifications, search]);

  const handleReadAll = async () => {
    if (unreadCount === 0) return;
    await readAll().unwrap();
  };

  const handleReadOne = async (item: TaskNotificationModel) => {
    if (item.isRead || !item.id) return;
    await readOne(item.id).unwrap();
  };

  const handleDelete = async (event: MouseEvent, item: TaskNotificationModel) => {
    event.stopPropagation();
    if (!item.id) return;
    await deleteNotification(item.id).unwrap();
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, item: TaskNotificationModel) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleReadOne(item);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="inline-flex items-center gap-2 text-[24px] font-extrabold tracking-tight text-[#1A2233]">
            <Bell size={22} className="text-[#ED6A2E]" />
            Notifications
          </h1>
          <p className="mt-1 text-[13px] font-bold text-[#8A9BB8]">
            {notifications.length} total
            {unreadCount > 0 && <span className="text-[#ED6A2E]"> / {unreadCount} unread</span>}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-[260px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9BB8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notifications..."
              className="h-11 w-full rounded-xl border border-[#F0F1F5] bg-white pl-10 pr-4 text-[13px] font-bold text-[#1A2233] outline-none transition-all focus:border-[#ED6A2E]"
            />
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#F0F1F5] bg-white px-4 text-[13px] font-bold text-[#5A6376] transition-all hover:border-[#ED6A2E]/30 hover:text-[#ED6A2E]"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleReadAll}
            disabled={readingAll || unreadCount === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ED6A2E] px-4 text-[13px] font-black text-white shadow-[0_6px_18px_rgba(237,106,46,0.22)] transition-all hover:bg-[#D95B24] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        </div>
      </div>

      <div className="flex w-fit items-center gap-1 rounded-xl bg-[#F7F8FA] p-1">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            className={`rounded-lg px-5 py-2 text-[12px] font-black transition-all ${
              activeFilter === filter.value
                ? 'bg-white text-[#ED6A2E] shadow-sm'
                : 'text-[#8A9BB8] hover:text-[#1A2233]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="rounded-[20px] border border-[#F0F1F5] bg-white p-8 text-center text-[13px] font-bold text-[#8A9BB8]">
          Loading notifications...
        </div>
      )}

      {!!error && !isLoading && (
        <div className="rounded-[20px] border border-[#F0F1F5] bg-white p-8 text-center">
          <p className="text-[14px] font-black text-[#E74C3C]">Could not load notifications</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-xl bg-[#ED6A2E] px-4 py-2 text-[12px] font-black text-white"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && visibleNotifications.length === 0 && (
        <div className="rounded-[20px] border border-[#F0F1F5] bg-white p-10 text-center">
          <BellOff size={34} className="mx-auto mb-3 text-[#D8DCE5]" />
          <p className="text-[14px] font-bold text-[#1A2233]">No notifications</p>
          <p className="mt-1 text-[12px] font-semibold text-[#8A9BB8]">
            {notifications.length === 0 ? 'There are no notifications yet.' : 'No notifications match the selected filter.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {visibleNotifications.map((n) => (
          <div
            key={n.id}
            role="button"
            tabIndex={0}
            onClick={() => handleReadOne(n)}
            onKeyDown={(event) => handleCardKeyDown(event, n)}
            className={`w-full rounded-[20px] border p-4 text-left transition-all ${
              n.isRead
                ? 'border-[#F0F1F5] bg-white hover:border-[#E4E8F0]'
                : 'border-[#ED6A2E]/25 bg-[#FFF8F4] shadow-[0_4px_18px_rgba(237,106,46,0.08)] hover:border-[#ED6A2E]/45'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  n.isRead ? 'bg-[#F5F6FA] text-[#8A9BB8]' : 'bg-[#FFE5D6] text-[#ED6A2E]'
                }`}
              >
                {n.isRead ? <Check size={18} /> : <Bell size={18} />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-[14px] font-black ${n.isRead ? 'text-[#5A6376]' : 'text-[#1A2233]'}`}>
                    {titleFor(n)}
                  </p>
                  {!n.isRead && (
                    <span className="rounded-full bg-[#ED6A2E] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                      New
                    </span>
                  )}
                  {n.type && (
                    <span className="rounded-full bg-[#F5F6FA] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#8A9BB8]">
                      {n.type}
                    </span>
                  )}
                </div>
                {n.message && (
                  <p className={`mt-1 text-[13px] leading-relaxed ${n.isRead ? 'text-[#8A9BB8]' : 'text-[#5A6376]'}`}>
                    {n.message}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-bold text-[#8A9BB8]">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={13} />
                    {formatRelative(n.createdAt) || 'No date'}
                  </span>
                  {n.task && <span>Task #{n.task}</span>}
                </div>
              </div>

              <button
                type="button"
                onClick={(event) => handleDelete(event, n)}
                className="rounded-xl p-2 text-[#B8C0CF] transition-all hover:bg-red-50 hover:text-[#E74C3C]"
                aria-label="Delete notification"
                title="Delete notification"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
