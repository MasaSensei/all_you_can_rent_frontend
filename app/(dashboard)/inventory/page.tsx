"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Box } from "lucide-react";
import { PageHeader } from "@/components/common";
import { DataTable, type Column } from "@/components/common";
import { StatusBadge } from "@/components/common";
import { FilterBar } from "@/components/common";
import { EmptyState } from "@/components/common";
import { ConfirmDialog } from "@/components/common";
import { useAssets, useDeleteAsset, useCategories } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import type { Asset } from "@/types/api";

const CONDITION_OPTIONS = [
  { label: "Baru", value: "new" },
  { label: "Bagus", value: "good" },
  { label: "Cukup", value: "fair" },
  { label: "Buruk", value: "poor" },
];

export default function InventoryPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [condition, setCondition] = useState("");

  const { data: assets, isLoading } = useAssets({
    page,
    per_page: 20,
    search: search || undefined,
    category_id: categoryId || undefined,
    condition: condition || undefined,
  });

  const { data: categories } = useCategories();
  const deleteAsset = useDeleteAsset();

  const hasFilter = !!(search || categoryId || condition);

  const columns: Column<Asset>[] = [
    {
      key: "name",
      header: "Nama Aset",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Box className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{row.name}</p>
            {row.serial_number && (
              <p className="text-xs text-slate-400">SN: {row.serial_number}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "condition",
      header: "Kondisi",
      cell: (row) => <StatusBadge status={row.condition} size="sm" />,
    },
    {
      key: "is_available",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          status={row.is_available ? "active" : "cancelled"}
          label={row.is_available ? "Tersedia" : "Tidak Tersedia"}
          size="sm"
        />
      ),
    },
    {
      key: "current_value",
      header: "Nilai Aset",
      align: "right",
      cell: (row) =>
        row.current_value ? (
          formatCurrency(row.current_value)
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "location",
      header: "Lokasi",
      cell: (row) => row.location ?? <span className="text-slate-400">—</span>,
    },
    {
      key: "actions",
      header: "",
      width: "w-28",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/inventory/${row.id}/edit`);
            }}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Edit
          </button>
          <ConfirmDialog
            trigger={
              <button
                onClick={(e) => e.stopPropagation()}
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Hapus
              </button>
            }
            title="Hapus Aset"
            description={`Aset "${row.name}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
            confirmLabel="Ya, Hapus"
            onConfirm={() => deleteAsset.mutateAsync(row.id)}
          />
        </div>
      ),
    },
  ];

  const categoryOptions = (categories ?? []).map((c) => ({
    label: c.name,
    value: c.id,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventori"
        description="Kelola semua aset yang dapat disewakan"
        breadcrumbs={[{ label: "Inventori" }]}
        actions={
          <button
            onClick={() => router.push("/inventory/new")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Aset
          </button>
        }
      />

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Cari nama atau serial number...",
        }}
        selects={[
          {
            key: "category",
            placeholder: "Semua Kategori",
            options: categoryOptions,
            value: categoryId,
            onChange: setCategoryId,
          },
          {
            key: "condition",
            placeholder: "Semua Kondisi",
            options: CONDITION_OPTIONS,
            value: condition,
            onChange: setCondition,
          },
        ]}
        hasActiveFilter={hasFilter}
        onReset={() => {
          setSearch("");
          setCategoryId("");
          setCondition("");
          setPage(1);
        }}
      />

      <DataTable
        columns={columns}
        data={assets}
        isLoading={isLoading}
        rowKey={(row) => row.id}
        page={page}
        perPage={20}
        onPageChange={setPage}
        emptyTitle="Belum ada aset"
        emptyDescription="Tambahkan aset pertama Anda untuk mulai menyewakan."
        onRowClick={(row) => router.push(`/inventory/${row.id}`)}
      />
    </div>
  );
}
