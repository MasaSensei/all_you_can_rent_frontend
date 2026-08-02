"use client";

import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  /** e.g. "+12%" or "vs bulan lalu" */
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  description?: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  isLoading?: boolean;
  className?: string;
}

const variantStyles = {
  default: { card: "bg-white", icon: "bg-slate-100 text-slate-600" },
  primary: { card: "bg-blue-600 text-white", icon: "bg-blue-500 text-white" },
  success: { card: "bg-white", icon: "bg-emerald-100 text-emerald-600" },
  warning: { card: "bg-white", icon: "bg-amber-100 text-amber-600" },
  danger: { card: "bg-white", icon: "bg-red-100 text-red-600" },
};

const trendStyles = {
  up: "text-emerald-600",
  down: "text-red-500",
  neutral: "text-slate-400",
};

const TrendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  variant = "default",
  isLoading = false,
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];
  const isPrimary = variant === "primary";

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-xl border border-slate-200 bg-white p-5",
          className,
        )}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-7 w-32 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-shadow hover:shadow-sm",
        isPrimary ? "border-blue-500" : "border-slate-200",
        styles.card,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-medium truncate",
              isPrimary ? "text-blue-100" : "text-slate-500",
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tracking-tight",
              isPrimary ? "text-white" : "text-slate-900",
            )}
          >
            {value}
          </p>

          {trend && (
            <div
              className={cn(
                "mt-2 flex items-center gap-1 text-xs font-medium",
                isPrimary ? "text-blue-100" : trendStyles[trend.direction],
              )}
            >
              {(() => {
                const TIcon = TrendIcons[trend.direction];
                return <TIcon className="h-3.5 w-3.5 shrink-0" />;
              })()}
              <span>{trend.value}</span>
            </div>
          )}

          {description && (
            <p
              className={cn(
                "mt-1 text-xs",
                isPrimary ? "text-blue-200" : "text-slate-400",
              )}
            >
              {description}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              styles.icon,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
