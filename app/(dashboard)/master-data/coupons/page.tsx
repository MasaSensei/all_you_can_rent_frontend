'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Percent, Pencil, Trash2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, DataTable, type Column, StatusBadge, ConfirmDialog } from '@/components/common'
import { couponApi } from '@/lib/api/modules/masterdata'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Coupon } from '@/types/api'

function CouponModal({ initial, onClose }: { initial?: Coupon; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    code:            initial?.code            ?? '',
    discount_type:   initial?.discount_type   ?? 'percentage',
    discount_value:  String(initial?.discount_value  ?? ''),
    min_order_value: String(initial?.min_order_value ?? '0'),
    usage_limit:     String(initial?.usage_limit     ?? ''),
    valid_from:      initial?.valid_from      ?? '',
    valid_to:        initial?.valid_to        ?? '',
  })

  const create = useMutation({
    mutationFn: () => couponApi.create({
      ...form,
      discount_value:  Number(form.discount_value),
      min_order_value: Number(form.min_order_value),
      usage_limit:     form.usage_limit ? Number(form.usage_limit) : undefined,
      valid_from:      form.valid_from  || undefined,
      valid_to:        form.valid_to    || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); toast.success('Kupon ditambahkan'); onClose() },
    onError: (e: Error) => toast.error(e.message),
  })

  const update = useMutation({
    mutationFn: () => couponApi.update(initial!.id, { ...form, discount_value: Number(form.discount_value) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); toast.success('Kupon diperbarui'); onClose() },
    onError: (e: Error) => toast.error(e.message),
  })

  function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setForm({ ...form, code })
  }

  const isPending = create.isPending || update.isPending
  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{initial ? 'Edit Kupon' : 'Buat Kupon'}</h2>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); initial ? update.mutate() : create.mutate() }}
          className="space-y-4 p-6">

          {/* Code */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Kode Kupon *</label>
            <div className="flex gap-2">
              <input value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required placeholder="DISKON10" className={`${inp} font-mono uppercase`} />
              <button type="button" onClick={generateCode}
                className="shrink-0 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 hover:bg-slate-50">
                Generate
              </button>
            </div>
          </div>

          {/* Type + Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipe Diskon</label>
              <select value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className={inp}>
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal (Rp)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nilai {form.discount_type === 'percentage' ? '(%)' : '(Rp)'} *
              </label>
              <input type="number" min={0}
                max={form.discount_type === 'percentage' ? 100 : undefined}
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                required placeholder={form.discount_type === 'percentage' ? '10' : '50000'} className={inp} />
            </div>
          </div>

          {/* Min order + Usage limit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Min. Order (Rp)</label>
              <input type="number" min={0} value={form.min_order_value}
                onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
                placeholder="0" className={inp} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Maks. Penggunaan</label>
              <input type="number" min={1} value={form.usage_limit}
                onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                placeholder="Tidak terbatas" className={inp} />
            </div>
          </div>

          {/* Validity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Berlaku Dari</label>
              <input type="date" value={form.valid_from}
                onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className={inp} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Berlaku Sampai</label>
              <input type="date" value={form.valid_to}
                onChange={(e) => setForm({ ...form, valid_to: e.target.value })} className={inp} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Batal
            </button>
            <button type="submit" disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial ? 'Simpan' : 'Buat Kupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CouponsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | Coupon | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { data: coupons, isLoading } = useQuery({ queryKey: ['coupons'], queryFn: () => couponApi.list() })

  const remove = useMutation({
    mutationFn: couponApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); toast.success('Kupon dihapus') },
    onError: (e: Error) => toast.error(e.message),
  })

  async function copyCode(code: string, id: string) {
    await navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success(`Kode ${code} disalin`)
  }

  const columns: Column<Coupon>[] = [
    {
      key: 'code',
      header: 'Kode',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-sm font-semibold text-slate-800">
            {row.code}
          </span>
          <button onClick={(e) => { e.stopPropagation(); copyCode(row.code, row.id) }}
            className="text-slate-400 hover:text-slate-600">
            {copiedId === row.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      ),
    },
    {
      key: 'discount',
      header: 'Diskon',
      cell: (row) => (
        <span className="text-sm font-semibold text-emerald-600">
          {row.discount_type === 'percentage' ? `${row.discount_value}%` : formatCurrency(row.discount_value)}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'Penggunaan',
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {row.used_count}/{row.usage_limit ?? '∞'}
        </span>
      ),
    },
    {
      key: 'validity',
      header: 'Berlaku',
      cell: (row) => row.valid_to ? (
        <span className={`text-sm ${new Date(row.valid_to) < new Date() ? 'text-red-500' : 'text-slate-600'}`}>
          s/d {formatDate(row.valid_to)}
        </span>
      ) : <span className="text-slate-400">Selamanya</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions', header: '', width: 'w-20', align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); setModal(row) }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ConfirmDialog
            trigger={<button onClick={(e) => e.stopPropagation()}
              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" /></button>}
            title="Hapus Kupon" description={`Kupon "${row.code}" akan dihapus.`}
            confirmLabel="Ya, Hapus" onConfirm={() => remove.mutateAsync(row.id)}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Kupon" description="Kelola kode diskon untuk booking"
        breadcrumbs={[{ label: 'Master Data' }, { label: 'Kupon' }]}
        actions={<button onClick={() => setModal('create')}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />Buat Kupon</button>}
      />
      <DataTable columns={columns} data={coupons} isLoading={isLoading} rowKey={(r) => r.id}
        emptyTitle="Belum ada kupon" emptyDescription="Buat kupon diskon untuk menarik lebih banyak customer." />
      {modal && <CouponModal initial={modal === 'create' ? undefined : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
