/** Uzbekistan mobile: +998 + 9 national digits (API stores E.164). */
export const UZBEK_PHONE_PREFIX = '+998';
export const UZBEK_PHONE_NATIONAL_LENGTH = 9;

/** Extract up to 9 subscriber digits from any pasted/typed value. */
export function nationalDigitsFromAny(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    return digits.slice(3, 3 + UZBEK_PHONE_NATIONAL_LENGTH);
  }
  return digits.slice(0, UZBEK_PHONE_NATIONAL_LENGTH);
}

export function isUzbekPhoneComplete(nationalDigits: string): boolean {
  return nationalDigits.length === UZBEK_PHONE_NATIONAL_LENGTH;
}

/** Display in input: `90 123 45 67` (prefix +998 is shown separately). */
export function formatNationalDisplay(nationalDigits: string): string {
  const d = nationalDigits.slice(0, UZBEK_PHONE_NATIONAL_LENGTH);
  const parts: string[] = [];
  if (d.length > 0) parts.push(d.slice(0, 2));
  if (d.length > 2) parts.push(d.slice(2, 5));
  if (d.length > 5) parts.push(d.slice(5, 7));
  if (d.length > 7) parts.push(d.slice(7, 9));
  return parts.join(' ');
}

/** Send to API: `+998901234567` */
export function formatUzbekPhoneForApi(nationalDigits: string): string {
  const d = nationalDigits.slice(0, UZBEK_PHONE_NATIONAL_LENGTH);
  if (!d) return '';
  return `${UZBEK_PHONE_PREFIX}${d}`;
}

/** Initialize national digits when editing an existing lead/student. */
export function nationalDigitsFromStoredPhone(phone?: string): string {
  if (!phone?.trim()) return '';
  return nationalDigitsFromAny(phone);
}
