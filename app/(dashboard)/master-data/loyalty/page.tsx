'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Gift, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, DataTable, type Column, StatusBadge, ConfirmDialog } from '@/components/common'
import { loyaltyApi, type LoyaltyProgram } from '@/lib/api/modules/masterdata'
import { formatCurrency, formatDate } from '@/lib/utils'

function LoyaltyModal({
  initial,
  onClose,
}: {
  initial?: LoyaltyProgram
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name:                initial?.name                ?? '',
    description:         initial?.description         ?? '',
    points_per_currency: String(initial?.points_per_currency ?? '0.001'),
    redemption_rate:     String(initial?.redemption_rate     ?? '1000'),
  })

  const create = useMutation({
    mutationFn: () => loyaltyApi.create({
      name: form.name,
      description: form.description || undefined,
      points_per_currency: Number(form.points_per_currency),
      redemption_rate:     Number(form.redemption_rate),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty-programs'] })
      toast.success('Program loyalti ditambahkan')
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const update = useMutation({
    mutationFn: () => loyaltyApi.update(initial!.id, {
      name: form.name,
      description: form.description,
      points_per_currency: Number(form.points_per_currency),
      redemption_rate:     Number(form.redemption_rate),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty-programs'] })
      toast.success('Program loyalti diperbarui')
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const isPending = create.isPending || update.isPending
  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  // Preview calculation
  const ppc  = Number(form.points_per_currency) || 0
  const rate = Number(form.redemption_rate)      || 0
  const exampleSpend  = 1_000_000
  const examplePoints = exampleSpend * ppc
  const exampleValue  = examplePoints * rate

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {initial ? 'Edit Program Loyalti' : 'Tambah Program Loyalti'}
          </h2>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); initial ? update.mutate() : create.mutate() }}
          className="space-y-4 p-6"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Program *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              required placeholder="RentOS Points" className={inp} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Deskripsi</label>
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} placeholder="Kumpulkan poin setiap transaksi..."
              className={`${inp} resize-none`} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Konfigurasi Poin
            </p>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Poin per Rp 1 *
              </label>
              <input type="number" min={0} step="0.0001" value={form.points_per_currency}
                onChange={(e) => setForm({ ...form, points_per_currency: e.target.value })}
                required placeholder="0.001" className={inp} />
              <p className="mt-1 text-xs text-slate-400">
                Contoh: 0.001 = 1 poin per Rp 1.000 belanja
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nilai Tukar per Poin (Rp) *
              </label>
              <input type="number" min={0} step="1" value={form.redemption_rate}
                onChange={(e) => setForm({ ...form, redemption_rate: e.target.value })}
                required placeholder="1000" className={inp} />
              <p className="mt-1 text-xs text-slate-400">
                Contoh: 1000 = 1 poin = Rp 1.000 diskon
              </p>
            </div>
          </div>

          {/* Preview */}
          {ppc > 0 && rate > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-emerald-700 mb-2">Simulasi</p>
              <div className="space-y-1 text-sm text-emerald-800">
                <div className="flex justify-between">
                  <span>Belanja {formatCurrency(exampleSpend)}</span>
                  <span className="font-medium">= {examplePoints.toFixed(0)} poin</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Nilai {examplePoints.toFixed(0)} poin</span>
                  <span>= {formatCurrency(exampleValue)} diskon</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Batal
            </button>
            <button type="submit" disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial ? 'Simpan' : 'Buat Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoyaltyPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | LoyaltyProgram | null>(null)

  const { data: programs, isLoading } = useQuery({
    queryKey: ['loyalty-programs'],
    queryFn: loyaltyApi.list,
  })

  const remove = useMutation({
    mutationFn: loyaltyApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty-programs'] })
      toast.success('Program dihapus')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const columns: Column<LoyaltyProgram>[] = [
    {
      key: 'name',
      header: 'Program',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
            <Gift className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{row.name}</p>
            {row.description && (
              <p className="text-xs text-slate-400 max-w-xs truncate">{row.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'points_per_currency',
      header: 'Poin / Rp 1',
      cell: (row) => (
        <div>
          <p className="text-sm font-semibold text-slate-800">{row.points_per_currency}</p>
          <p className="text-xs text-slate-400">
            = {(1 / row.points_per_currency).toLocaleString('id-ID')} Rp per poin
          </p>
        </div>
      ),
    },
    {
      key: 'redemption_rate',
      header: 'Nilai Tukar',
      cell: (row) => (
        <div>
          <p className="text-sm font-semibold text-emerald-600">
            {formatCurrency(row.redemption_rate)}
          </p>
          <p className="text-xs text-slate-400">per poin</p>
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
      cell: (row) => (
        <span className="text-sm text-slate-500">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 'w-20',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setModal(row) }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ConfirmDialog
            trigger={
              <button onClick={(e) => e.stopPropagation()}
                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            }
            title="Hapus Program"
            description={`Program "${row.name}" akan dihapus. Poin customer yang sudah terkumpul tidak akan hilang.`}
            confirmLabel="Ya, Hapus"
            onConfirm={() => remove.mutateAsync(row.id)}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Program Loyalti"
        description="Konfigurasi program poin reward untuk customer"
        breadcrumbs={[{ label: 'Master Data' }, { label: 'Program Loyalti' }]}
        actions={
          <button
            onClick={() => setModal('create')}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Buat Program
          </button>
        }
      />

      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800">
        <strong>Cara kerja:</strong> Customer mengumpulkan poin setiap transaksi.
        Poin bisa ditukar menjadi diskon pada booking berikutnya.
      </div>

      <DataTable
        columns={columns}
        data={programs}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        emptyTitle="Belum ada program loyalti"
        emptyDescription="Buat program poin reward untuk meningkatkan retensi customer."
      />

      {modal && (
        <LoyaltyModal
          initial={modal === 'create' ? undefined : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
