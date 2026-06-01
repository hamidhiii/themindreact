type ErrorPayload = {
  detail?: string | string[] | Record<string, unknown>;
  message?: string;
  error?: string;
  non_field_errors?: string[];
  [key: string]: unknown;
};

function flattenFieldErrors(data: Record<string, unknown>): string[] {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (key === 'detail' || key === 'message' || key === 'error') continue;
    if (Array.isArray(value)) {
      lines.push(`${key}: ${value.map(String).join(', ')}`);
    } else if (typeof value === 'string') {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines;
}

export function formatApiError(error: unknown, fallback = 'Request failed. Check branch and required fields.'): string {
  if (!error || typeof error !== 'object') return fallback;

  const err = error as { data?: unknown; status?: number | string; error?: string };
  const data = err.data;

  if (typeof data === 'string' && data.trim()) {
    const text = data.trim();
    if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('Page not found')) {
      if (err.status === 404) return 'API endpoint not found (404). Check OpenAPI docs for the correct path.';
      return fallback;
    }
    if (text.length > 280) return `${text.slice(0, 280)}…`;
    return text;
  }

  if (data && typeof data === 'object') {
    const payload = data as ErrorPayload;
    if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail;
    if (Array.isArray(payload.detail) && payload.detail.length > 0) {
      return payload.detail.map(String).join(' · ');
    }
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
    if (Array.isArray(payload.non_field_errors) && payload.non_field_errors.length > 0) {
      return payload.non_field_errors.map(String).join(' · ');
    }
    const fields = flattenFieldErrors(payload as Record<string, unknown>);
    if (fields.length > 0) return fields.join(' · ');
  }

  if (typeof err.error === 'string' && err.error.trim()) return err.error;
  if (err.status === 401) return 'Session expired. Please sign in again.';
  if (err.status === 403) return 'You do not have permission for this action.';
  if (err.status === 400) return 'Invalid data sent to the server.';
  if (err.status === 404) return 'API endpoint not found for this action.';

  return fallback;
}
