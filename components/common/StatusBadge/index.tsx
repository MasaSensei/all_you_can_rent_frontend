"use client";

import { cn, getStatusVariant } from "@/lib/utils";

const variantStyles = {
  default: "bg-gray-100 text-gray-700 ring-gray-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  error: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
  muted: "bg-slate-100 text-slate-500 ring-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  active: "Aktif",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  unpaid: "Belum Bayar",
  partial: "Sebagian",
  paid: "Lunas",
  voided: "Dibatalkan",
  scheduled: "Dijadwalkan",
  in_progress: "Berlangsung",
  queued: "Antrian",
  processing: "Diproses",
  failed: "Gagal",
  draft: "Draft",
  published: "Dipublikasi",
  open: "Terbuka",
  resolved: "Selesai",
  closed: "Ditutup",
  individual: "Individu",
  corporate: "Perusahaan",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  status,
  label,
  size = "md",
  className,
}: StatusBadgeProps) {
  const variant = getStatusVariant(status);
  const displayLabel = label ?? STATUS_LABELS[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-0.5 text-sm",
        variantStyles[variant],
        className,
      )}
    >
      {displayLabel}
    </span>
  );
}
