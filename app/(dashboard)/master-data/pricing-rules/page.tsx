"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Tag, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  DataTable,
  type Column,
  StatusBadge,
  ConfirmDialog,
} from "@/components/common";
import { pricingRuleApi, categoryApi } from "@/lib/api/modules/masterdata";
import { formatCurrency, formatDate } from "@/lib/utils/index";
import type { PricingRule } from "@/types/api";

const RULE_TYPES = [
  { value: "flat", label: "Flat (sekali bayar)" },
  { value: "per_day", label: "Per Hari" },
  { value: "per_hour", label: "Per Jam" },
  { value: "per_week", label: "Per Minggu" },
];

const RULE_LABELS: Record<string, string> = {
  flat: "Flat",
  per_day: "Per Hari",
  per_hour: "Per Jam",
  per_week: "Per Minggu",
};

// ---- Modal Form ----
function PricingRuleModal({
  initial,
  onClose,
}: {
  initial?: Partial<PricingRule>;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.list(),
  });

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    rule_type: initial?.rule_type ?? "per_day",
    value: String(initial?.value ?? ""),
    duration_unit: initial?.duration_unit ?? "day",
    category_id: initial?.category_id ?? "",
    asset_id: initial?.asset_id ?? "",
    min_duration: String(initial?.min_duration ?? ""),
    max_duration: String(initial?.max_duration ?? ""),
    valid_from: initial?.valid_from ?? "",
    valid_to: initial?.valid_to ?? "",
  });

  const create = useMutation({
    mutationFn: () =>
      pricingRuleApi.create({
        ...form,
        value: Number(form.value),
        min_duration: form.min_duration ? Number(form.min_duration) : undefined,
        max_duration: form.max_duration ? Number(form.max_duration) : undefined,
        category_id: form.category_id || undefined,
        asset_id: form.asset_id || undefined,
        valid_from: form.valid_from || undefined,
        valid_to: form.valid_to || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pricing-rules"] });
      toast.success("Aturan harga ditambahkan");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: () =>
      pricingRuleApi.update(initial!.id!, {
        ...form,
        value: Number(form.value),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pricing-rules"] });
      toast.success("Aturan harga diperbarui");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isPending = create.isPending || update.isPending;

  const inp =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {initial?.id ? "Edit Aturan Harga" : "Tambah Aturan Harga"}
          </h2>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            initial?.id ? update.mutate() : create.mutate();
          }}
          className="space-y-4 p-6"
        >
          {/* Name + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nama *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Tarif Harian Standard"
                className={inp}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Tipe *
              </label>
              <select
                value={form.rule_type}
                onChange={(e) =>
                  setForm({ ...form, rule_type: e.target.value })
                }
                className={inp}
              >
                {RULE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Harga (Rp) *
            </label>
            <input
              type="number"
              min={0}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              required
              placeholder="150000"
              className={inp}
            />
          </div>

          {/* Scope: Category OR Asset */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Berlaku Untuk (opsional)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Kategori
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  className={inp}
                >
                  <option value="">Semua Kategori</option>
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Asset ID (spesifik)
                </label>
                <input
                  value={form.asset_id}
                  onChange={(e) =>
                    setForm({ ...form, asset_id: e.target.value })
                  }
                  placeholder="UUID asset..."
                  className={inp}
                />
              </div>
            </div>
          </div>

          {/* Duration constraints */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Min. Durasi (hari)
              </label>
              <input
                type="number"
                min={1}
                value={form.min_duration}
                onChange={(e) =>
                  setForm({ ...form, min_duration: e.target.value })
                }
                placeholder="Kosongkan jika tidak ada"
                className={inp}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Maks. Durasi (hari)
              </label>
              <input
                type="number"
                min={1}
                value={form.max_duration}
                onChange={(e) =>
                  setForm({ ...form, max_duration: e.target.value })
                }
                placeholder="Kosongkan jika tidak ada"
                className={inp}
              />
            </div>
          </div>

          {/* Validity period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Berlaku Dari
              </label>
              <input
                type="date"
                value={form.valid_from}
                onChange={(e) =>
                  setForm({ ...form, valid_from: e.target.value })
                }
                className={inp}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Berlaku Sampai
              </label>
              <input
                type="date"
                value={form.valid_to}
                onChange={(e) => setForm({ ...form, valid_to: e.target.value })}
                className={inp}
              />
            </div>
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
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial?.id ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Page ----
export default function PricingRulesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<"create" | PricingRule | null>(null);

  const { data: rules, isLoading } = useQuery({
    queryKey: ["pricing-rules"],
    queryFn: () => pricingRuleApi.list(),
  });

  const remove = useMutation({
    mutationFn: pricingRuleApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pricing-rules"] });
      toast.success("Aturan dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<PricingRule>[] = [
    {
      key: "name",
      header: "Nama",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <Tag className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{row.name}</p>
            <p className="text-xs text-slate-400">
              {RULE_LABELS[row.rule_type] ?? row.rule_type}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "value",
      header: "Harga",
      align: "right",
      cell: (row) => (
        <span className="text-sm font-semibold text-slate-800">
          {formatCurrency(row.value)}
        </span>
      ),
    },
    {
      key: "scope",
      header: "Berlaku Untuk",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {row.asset_id
            ? "Aset spesifik"
            : row.category_id
              ? "Kategori"
              : "Semua aset"}
        </span>
      ),
    },
    {
      key: "validity",
      header: "Periode",
      cell: (row) =>
        row.valid_from && row.valid_to ? (
          <span className="text-xs text-slate-500">
            {formatDate(row.valid_from)} — {formatDate(row.valid_to)}
          </span>
        ) : (
          <StatusBadge status="active" label="Selamanya" size="sm" />
        ),
    },
    {
      key: "actions",
      header: "",
      width: "w-20",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setModal(row);
            }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ConfirmDialog
            trigger={
              <button
                onClick={(e) => e.stopPropagation()}
                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            }
            title="Hapus Aturan Harga"
            description={`Aturan "${row.name}" akan dihapus permanen.`}
            confirmLabel="Ya, Hapus"
            onConfirm={() => remove.mutateAsync(row.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Aturan Harga"
        description="Konfigurasi tarif sewa per kategori, aset, atau periode"
        breadcrumbs={[{ label: "Master Data" }, { label: "Aturan Harga" }]}
        actions={
          <button
            onClick={() => setModal("create")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Aturan
          </button>
        }
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <strong>Prioritas resolusi:</strong> Aset spesifik → Kategori → Global.
        Sistem akan mengambil aturan paling spesifik yang cocok.
      </div>

      <DataTable
        columns={columns}
        data={rules}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        emptyTitle="Belum ada aturan harga"
        emptyDescription="Tambahkan aturan harga agar sistem dapat menghitung total booking otomatis."
      />

      {modal && (
        <PricingRuleModal
          initial={modal === "create" ? undefined : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
