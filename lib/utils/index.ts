import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ---- Tailwind classname merger ----

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Currency ----

export function formatCurrency(
  amount: number,
  currency = "IDR",
  locale = "id-ID",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

// ---- Dates ----

export function formatDate(date: string | Date, fmt = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: localeId });
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "dd MMM yyyy, HH:mm");
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: localeId });
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} — ${formatDate(end)}`;
}

// ---- Status colors ----

type StatusVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "muted";

const STATUS_MAP: Record<string, StatusVariant> = {
  // Booking
  pending: "warning",
  confirmed: "info",
  active: "success",
  completed: "muted",
  cancelled: "error",
  // Payment / Invoice
  unpaid: "error",
  partial: "warning",
  paid: "success",
  voided: "muted",
  // Maintenance
  scheduled: "info",
  in_progress: "warning",
  // Report
  queued: "muted",
  processing: "warning",
  failed: "error",
  // Generic
  active: "success",
  inactive: "muted",
  deleted: "error",
  draft: "muted",
  published: "success",
  open: "warning",
  resolved: "success",
  closed: "muted",
};

export function getStatusVariant(status: string): StatusVariant {
  return STATUS_MAP[status] ?? "default";
}

// ---- Misc ----

export function truncate(str: string, maxLen = 40): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

export function initials(firstName: string, lastName?: string): string {
  const f = firstName.charAt(0).toUpperCase();
  const l = (lastName ?? "").charAt(0).toUpperCase();
  return l ? `${f}${l}` : f;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function buildQueryString(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      q.set(k, String(v));
    }
  }
  return q.toString();
}
