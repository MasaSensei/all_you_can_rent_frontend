'use client'

import { useState } from 'react'
import { BarChart3, Plus, Download, Loader2, RefreshCw } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader, DataTable, type Column, StatusBadge } from '@/components/common'
import { reportsApi } from '@/lib/api/modules/index'
import { formatDate } from '@/lib/utils'
import type { Report } from '@/types/api'

const REPORT_TYPES = [
  { label: 'Pendapatan',        value: 'revenue'          },
  { label: 'Booking',           value: 'bookings'         },
  { label: 'Utilisasi Aset',    value: 'asset_utilization'},
  { label: 'Customer',          value: 'customers'        },
  { label: 'Keuangan',          value: 'financial'        },
  { label: 'Maintenance',       value: 'maintenance'      },
]

const FORMAT_OPTIONS = [
  { label: 'PDF',  value: 'pdf'  },
  { label: 'Excel (XLSX)', value: 'xlsx' },
  { label: 'CSV',  value: 'csv'  },
]

// ---- Generate Modal ----
function GenerateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', report_type: 'revenue', generated_format: 'pdf',
    from: '', to: '',
  })

  const generate = useMutation({
    mutationFn: () => reportsApi.generate({
      name: form.name || `${form.report_type}_${Date.now()}`,
      report_type: form.report_type,
      generated_format: form.generated_format,
      parameters: form.from && form.to ? { from: form.from, to: form.to } : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Laporan dijadwalkan, akan diproses segera')
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Generate Laporan</h2>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); generate.mutate() }}
          className="space-y-4 p-6"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Laporan</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Laporan Pendapatan Q1 2024"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Tipe <span className="text-red-500">*</span>
              </label>
              <select
                value={form.report_type}
                onChange={(e) => setForm({ ...form, report_type: e.target.value })}
                required
                className={inputCls}
              >
                {REPORT_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Format</label>
              <select
                value={form.generated_format}
                onChange={(e) => setForm({ ...form, generated_format: e.target.value })}
                className={inputCls}
              >
                {FORMAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Dari</label>
              <input
                type="date"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Sampai</label>
              <input
                type="date"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                className={inputCls}
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
              disabled={generate.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {generate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Page ----
export default function ReportsPage() {
  const [showModal, setShowModal] = useState(false)
  const qc = useQueryClient()

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.list(),
    // Poll every 10s to catch when reports finish generating
    refetchInterval: (query) => {
      const data = query.state.data as Report[] | undefined
      const hasPending = data?.some((r) => ['queued', 'processing'].includes(r.status))
      return hasPending ? 10_000 : false
    },
  })

  const columns: Column<Report>[] = [
    {
      key: 'name',
      header: 'Nama Laporan',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{row.name}</p>
            <p className="text-xs text-slate-400 capitalize">{row.report_type} · {row.generated_format.toUpperCase()}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={row.status} size="sm" />
          {['queued', 'processing'].includes(row.status) && (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Dibuat',
      cell: (row) => (
        <span className="text-sm text-slate-500">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'updated_at',
      header: 'Diperbarui',
      cell: (row) => (
        <span className="text-sm text-slate-500">{formatDate(row.updated_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 'w-24',
      align: 'right',
      cell: (row) =>
        row.status === 'completed' && row.file_url ? (
          <a
            href={row.file_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Unduh
          </a>
        ) : null,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Laporan"
        description="Generate dan unduh laporan operasional"
        breadcrumbs={[{ label: 'Laporan' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ['reports'] })}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Generate Laporan
            </button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={reports}
        isLoading={isLoading}
        rowKey={(row) => row.id}
        emptyTitle="Belum ada laporan"
        emptyDescription="Generate laporan pertama untuk mendapatkan insight operasional."
      />

      {showModal && <GenerateModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
