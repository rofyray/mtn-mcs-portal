export const REJECTION_EXPIRY_DAYS = 30;
export const REJECTION_REMINDER_DAYS = [7, 14, 25];

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
