function escapeCsvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function downloadCsv(
  filename: string,
  rows: Array<Record<string, unknown>>,
  headers?: string[]
) {
  const resolvedHeaders = headers ?? Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const body = [
    resolvedHeaders.join(','),
    ...rows.map((row) => resolvedHeaders.map((header) => escapeCsvCell(row[header])).join(',')),
  ].join('\n');

  const blob = new Blob([body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
