import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  leftIcon?: ReactNode;
  size?: 'sm' | 'md';
}

function normalizeOptions(options: SelectOption[]): SelectOption[] {
  const seen = new Set<string>();
  return options
    .map((opt) => ({
      value: String(opt.value ?? '').trim(),
      label: String(opt.label ?? opt.value ?? '').trim(),
      icon: opt.icon,
    }))
    .filter((opt) => {
      if (!opt.value || !opt.label) return false;
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
}

export default function CustomSelect({
  value,
  onChange,
  options: rawOptions,
  placeholder = 'Select…',
  disabled = false,
  className = '',
  leftIcon,
  size = 'md',
}: CustomSelectProps) {
  const options = normalizeOptions(rawOptions);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const selected = options.find((o) => o.value === value);

  useLayoutEffect(() => {
    if (!open || !ref.current) {
      setMenuStyle(null);
      return;
    }
    const update = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuStyle({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      const menu = document.getElementById('custom-select-menu-root');
      if (menu?.contains(target)) return;
      setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const py = size === 'sm' ? 'py-2' : 'py-2.5';
  const text = size === 'sm' ? 'text-[12px]' : 'text-[13px]';

  const menu = open && menuStyle ? (
    <div
      id="custom-select-menu-root"
      className="max-h-56 overflow-y-auto rounded-xl border border-[#F0F1F5] bg-white py-1 shadow-[0_12px_40px_rgba(26,34,51,0.18)]"
      style={{
        position: 'fixed',
        top: menuStyle.top,
        left: menuStyle.left,
        width: menuStyle.width,
        zIndex: 200,
      }}
    >
      <button
        type="button"
        onClick={() => {
          onChange('');
          setOpen(false);
        }}
        className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left ${text} font-semibold transition-colors hover:bg-[#F8F9FB] ${
          !value ? 'bg-[#FFF5F0]/50 text-[#F37021]' : 'text-[#8A9BB8]'
        }`}
      >
        <span className="flex-1">{placeholder}</span>
        {!value && <Check size={14} className="shrink-0 text-[#F37021]" />}
      </button>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => {
            onChange(opt.value);
            setOpen(false);
          }}
          className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left ${text} font-semibold transition-colors hover:bg-[#F8F9FB] ${
            value === opt.value ? 'bg-[#FFF5F0]/60 text-[#F37021]' : 'text-[#1A2233]'
          }`}
        >
          {opt.icon}
          <span className="flex-1 truncate">{opt.label}</span>
          {value !== '' && value === opt.value && (
            <Check size={14} className="shrink-0 text-[#F37021]" />
          )}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] px-3.5 ${py} text-left outline-none transition-colors hover:border-[#F37021]/30 disabled:opacity-50 ${
          open ? 'border-[#F37021]/50 bg-white shadow-sm' : ''
        }`}
      >
        {leftIcon && <span className="shrink-0 text-[#8A9BB8]">{leftIcon}</span>}
        <span className={`flex min-w-0 flex-1 items-center gap-2 truncate ${text} font-semibold ${selected ? 'text-[#1A2233]' : 'text-[#8A9BB8]'}`}>
          {selected?.icon}
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={13}
          className={`shrink-0 text-[#8A9BB8] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {typeof document !== 'undefined' && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
