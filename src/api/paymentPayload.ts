/** Maps UI payment method values to The Mind CRM API `method` field. */
export function toApiPaymentMethod(method: string): string {
  const normalized = method.trim().toLowerCase();
  const aliases: Record<string, string> = {
    cash: 'cash',
    card: 'card',
    transfer: 'transfer',
    online: 'online',
    bank: 'transfer',
  };
  return aliases[normalized] ?? normalized;
}

export function buildPaymentPayload(input: {
  studentId: string | number;
  amount: string | number;
  payWith: string;
  groupId?: string | number;
  date?: string;
}): Record<string, unknown> {
  const amount = typeof input.amount === 'string' ? input.amount : String(input.amount);
  const payload: Record<string, unknown> = {
    student_id: Number(input.studentId) || input.studentId,
    amount: Number(amount) || amount,
    method: toApiPaymentMethod(input.payWith),
  };
  if (input.groupId != null && input.groupId !== '') {
    payload.group_id = Number(input.groupId) || input.groupId;
  }
  if (input.date) {
    payload.date = input.date;
  }
  return payload;
}
