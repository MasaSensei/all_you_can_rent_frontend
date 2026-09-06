import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ---- Tailwind class merger ----
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Currency ----
export function formatCurrency(amount: number, currency = "IDR"): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ---- Date ----
export function formatDate(
  iso: string | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("id-ID", opts).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  // Same month — "1 – 7 Jan 2025"
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()} – ${formatDate(end, { dateStyle: "medium" })}`;
  }
  return `${formatDate(start, { dateStyle: "medium" })} – ${formatDate(end, { dateStyle: "medium" })}`;
}

/** Relative time: "2 jam lalu", "3 hari lalu", "baru saja" */
export function formatRelative(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });

  if (abs < 60_000) return "baru saja";
  if (abs < 3_600_000) return rtf.format(-Math.floor(diff / 60_000), "minute");
  if (abs < 86_400_000)
    return rtf.format(-Math.floor(diff / 3_600_000), "hour");
  if (abs < 7 * 86_400_000)
    return rtf.format(-Math.floor(diff / 86_400_000), "day");
  if (abs < 30 * 86_400_000)
    return rtf.format(-Math.floor(diff / (7 * 86_400_000)), "week");
  return formatDate(iso);
}

// ---- Initials ----
/**
 * initials('Budi', 'Santoso') → 'BS'
 * initials('PT Maju Jaya')    → 'PM'
 * initials('budi@mail.com')   → 'B'
 */
export function initials(
  firstName?: string | null,
  lastName?: string | null,
): string {
  if (!firstName) return "?";
  const first = firstName.trim();
  const last = (lastName ?? "").trim();

  if (last) return `${first[0]}${last[0]}`.toUpperCase();

  // Try splitting on whitespace
  const parts = first.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();

  return first.slice(0, 2).toUpperCase();
}

// ---- Status → badge variant ----
export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

const STATUS_MAP: Record<string, BadgeVariant> = {
  // Generic
  active: "success",
  inactive: "muted",
  enabled: "success",
  disabled: "muted",
  pending: "warning",
  suspended: "danger",
  cancelled: "danger",
  canceled: "danger",
  draft: "muted",
  archived: "muted",
  // Booking
  confirmed: "info",
  completed: "success",
  in_progress: "info",
  // Finance
  paid: "success",
  overdue: "danger",
  sent: "info",
  void: "muted",
  partial: "warning",
  // Subscription
  trial: "warning",
  expired: "danger",
  past_due: "danger",
  // Maintenance
  scheduled: "info",
  done: "success",
  // Users / tenants
  revoked: "danger",
};

export function getStatusVariant(status: string): BadgeVariant {
  return STATUS_MAP[status?.toLowerCase()] ?? "default";
}

// ---- Number ----
export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

/** 1500000 → "1,5 jt" */
export function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} rb`;
  return String(n);
}

// ---- String ----
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---- Duration ----
/** Hitung jumlah hari antara dua tanggal (inklusif) */
export function daysBetween(start: string | Date, end: string | Date): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

// ---- File size ----
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---- Color (untuk chart/avatar) ----
const PALETTE = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#f97316",
  "#84cc16",
];
export function colorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
