export type ApiRequest = {
  url: string;
  method?: string;
  data?: unknown;
  params?: unknown;
};

export type ApiQueryResult<T = unknown> = { data: T } | { error: unknown };

type BaseQueryLike = (arg: ApiRequest) => Promise<unknown> | unknown;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function unwrapDataMap(raw: unknown): Record<string, unknown> {
  if (!isRecord(raw)) return {};
  const nested = raw['data'];
  if (isRecord(nested)) return nested;
  return raw;
}

/** Pick created/updated entity from common API response wrappers. */
export function unwrapEntity(raw: unknown, keys: string[] = ['student', 'lead', 'group', 'book', 'task', 'room', 'item', 'result']): Record<string, unknown> {
  const map = unwrapDataMap(raw);
  for (const key of keys) {
    const nested = map[key];
    if (isRecord(nested)) return nested;
  }
  return map;
}

export function extractMapList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter(isRecord);
  }

  if (isRecord(raw)) {
    for (const key of ['results', 'items', 'data', 'students', 'leads', 'groups', 'teachers', 'workers', 'rooms', 'transactions']) {
      const nested = raw[key];
      if (Array.isArray(nested)) return nested.filter(isRecord);
      if (isRecord(nested)) {
        const nestedList = extractMapList(nested);
        if (nestedList.length > 0) return nestedList;
      }
    }
  }

  return [];
}

export function extractListByKeys(raw: unknown, keys: string[]): Record<string, unknown>[] {
  const map = unwrapDataMap(raw);
  for (const key of keys) {
    const list = extractMapList(map[key]);
    if (list.length > 0 || Array.isArray(map[key])) return list;
  }
  return extractMapList(raw);
}

export function isFallbackStatus(error: unknown): boolean {
  if (!isRecord(error)) return false;
  const rawStatus = error['status'];
  const status = typeof rawStatus === 'string' ? Number(rawStatus) : rawStatus;
  return status === 404 || status === 405 || status === 410;
}

export async function requestWithFallbacks(
  baseQuery: BaseQueryLike,
  requests: ApiRequest[]
): Promise<ApiQueryResult> {
  let lastError: unknown;

  for (const request of requests) {
    const result = await baseQuery(request) as { data?: unknown; error?: unknown };
    if (!('error' in result) || result.error == null) {
      return { data: result.data };
    }

    lastError = result.error;
    if (!isFallbackStatus(result.error)) break;
  }

  return { error: lastError };
}

export async function dataWithFallbacks<T>(
  baseQuery: BaseQueryLike,
  requests: ApiRequest[],
  parse: (raw: unknown) => T
): Promise<any> {
  const result = await requestWithFallbacks(baseQuery, requests);
  if ('error' in result) {
    return { error: result.error as any };
  }
  return { data: parse(result.data) };
}
