import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from './modalStyles';

interface ModalShellProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  maxWidthClass?: string;
}

export default function ModalShell({
  title,
  children,
  onClose,
  maxWidthClass = 'max-w-md',
}: ModalShellProps) {
  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={`w-full ${maxWidthClass} rounded-2xl ${MODAL_PANEL_CLASS}`}>
        <div className="flex items-center justify-between border-b border-[#F0F1F5]/80 p-5">
          <h2 className="text-[18px] font-extrabold text-[#1A2233]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8A9BB8] transition-colors hover:bg-gray-50 hover:text-[#1A2233]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
