import { format, isPast, isToday } from "date-fns";

export function formatDueDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  return format(d, "MMM d");
}

/** Overdue = strictly before today (today is not overdue). */
export function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return isPast(d) && !isToday(d);
}

export function formatTimestamp(iso: string): string {
  return format(new Date(iso), "MMM d, h:mm a");
}
