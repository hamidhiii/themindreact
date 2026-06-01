import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, ChevronUp, CheckSquare, ClipboardList, UserPlus, UserPlus2, Wallet,
} from 'lucide-react';
import AddTaskDialog from './dialogs/AddTaskDialog';
import AddStudentStepperDialog from './dialogs/AddStudentStepperDialog';
import AddLeadDialog from './dialogs/AddLeadDialog';
import AddPaymentDialog from './dialogs/AddPaymentDialog';

type DialogKind = 'task' | 'student' | 'lead' | 'payment' | null;

interface AddMenuProps {
    compact?: boolean;
}

const MENU_ITEMS = [
    { id: 'task', label: 'Add Task', icon: CheckSquare },
    { id: 'my-tasks', label: 'My Tasks', icon: ClipboardList },
    { id: 'student', label: 'Add Student', icon: UserPlus2 },
    { id: 'lead', label: 'Add Lead', icon: UserPlus },
    { id: 'payment', label: 'Add Payment', icon: Wallet },
] as const;

export default function AddMenu({ compact = false }: AddMenuProps) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [dialog, setDialog] = useState<DialogKind>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const handlePick = (id: string) => {
        setOpen(false);
        if (id === 'my-tasks') {
            navigate('/tasks');
            return;
        }
        setDialog(id as DialogKind);
    };

    const size = compact ? 40 : 42;
    const iconSize = compact ? 20 : 18;

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#F37021] text-white shadow-[0_4px_12px_rgba(243,112,33,0.3)] transition-all hover:bg-[#E0651A] px-4"
                style={{ height: size, minWidth: compact ? size : 92 }}
                aria-label="Add"
            >
                {open ? (
                    <ChevronUp size={iconSize} strokeWidth={2.5} />
                ) : (
                    <Plus size={iconSize} strokeWidth={2.5} />
                )}
                {!compact && (
                    <span className="text-[13px] font-black">Add</span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 z-50 min-w-[200px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-1.5">
                        {MENU_ITEMS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handlePick(item.id)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-[#F8F9FB] transition-colors group"
                                >
                                    <Icon
                                        size={16}
                                        className="text-[#8A9BB8] group-hover:text-[#ED6A2E] transition-colors"
                                    />
                                    <span className="text-[13px] font-bold text-[#1A2233]">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {dialog === 'task' && (
                <AddTaskDialog onClose={() => setDialog(null)} />
            )}
            {dialog === 'student' && (
                <AddStudentStepperDialog onClose={() => setDialog(null)} />
            )}
            {dialog === 'lead' && (
                <AddLeadDialog onClose={() => setDialog(null)} />
            )}
            {dialog === 'payment' && (
                <AddPaymentDialog onClose={() => setDialog(null)} />
            )}
        </div>
    );
}
