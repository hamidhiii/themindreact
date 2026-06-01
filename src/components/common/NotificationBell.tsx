import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useGetUnreadNotificationCountQuery } from '../../store/api/taskApi';

interface NotificationBellProps {
    compact?: boolean;
    redirectTo?: string;
}

export default function NotificationBell({
    compact = false,
    redirectTo = '/notifications',
}: NotificationBellProps) {
    const navigate = useNavigate();
    const { data: unread = 0 } = useGetUnreadNotificationCountQuery(undefined, {
        pollingInterval: 30_000,
        refetchOnFocus: true,
        refetchOnReconnect: true,
    });

    const size = compact ? 40 : 42;
    const iconSize = compact ? 20 : 18;

    return (
        <button
            type="button"
            onClick={() => navigate(redirectTo)}
            className="group relative flex shrink-0 items-center justify-center rounded-xl border border-gray-200/40 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-150 hover:border-[#ED6A2E]/30 hover:bg-[#ED6A2E]/[0.08]"
            style={{ width: size, height: size }}
            aria-label={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
            title={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
        >
            <Bell
                size={iconSize}
                className="text-[#8A94A6] transition-colors group-hover:text-[#ED6A2E]"
            />
            {unread > 0 && (
                <span
                    className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-[10px] border-[1.5px] border-white bg-[#ED6A2E] px-1.5 text-[10px] font-extrabold leading-none text-white"
                    style={{ lineHeight: '1.1' }}
                >
                    {unread > 99 ? '99+' : unread}
                </span>
            )}
        </button>
    );
}
