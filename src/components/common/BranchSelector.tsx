import { useEffect, useRef, useState } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useGetBranchesQuery } from '../../store/api/settingsApi';
import { getSelectedBranchId, getSelectedBranchName, selectBranch, subscribeBranch } from '../../utils/branchContext';

interface Branch {
    id: string | number;
    name: string;
}

export default function BranchSelector({ compact = false }: { compact?: boolean }) {
    const { data: branches = [] } = useGetBranchesQuery();
    const [open, setOpen] = useState(false);
    const [, force] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => subscribeBranch(() => force((n) => n + 1)), []);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    useEffect(() => {
        if (branches.length === 0 || getSelectedBranchId()) return;
        const first = branches[0] as Record<string, unknown>;
        const id = String(first['id'] ?? first['branch_id'] ?? '1');
        const name = String(first['name'] ?? first['title'] ?? 'Main');
        selectBranch(id, name);
    }, [branches]);

    const selectedId = getSelectedBranchId();
    const selectedName = getSelectedBranchName() ?? 'Main';
    const items: Branch[] = branches.map((b) => {
        const o = b as Record<string, unknown>;
        return {
            id: String(o['id'] ?? o['branch_id'] ?? ''),
            name: String(o['name'] ?? o['title'] ?? 'Branch'),
        };
    });

    const handleSelect = (b: Branch) => {
        selectBranch(b.id, b.name);
        setOpen(false);
        window.location.reload();
    };

    if (compact) {
        return (
            <div ref={ref} className="relative">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200/50 bg-white text-[#8A94A6] transition-colors hover:bg-[#ED6A2E]/5 hover:text-[#ED6A2E]"
                    aria-label="Branch"
                >
                    <Building2 size={18} />
                </button>
                {open && items.length > 0 && (
                    <div className="absolute right-0 top-12 z-50 min-w-[200px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                        {items.map((b) => (
                            <button
                                key={String(b.id)}
                                type="button"
                                onClick={() => handleSelect(b)}
                                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-semibold transition-colors hover:bg-[#F5F6FA] ${String(b.id) === selectedId ? 'text-[#ED6A2E]' : 'text-[#1A2233]'}`}
                            >
                                <span>{b.name}</span>
                                {String(b.id) === selectedId && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex h-10 items-center gap-2 rounded-xl border border-gray-200/60 bg-white px-3 text-[13px] font-bold text-[#1A2233] transition-colors hover:border-[#ED6A2E]/40 hover:bg-[#ED6A2E]/5"
            >
                <Building2 size={16} className="text-[#ED6A2E]" />
                <span className="max-w-[120px] truncate">{selectedName}</span>
                <ChevronDown size={14} className="text-[#8A9BB8]" />
            </button>
            {open && items.length > 0 && (
                <div className="absolute right-0 top-12 z-50 min-w-[220px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                    <div className="border-b border-gray-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#8A9BB8]">
                        Branch
                    </div>
                    {items.map((b) => (
                        <button
                            key={String(b.id)}
                            type="button"
                            onClick={() => handleSelect(b)}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-semibold transition-colors hover:bg-[#F5F6FA] ${String(b.id) === selectedId ? 'text-[#ED6A2E]' : 'text-[#1A2233]'}`}
                        >
                            <span className="truncate">{b.name}</span>
                            {String(b.id) === selectedId && <Check size={14} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
