import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { removeToast, type ToastItem } from '../../store/slices/toastSlice';

const AUTO_DISMISS_MS = 3200;

const styles: Record<ToastItem['type'], { bar: string; icon: string; Icon: typeof CheckCircle2 }> = {
  success: {
    bar: 'border-[#2ECC8A]/30 bg-white',
    icon: '#2ECC8A',
    Icon: CheckCircle2,
  },
  error: {
    bar: 'border-[#E74C3C]/30 bg-white',
    icon: '#E74C3C',
    Icon: AlertCircle,
  },
  info: {
    bar: 'border-[#4C6FFF]/30 bg-white',
    icon: '#4C6FFF',
    Icon: Info,
  },
};

function ToastItemView({ toast }: { toast: ToastItem }) {
  const dispatch = useDispatch();
  const { bar, icon, Icon } = styles[toast.type];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      dispatch(removeToast(toast.id));
    }, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [dispatch, toast.id]);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-[0_8px_30px_rgba(26,34,51,0.12)] backdrop-blur-md animate-in slide-in-from-top-2 fade-in duration-300 ${bar}`}
      role="status"
    >
      <Icon size={18} style={{ color: icon }} className="shrink-0" />
      <p className="text-[13px] font-bold text-[#1A2233]">{toast.message}</p>
      <button
        type="button"
        onClick={() => dispatch(removeToast(toast.id))}
        className="ml-1 rounded-lg p-1 text-[#8A9BB8] hover:bg-black/5 hover:text-[#1A2233]"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const items = useSelector((state: RootState) => state.toast.items);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 left-1/2 z-[200] flex w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2">
      {items.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItemView toast={toast} />
        </div>
      ))}
    </div>
  );
}
