import BranchSelector from './BranchSelector';
import NotificationBell from './NotificationBell';
import AddMenu from './AddMenu';
import HomeSearchBar from './HomeSearchBar';

interface TopActionsProps {
    compact?: boolean;
    showSearch?: boolean;
    showAdd?: boolean;
    className?: string;
}

export default function TopActions({
    compact = false,
    showSearch = false,
    showAdd = false,
    className,
}: TopActionsProps) {
    return (
        <div className={`flex flex-1 items-center gap-3 min-w-0 ${className ?? ''}`}>
            {showSearch && !compact && <HomeSearchBar className="flex-1 min-w-0 max-w-none" />}
            <div className="ml-auto flex shrink-0 items-center gap-2">
                <BranchSelector compact={compact} />
                <NotificationBell compact={compact} />
                {showAdd && <AddMenu compact={compact} />}
            </div>
        </div>
    );
}
