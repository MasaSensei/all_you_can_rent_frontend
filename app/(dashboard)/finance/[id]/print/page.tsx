'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Printer, Download, ArrowLeft, Loader2 } from 'lucide-react'
import { get } from '@/lib/api/client'
import { useAuthStore } from '@/lib/stores/auth'

interface InvoiceDetail {
  id: string
  invoice_number: string
  status: string
  due_date: string
  created_at: string
  notes?: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  booking: {
    booking_number: string
    start_date: string
    end_date: string
    asset_name: string
  }
  customer: {
    first_name?: string
    last_name?: string
    company_name?: string
    customer_type: string
    email?: string
    phone?: string
    address?: string
  }
  items: {
    id: string
    description: string
    qty: number
    unit_price: number
    subtotal: number
  }[]
  payments: {
    id: string
    paid_at: string
    amount: number
    payment_method: string
    reference_number?: string
  }[]
}

function formatRp(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'long' })
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:   { label: 'Draft',        color: '#94a3b8' },
  sent:    { label: 'Terkirim',     color: '#3b82f6' },
  paid:    { label: 'Lunas',        color: '#22c55e' },
  overdue: { label: 'Jatuh Tempo',  color: '#ef4444' },
  void:    { label: 'Dibatalkan',   color: '#6b7280' },
}

export default function InvoicePrintPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)

  const { data: invoice, isLoading } = useQuery<InvoiceDetail>({
    queryKey: ['invoice', id],
    queryFn: () => get(`/invoices/${id}`),
  })

  // Auto print jika ada ?print=1
  useEffect(() => {
    if (invoice && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('print') === '1') {
        setTimeout(() => window.print(), 500)
      }
    }
  }, [invoice])

  function handlePrint() {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Invoice tidak ditemukan</p>
      </div>
    )
  }

  const status = STATUS_LABELS[invoice.status] ?? { label: invoice.status, color: '#94a3b8' }
  const customerName = invoice.customer.customer_type === 'corporate'
    ? invoice.customer.company_name
    : `${invoice.customer.first_name ?? ''} ${invoice.customer.last_name ?? ''}`.trim()
  const outstanding = invoice.total_amount - invoice.paid_amount

  return (
    <>
      {/* ---- Toolbar (hidden on print) ---- */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <button onClick={() => router.push(`/finance/${id}`)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" />Kembali
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Printer className="h-4 w-4" />Cetak
          </button>
          <button onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />Simpan PDF
          </button>
        </div>
      </div>

      {/* ---- Invoice document ---- */}
      <div className="no-print mt-14 bg-slate-100 min-h-screen py-8 px-4">
        <div ref={printRef} className="mx-auto w-full max-w-3xl bg-white shadow-lg print:shadow-none print:max-w-none">
          <InvoiceDocument invoice={invoice} customerName={customerName} status={status} outstanding={outstanding} />
        </div>
      </div>

      {/* Print-only version */}
      <div className="print-only hidden print:block">
        <InvoiceDocument invoice={invoice} customerName={customerName} status={status} outstanding={outstanding} />
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { margin: 0; padding: 0; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>
    </>
  )
}

function InvoiceDocument({
  invoice,
  customerName,
  status,
  outstanding,
}: {
  invoice: InvoiceDetail
  customerName: string
  status: { label: string; color: string }
  outstanding: number
}) {
  return (
    <div className="p-10 font-sans text-slate-800">
      {/* ---- Header ---- */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">R</span>
            </div>
            <span className="text-xl font-bold text-slate-900">RentOS</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Platform Manajemen Rental</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
            <span className="text-2xl font-bold text-slate-900">INVOICE</span>
            <span
              className="rounded-full px-3 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: status.color }}
            >
              {status.label}
            </span>
          </div>
          <p className="text-lg font-mono font-semibold text-slate-700">{invoice.invoice_number}</p>
        </div>
      </div>

      {/* ---- Info grid ---- */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Bill to */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Tagihan Kepada</p>
          <p className="font-semibold text-slate-900">{customerName}</p>
          {invoice.customer.email && <p className="text-sm text-slate-600">{invoice.customer.email}</p>}
          {invoice.customer.phone && <p className="text-sm text-slate-600">{invoice.customer.phone}</p>}
          {invoice.customer.address && <p className="text-sm text-slate-500 mt-1">{invoice.customer.address}</p>}
        </div>
        {/* Invoice meta */}
        <div className="space-y-1.5">
          {[
            { label: 'Tanggal Invoice', value: formatDate(invoice.created_at) },
            { label: 'Jatuh Tempo',     value: formatDate(invoice.due_date)   },
            { label: 'No. Booking',     value: invoice.booking.booking_number },
            { label: 'Periode Sewa',    value: `${formatDate(invoice.booking.start_date)} — ${formatDate(invoice.booking.end_date)}` },
          ].map((row) => (
            <div key={row.label} className="flex justify-between gap-4">
              <span className="text-sm text-slate-400 shrink-0">{row.label}</span>
              <span className="text-sm font-medium text-slate-700 text-right">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Items table ---- */}
      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 pr-4">Deskripsi</th>
            <th className="py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 pr-4 w-16">Qty</th>
            <th className="py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 pr-4 w-32">Harga Satuan</th>
            <th className="py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 w-32">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoice.items.map((item) => (
            <tr key={item.id}>
              <td className="py-3 pr-4 text-sm text-slate-700">{item.description}</td>
              <td className="py-3 pr-4 text-right text-sm text-slate-600">{item.qty}</td>
              <td className="py-3 pr-4 text-right text-sm text-slate-600">{formatRp(item.unit_price)}</td>
              <td className="py-3 text-right text-sm font-medium text-slate-800">{formatRp(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ---- Totals ---- */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-1.5">
          {[
            { label: 'Subtotal',   value: invoice.subtotal,         muted: true  },
            { label: 'Pajak',      value: invoice.tax_amount,       muted: true  },
            { label: 'Diskon',     value: -invoice.discount_amount, muted: true  },
          ].filter(r => r.value !== 0).map((row) => (
            <div key={row.label} className="flex justify-between gap-4">
              <span className="text-sm text-slate-400">{row.label}</span>
              <span className="text-sm text-slate-600">{formatRp(row.value)}</span>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 mt-2">
            <span className="text-sm font-bold text-slate-900">Total</span>
            <span className="text-base font-bold text-slate-900">{formatRp(invoice.total_amount)}</span>
          </div>
          {invoice.paid_amount > 0 && (
            <>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-400">Sudah Dibayar</span>
                <span className="text-sm text-emerald-600 font-medium">{formatRp(invoice.paid_amount)}</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-2">
                <span className="text-sm font-bold text-slate-900">Sisa Tagihan</span>
                <span className={`text-sm font-bold ${outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatRp(outstanding)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---- Payment history ---- */}
      {invoice.payments.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Riwayat Pembayaran</p>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Tanggal</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Metode</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Referensi</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 text-slate-700">{formatDate(p.paid_at)}</td>
                    <td className="px-4 py-2 text-slate-600 capitalize">{p.payment_method}</td>
                    <td className="px-4 py-2 text-slate-500 font-mono text-xs">{p.reference_number ?? '—'}</td>
                    <td className="px-4 py-2 text-right font-medium text-slate-800">{formatRp(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- Notes ---- */}
      {invoice.notes && (
        <div className="mb-8 rounded-lg bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Catatan</p>
          <p className="text-sm text-slate-600">{invoice.notes}</p>
        </div>
      )}

      {/* ---- Footer ---- */}
      <div className="border-t border-slate-200 pt-6 text-center">
        <p className="text-xs text-slate-400">
          Dokumen ini digenerate secara otomatis oleh sistem RentOS.
          Jika ada pertanyaan, hubungi kami.
        </p>
      </div>
    </div>
  )
}
