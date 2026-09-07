"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, UserCog, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  DataTable,
  type Column,
  StatusBadge,
  ConfirmDialog,
} from "@/components/common";
import {
  tenantUserApi,
  roleApi,
  type TenantUser,
  type InviteUser,
} from "@/lib/api/modules/masterdata";
import { formatDate, initials } from "@/lib/utils/index";

function InviteModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: roleApi.list,
  });

  const [form, setForm] = useState<InviteUser>({
    email: "",
    first_name: "",
    last_name: "",
    role_id: "",
    password: "",
  });
  const [confirmPass, setConfirmPass] = useState("");

  const invite = useMutation({
    mutationFn: () => tenantUserApi.invite(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-users"] });
      toast.success(`Pengguna ${form.email} berhasil ditambahkan`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inp =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== confirmPass) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    invite.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Tambah Pengguna
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Tambahkan staff yang bisa mengakses dashboard ini
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nama Depan *
              </label>
              <input
                value={form.first_name}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
                required
                placeholder="Budi"
                className={inp}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nama Belakang *
              </label>
              <input
                value={form.last_name}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
                required
                placeholder="Santoso"
                className={inp}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="budi@bisnis.com"
              className={inp}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Role *
            </label>
            <select
              value={form.role_id}
              onChange={(e) => setForm({ ...form, role_id: e.target.value })}
              required
              className={inp}
            >
              <option value="">Pilih role...</option>
              {(roles ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Password *
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
                placeholder="••••••••"
                className={inp}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Konfirmasi *
              </label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                required
                placeholder="••••••••"
                className={inp}
              />
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
            Pengguna dapat login menggunakan email dan password yang ditetapkan
            di atas.
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
              disabled={invite.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {invite.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Tambah Pengguna
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["tenant-users"],
    queryFn: () => tenantUserApi.list(),
  });

  const deactivate = useMutation({
    mutationFn: tenantUserApi.deactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-users"] });
      toast.success("Pengguna dinonaktifkan");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<TenantUser>[] = [
    {
      key: "name",
      header: "Pengguna",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
            {initials(row.first_name ?? row.username, row.last_name)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">
              {row.first_name
                ? `${row.first_name} ${row.last_name ?? ""}`
                : row.username}
            </p>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Role",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-sm text-slate-600">
            {row.roles?.join(", ") ?? "—"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          status={row.is_active ? "active" : "inactive"}
          label={row.is_active ? "Aktif" : "Nonaktif"}
          size="sm"
        />
      ),
    },
    {
      key: "created_at",
      header: "Bergabung",
      cell: (row) => (
        <span className="text-sm text-slate-500">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "w-24",
      align: "right",
      cell: (row) =>
        row.is_active ? (
          <ConfirmDialog
            trigger={
              <button
                onClick={(e) => e.stopPropagation()}
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Nonaktifkan
              </button>
            }
            title="Nonaktifkan Pengguna"
            description={`${row.first_name ?? row.username} tidak akan bisa login lagi.`}
            confirmLabel="Ya, Nonaktifkan"
            onConfirm={() => deactivate.mutateAsync(row.id)}
          />
        ) : (
          <span className="text-xs text-slate-400">Nonaktif</span>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pengguna"
        description="Kelola akses staff ke dashboard"
        breadcrumbs={[{ label: "Master Data" }, { label: "Pengguna" }]}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Pengguna
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        emptyTitle="Belum ada pengguna lain"
        emptyDescription="Undang staff untuk membantu mengelola operasional bisnis Anda."
      />

      {showModal && <InviteModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
