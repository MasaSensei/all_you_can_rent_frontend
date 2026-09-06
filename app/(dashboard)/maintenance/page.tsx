"use client";

import { useState } from "react";
import { Wrench, Plus, Loader2 } from "lucide-react";
import {
  PageHeader,
  DataTable,
  type Column,
  StatusBadge,
  FilterBar,
  ConfirmDialog,
} from "@/components/common";
import { useMaintenance, useScheduleMaintenance } from "@/lib/hooks";
import type { MaintenanceRecord } from "@/types/api";
import { formatDate, formatCurrency } from "@/lib/utils/index";

const STATUS_OPTIONS = [
  { label: "Dijadwalkan", value: "scheduled" },
  { label: "Berlangsung", value: "in_progress" },
  { label: "Selesai", value: "completed" },
  { label: "Dibatalkan", value: "cancelled" },
];

const TYPE_OPTIONS = [
  { label: "Rutin", value: "routine" },
  { label: "Perbaikan", value: "repair" },
  { label: "Inspeksi", value: "inspection" },
  { label: "Darurat", value: "emergency" },
];

// ---- Schedule Modal ----
function ScheduleModal({ onClose }: { onClose: () => void }) {
  const scheduleMaintenance = useScheduleMaintenance();
  const [form, setForm] = useState({
    asset_id: "",
    maintenance_type: "routine",
    description: "",
    cost: "",
    scheduled_date: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await scheduleMaintenance.mutateAsync({
      asset_id: form.asset_id,
      maintenance_type: form.maintenance_type,
      description: form.description || undefined,
      cost: form.cost ? Number(form.cost) : undefined,
      scheduled_date: form.scheduled_date || undefined,
    });
    onClose();
  }

  const inputCls =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Jadwalkan Maintenance
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Asset ID <span className="text-red-500">*</span>
            </label>
            <input
              value={form.asset_id}
              onChange={(e) => setForm({ ...form, asset_id: e.target.value })}
              placeholder="UUID asset..."
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Tipe
            </label>
            <select
              value={form.maintenance_type}
              onChange={(e) =>
                setForm({ ...form, maintenance_type: e.target.value })
              }
              className={inputCls}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Tanggal Jadwal
            </label>
            <input
              type="datetime-local"
              value={form.scheduled_date}
              onChange={(e) =>
                setForm({ ...form, scheduled_date: e.target.value })
              }
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Estimasi Biaya (Rp)
            </label>
            <input
              type="number"
              min={0}
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              placeholder="500000"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Deskripsi
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Detail pekerjaan..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={scheduleMaintenance.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {scheduleMaintenance.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Jadwalkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Page ----
export default function MaintenancePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showModal, setShowModal] = useState(false);

  const { data: records, isLoading } = useMaintenance({
    page,
    per_page: 20,
    maintenance_status: status || undefined,
  });

  const columns: Column<MaintenanceRecord>[] = [
    {
      key: "asset_id",
      header: "Asset",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
            <Wrench className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800 font-mono">
              {row.asset_id.slice(0, 8)}...
            </p>
            <p className="text-xs text-slate-400 capitalize">
              {row.maintenance_type}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "maintenance_status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.maintenance_status} size="sm" />,
    },
    {
      key: "scheduled_date",
      header: "Dijadwalkan",
      cell: (row) =>
        row.scheduled_date ? (
          <span className="text-sm text-slate-600">
            {formatDate(row.scheduled_date)}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "completed_date",
      header: "Selesai",
      cell: (row) =>
        row.completed_date ? (
          <span className="text-sm text-slate-600">
            {formatDate(row.completed_date)}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "cost",
      header: "Biaya",
      align: "right",
      cell: (row) => (
        <span className="text-sm font-medium text-slate-700">
          {row.cost > 0 ? (
            formatCurrency(row.cost)
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </span>
      ),
    },
    {
      key: "performed_by",
      header: "Teknisi",
      cell: (row) =>
        row.performed_by ?? <span className="text-slate-400">—</span>,
    },
    {
      key: "created_at",
      header: "Dibuat",
      cell: (row) => (
        <span className="text-sm text-slate-400">
          {formatDate(row.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Maintenance"
        description="Jadwal perawatan dan perbaikan aset"
        breadcrumbs={[{ label: "Maintenance" }]}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Jadwalkan
          </button>
        }
      />

      <FilterBar
        search={{
          value: search,
          onChange: (v) => {
            setSearch(v);
            setPage(1);
          },
          placeholder: "Cari maintenance...",
        }}
        selects={[
          {
            key: "status",
            placeholder: "Semua Status",
            options: STATUS_OPTIONS,
            value: status,
            onChange: (v) => {
              setStatus(v);
              setPage(1);
            },
          },
        ]}
        hasActiveFilter={!!(search || status)}
        onReset={() => {
          setSearch("");
          setStatus("");
          setPage(1);
        }}
      />

      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        rowKey={(row) => row.id}
        page={page}
        perPage={20}
        onPageChange={setPage}
        emptyTitle="Belum ada jadwal maintenance"
        emptyDescription="Jadwalkan maintenance pertama untuk melacak perawatan aset."
      />

      {showModal && <ScheduleModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
