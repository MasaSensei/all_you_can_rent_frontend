"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, CalendarCheck, Users, TrendingUp } from "lucide-react";
import { subDays, startOfDay, format } from "date-fns";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useDashboard } from "@/lib/hooks";
import { formatCurrency, formatNumber } from "@/lib/utils";

// ---- Date range helper ----

type Range = "7d" | "30d" | "90d";

function getRange(range: Range): {
  from: string;
  to: string;
  groupBy: "day" | "week" | "month";
} {
  const to = startOfDay(new Date());
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const from = subDays(to, days);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    groupBy: days <= 30 ? "day" : "week",
  };
}

// ---- Custom tooltip ----

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-sm">
      <p className="font-medium text-slate-700">{label}</p>
      <p className="text-blue-600 font-semibold mt-1">
        {formatCurrency(payload[0].value)}
      </p>
      <p className="text-slate-400 text-xs">
        {payload[0].payload.count} booking
      </p>
    </div>
  );
}

// ---- Page ----

export default function DashboardPage() {
  const [range, setRange] = useState<Range>("30d");
  const { from, to, groupBy } = getRange(range);

  const { data: dashboard, isLoading } = useDashboard(from, to, groupBy);

  const kpis = [
    {
      title: "Total Pendapatan",
      value: isLoading ? "—" : formatCurrency(dashboard?.total_revenue ?? 0),
      icon: DollarSign,
      variant: "primary" as const,
      trend: { value: "periode dipilih", direction: "neutral" as const },
    },
    {
      title: "Total Booking",
      value: isLoading ? "—" : formatNumber(dashboard?.total_bookings ?? 0),
      icon: CalendarCheck,
      variant: "success" as const,
      trend: { value: "booking aktif", direction: "up" as const },
    },
    {
      title: "Customer Aktif",
      value: isLoading ? "—" : formatNumber(dashboard?.active_customers ?? 0),
      icon: Users,
      variant: "default" as const,
    },
    {
      title: "Pendapatan Rata-rata",
      value: isLoading
        ? "—"
        : formatCurrency(
            dashboard && dashboard.total_bookings > 0
              ? dashboard.total_revenue / dashboard.total_bookings
              : 0,
          ),
      icon: TrendingUp,
      variant: "default" as const,
      description: "per booking",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan performa operasional"
        actions={
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
            {(["7d", "30d", "90d"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  range === r
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {r === "7d" ? "7 Hari" : r === "30d" ? "30 Hari" : "90 Hari"}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.title} {...kpi} isLoading={isLoading} />
        ))}
      </div>

      {/* Revenue Chart + Top Assets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart — 2/3 width */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Tren Pendapatan
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {format(new Date(from), "d MMM")} —{" "}
                {format(new Date(to), "d MMM yyyy")}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="h-56 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={dashboard?.revenue ?? []}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}K`
                        : String(v)
                  }
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#2563eb" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Assets — 1/3 width */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">
            Aset Paling Banyak Disewa
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                    <div className="h-2 w-20 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : !dashboard?.top_assets?.length ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Belum ada data
            </p>
          ) : (
            <div className="space-y-3">
              {dashboard.top_assets.slice(0, 6).map((asset, i) => (
                <div key={asset.asset_id} className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {asset.asset_name}
                    </p>
                    {/* Utilization bar */}
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${Math.min(asset.utilization_pct, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 tabular-nums w-9 text-right">
                        {asset.utilization_pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
