'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Shield, Pencil, Trash2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, DataTable, type Column, StatusBadge, ConfirmDialog } from '@/components/common'
import { roleApi, type Role, type Permission } from '@/lib/api/modules/masterdata'
import { formatDate } from '@/lib/utils'

// ---- Role Modal ----
function RoleModal({ initial, onClose }: { initial?: Role; onClose: () => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState(initial?.name ?? '')
  const [desc, setDesc] = useState(initial?.description ?? '')

  const create = useMutation({
    mutationFn: () => roleApi.create({ name, description: desc }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role ditambahkan'); onClose() },
    onError: (e: Error) => toast.error(e.message),
  })
  const update = useMutation({
    mutationFn: () => roleApi.update(initial!.id, { name, description: desc }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role diperbarui'); onClose() },
    onError: (e: Error) => toast.error(e.message),
  })

  const isPending = create.isPending || update.isPending
  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{initial ? 'Edit Role' : 'Tambah Role'}</h2>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); initial ? update.mutate() : create.mutate() }}
          className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Role *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              placeholder="Operator" className={inp} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Deskripsi</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Akses operasional sehari-hari" className={inp} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Batal
            </button>
            <button type="submit" disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Permission Modal ----
function PermissionModal({ role, onClose }: { role: Role; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: permissions } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: roleApi.listPermissions,
  })

  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Group by module
  const grouped = (permissions ?? []).reduce<Record<string, Permission[]>>((acc, p) => {
    const mod = p.module ?? 'other'
    if (!acc[mod]) acc[mod] = []
    acc[mod].push(p)
    return acc
  }, {})

  const assign = useMutation({
    mutationFn: () => roleApi.assignPermissions(role.id, Array.from(selected)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Permissions diperbarui'); onClose() },
    onError: (e: Error) => toast.error(e.message),
  })

  function toggleAll(perms: Permission[]) {
    const ids = perms.map((p) => p.id)
    const allSelected = ids.every((id) => selected.has(id))
    const next = new Set(selected)
    ids.forEach((id) => allSelected ? next.delete(id) : next.add(id))
    setSelected(next)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Permissions — {role.name}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Pilih aksi yang diizinkan untuk role ini
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-5">
          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {module}
                </p>
                <button type="button" onClick={() => toggleAll(perms)}
                  className="text-xs text-blue-600 hover:underline">
                  {perms.every((p) => selected.has(p.id)) ? 'Hapus semua' : 'Pilih semua'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {perms.map((perm) => (
                  <label key={perm.id} className="flex items-center gap-2 cursor-pointer rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
                    <input type="checkbox" checked={selected.has(perm.id)}
                      onChange={() => {
                        const next = new Set(selected)
                        selected.has(perm.id) ? next.delete(perm.id) : next.add(perm.id)
                        setSelected(next)
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                    <span className="text-xs font-mono text-slate-700">{perm.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 flex items-center justify-between px-6 py-4">
          <span className="text-sm text-slate-500">{selected.size} permission dipilih</span>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Batal
            </button>
            <button onClick={() => assign.mutate()} disabled={assign.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {assign.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Page ----
export default function RolesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | Role | null>(null)
  const [permModal, setPermModal] = useState<Role | null>(null)

  const { data: roles, isLoading } = useQuery({ queryKey: ['roles'], queryFn: roleApi.list })

  const remove = useMutation({
    mutationFn: roleApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role dihapus') },
    onError: (e: Error) => toast.error(e.message),
  })

  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: 'Nama Role',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
            <Shield className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-800">{row.name}</p>
              {row.is_system && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" />System
                </span>
              )}
            </div>
            {row.description && (
              <p className="text-xs text-slate-400">{row.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'created_at',
      header: 'Dibuat',
      cell: (row) => <span className="text-sm text-slate-500">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: 'w-48',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); setPermModal(row) }}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50">
            Permissions
          </button>
          {!row.is_system && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setModal(row) }}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <ConfirmDialog
                trigger={<button onClick={(e) => e.stopPropagation()}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" /></button>}
                title="Hapus Role"
                description={`Role "${row.name}" akan dihapus. User yang memakai role ini perlu di-assign ulang.`}
                confirmLabel="Ya, Hapus"
                onConfirm={() => remove.mutateAsync(row.id)}
              />
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles & Permissions"
        description="Atur hak akses setiap role dalam sistem"
        breadcrumbs={[{ label: 'Master Data' }, { label: 'Roles' }]}
        actions={
          <button onClick={() => setModal('create')}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />Tambah Role
          </button>
        }
      />

      <DataTable columns={columns} data={roles} isLoading={isLoading} rowKey={(r) => r.id}
        emptyTitle="Belum ada role custom"
        emptyDescription="Buat role baru untuk mengatur hak akses staff Anda." />

      {modal && <RoleModal initial={modal === 'create' ? undefined : modal} onClose={() => setModal(null)} />}
      {permModal && <PermissionModal role={permModal} onClose={() => setPermModal(null)} />}
    </div>
  )
}
