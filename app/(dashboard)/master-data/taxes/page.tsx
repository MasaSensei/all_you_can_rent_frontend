'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Receipt, Pencil, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, DataTable, type Column, StatusBadge, ConfirmDialog } from '@/components/common'
import { taxApi, type TaxCreateRequest, type TaxResponse } from '@/lib/api/modules/masterdata'

function TaxModal({
  initial,
  onClose,
}: {
  initial?: TaxResponse
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<TaxCreateRequest>({
    name:       initial?.name       ?? '',
    rate:       initial?.rate       ?? 11,
    tax_type:   (initial?.tax_type as 'percentage' | 'fixed') ?? 'percentage',
    is_default: initial?.is_default ?? false,
  })

  const create = useMutation({
    mutationFn: () => taxApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['taxes'] }); toast.success('Pajak ditambahkan'); onClose() },
    onError: (e: Error) => toast.error(e.message),
  })

  const update = useMutation({
    mutationFn: () => taxApi.update(initial!.id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['taxes'] }); toast.success('Pajak diperbarui'); onClose() },
    onError: (e: Error) => toast.error(e.message),
  })

  const isPending = create.isPending || update.isPending
  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {initial ? 'Edit Pajak' : 'Tambah Pajak'}
          </h2>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); initial ? update.mutate() : create.mutate() }}
          className="space-y-4 p-6"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              required placeholder="PPN" className={inp} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipe</label>
              <select value={form.tax_type}
                onChange={(e) => setForm({ ...form, tax_type: e.target.value as 'percentage' | 'fixed' })}
                className={inp}>
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal Tetap (Rp)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {form.tax_type === 'percentage' ? 'Rate (%)' : 'Nominal (Rp)'} *
              </label>
              <input type="number" min={0} max={form.tax_type === 'percentage' ? 100 : undefined}
                step="0.01" value={form.rate}
                onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
                required className={inp} />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600" />
            <span className="text-sm text-slate-700">
              Jadikan pajak default untuk invoice baru
            </span>
          </label>

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

export default function TaxesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | TaxResponse | null>(null)

  const { data: taxes, isLoading } = useQuery({
    queryKey: ['taxes'],
    queryFn: taxApi.list,
  })

  const remove = useMutation({
    mutationFn: taxApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['taxes'] }); toast.success('Pajak dihapus') },
    onError: (e: Error) => toast.error(e.message),
  })

  const columns: Column<TaxResponse>[] = [
    {
      key: 'name',
      header: 'Nama',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <Receipt className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-800">{row.name}</p>
            {row.is_default && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                <Star className="h-3 w-3" />Default
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'rate',
      header: 'Rate',
      cell: (row) => (
        <span className="text-sm font-semibold text-slate-800">
          {row.rate}{row.tax_type === 'percentage' ? '%' : ' Rp'}
        </span>
      ),
    },
    {
      key: 'tax_type',
      header: 'Tipe',
      cell: (row) => (
        <span className="text-sm text-slate-600 capitalize">
          {row.tax_type === 'percentage' ? 'Persentase' : 'Nominal Tetap'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: '',
      width: 'w-20',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); setModal(row) }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {!row.is_default && (
            <ConfirmDialog
              trigger={
                <button onClick={(e) => e.stopPropagation()}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              }
              title="Hapus Pajak"
              description={`Pajak "${row.name}" akan dihapus.`}
              confirmLabel="Ya, Hapus"
              onConfirm={() => remove.mutateAsync(row.id)}
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pajak"
        description="Konfigurasi pajak yang diterapkan pada invoice"
        breadcrumbs={[{ label: 'Master Data' }, { label: 'Pajak' }]}
        actions={
          <button onClick={() => setModal('create')}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />Tambah Pajak
          </button>
        }
      />
      <DataTable columns={columns} data={taxes} isLoading={isLoading} rowKey={(r) => r.id}
        emptyTitle="Belum ada konfigurasi pajak"
        emptyDescription="Tambahkan pajak (misal: PPN 11%) untuk diterapkan otomatis pada invoice." />

      {modal && <TaxModal initial={modal === 'create' ? undefined : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
