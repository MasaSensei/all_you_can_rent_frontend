'use client'

import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, Receipt, CheckCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, StatusBadge } from '@/components/common'
import { financeApi } from '@/lib/api/modules/index'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => financeApi.getInvoice(id),
    enabled: !!id,
  })

  const { data: payments } = useQuery({
    queryKey: ['invoice-payments', id],
    queryFn: () => financeApi.listPaymentsByInvoice(id),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 h-72 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">Invoice tidak ditemukan</p>
        <button onClick={() => router.push('/finance')} className="mt-4 text-sm text-blue-600 hover:underline">
          Kembali ke keuangan
        </button>
      </div>
    )
  }

  const isOverdue = invoice.invoice_status !== 'paid' && new Date(invoice.due_date) < new Date()

  return (
    <div className="space-y-5">
      <PageHeader
        title={invoice.invoice_number}
        breadcrumbs={[
          { label: 'Keuangan', href: '/finance' },
          { label: invoice.invoice_number },
        ]}
        actions={
          invoice.invoice_status !== 'paid' && invoice.invoice_status !== 'voided' ? (
            <button
              onClick={() => router.push(`/finance?pay=${invoice.id}`)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Catat Pembayaran
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Invoice items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4 flex items-center gap-3">
              <Receipt className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-800">Detail Invoice</h3>
            </div>

            {/* Items */}
            {!invoice.items?.length ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">Tidak ada item</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {invoice.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{item.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.quantity} × {formatCurrency(item.unit_price)}
                        {item.tax_amount > 0 && ` + pajak ${formatCurrency(item.tax_amount)}`}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-800 shrink-0">
                      {formatCurrency(item.line_total)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 space-y-2 rounded-b-xl">
              <Row label="Subtotal" value={formatCurrency(invoice.subtotal)} />
              {invoice.tax_total > 0 && (
                <Row label="Pajak" value={formatCurrency(invoice.tax_total)} />
              )}
              {invoice.discount_total > 0 && (
                <Row label="Diskon" value={`- ${formatCurrency(invoice.discount_total)}`} className="text-emerald-600" />
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Sudah Dibayar</span>
                <span className="text-emerald-600 font-medium">{formatCurrency(invoice.amount_paid)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className={isOverdue ? 'text-red-600' : 'text-slate-700'}>Sisa Tagihan</span>
                <span className={isOverdue ? 'text-red-600' : 'text-slate-900'}>
                  {formatCurrency(invoice.amount_due)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment history */}
          {payments && payments.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-sm font-semibold text-slate-800">Riwayat Pembayaran</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-800 capitalize">
                        {p.payment_method.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-slate-400">
                        {p.transaction_reference && `Ref: ${p.transaction_reference} · `}
                        {p.paid_at ? formatDate(p.paid_at) : formatDate(p.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600">
                        {formatCurrency(p.amount)}
                      </p>
                      <StatusBadge status={p.payment_status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Info Invoice</h3>

            <Row label="Status">
              <StatusBadge status={invoice.invoice_status} size="sm" />
            </Row>
            <Row label="Tgl. Invoice">
              <span className="text-sm text-slate-700">{formatDate(invoice.issue_date)}</span>
            </Row>
            <Row label="Jatuh Tempo">
              <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                {formatDate(invoice.due_date)}
                {isOverdue && ' (Jatuh Tempo)'}
              </span>
            </Row>
            {invoice.booking_id && (
              <Row label="No. Booking">
                <button
                  onClick={() => router.push(`/bookings/${invoice.booking_id}`)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Lihat Booking
                </button>
              </Row>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  children,
  className,
}: {
  label: string
  value?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <div className={className ?? 'text-right'}>
        {children ?? <span className="text-sm text-slate-700">{value}</span>}
      </div>
    </div>
  )
}
