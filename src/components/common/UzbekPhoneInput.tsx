import type { LucideIcon } from 'lucide-react';
import {
  formatNationalDisplay,
  nationalDigitsFromAny,
  UZBEK_PHONE_NATIONAL_LENGTH,
  UZBEK_PHONE_PREFIX,
} from '../../utils/uzbekPhone';

interface UzbekPhoneInputProps {
  value: string;
  onChange: (nationalDigits: string) => void;
  icon?: LucideIcon;
  iconColor?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export default function UzbekPhoneInput({
  value,
  onChange,
  icon: Icon,
  iconColor = '#8A9BB8',
  placeholder = '90 123 45 67',
  className = '',
  autoFocus,
}: UzbekPhoneInputProps) {
  const display = formatNationalDisplay(value);

  const handleChange = (raw: string) => {
    onChange(nationalDigitsFromAny(raw));
  };

  return (
    <div
      className={`flex items-center rounded-xl border border-[#F0F1F5] bg-[#F8F9FB] overflow-hidden focus-within:border-[#ED6A2E]/50 focus-within:bg-white transition-colors ${className}`}
    >
      {Icon && (
        <span className="pl-3.5 shrink-0 text-[#8A9BB8]">
          <Icon size={16} style={{ color: iconColor }} />
        </span>
      )}
      <span
        className={`shrink-0 text-[13px] font-extrabold text-[#1A2233] select-none ${Icon ? 'pl-2' : 'pl-3.5'}`}
        aria-hidden
      >
        {UZBEK_PHONE_PREFIX}
      </span>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        autoFocus={autoFocus}
        value={display}
        placeholder={placeholder}
        maxLength={UZBEK_PHONE_NATIONAL_LENGTH + 3}
        onChange={(e) => handleChange(e.target.value)}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text');
          handleChange(text);
        }}
        onKeyDown={(e) => {
          if (e.key.length === 1 && !/\d/.test(e.key)) {
            e.preventDefault();
          }
        }}
        className="min-w-0 flex-1 bg-transparent py-3 pr-3.5 text-[13px] font-bold text-[#1A2233] placeholder-[#8A9BB8] outline-none"
        aria-label="Phone number"
      />
    </div>
  );
}
