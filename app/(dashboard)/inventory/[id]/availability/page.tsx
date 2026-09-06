'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, ChevronRight, Plus, Loader2,
  Ban, CalendarDays, Trash2, ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { get, post, del } from '@/lib/api/client'
import { ConfirmDialog } from '@/components/common'
import { cn } from '@/lib/utils'

// ---- Types ----
interface AssetBlock {
  id: string
  asset_id: string
  start_date: string
  end_date: string
  reason?: string
  created_at: string
}

interface BookingOnDate {
  id: string
  booking_number: string
  customer_name: string
  start_date: string
  end_date: string
  status: string
}

interface AssetInfo {
  id: string
  name: string
  code: string
  is_available: boolean
}

// ---- Helpers ----
const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const DAY_NAMES   = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']

function toYMD(d: Date) {
  return d.toISOString().split('T')[0]
}

function getDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const days: Date[] = []
  for (let i = 0; i < first.getDay(); i++) {
    days.push(new Date(year, month, 1 - (first.getDay() - i)))
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  const rem = 42 - days.length
  for (let i = 1; i <= rem; i++) days.push(new Date(year, month + 1, i))
  return days
}

// ---- Block Form Modal ----
function BlockModal({
  assetId,
  defaultStart,
  onClose,
}: {
  assetId: string
  defaultStart?: string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const today = toYMD(new Date())
  const [form, setForm] = useState({
    start_date: defaultStart ?? today,
    end_date:   defaultStart ?? today,
    reason:     '',
  })

  const create = useMutation({
    mutationFn: () => post(`/assets/${assetId}/blocks`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-blocks', assetId] })
      toast.success('Tanggal berhasil diblokir')
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Blokir Tanggal</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Aset tidak bisa dipesan pada rentang ini
          </p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Mulai *</label>
              <input type="date" value={form.start_date} min={today}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                required className={inp} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Sampai *</label>
              <input type="date" value={form.end_date} min={form.start_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                required className={inp} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Alasan</label>
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Maintenance, Perbaikan, Reservasi khusus..."
              className={inp} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Batal
            </button>
            <button type="submit" disabled={create.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Ban className="h-4 w-4" />Blokir
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Day Detail Panel ----
function DayPanel({
  date,
  assetId,
  blocks,
  bookings,
  onClose,
  onBlock,
}: {
  date: Date
  assetId: string
  blocks: AssetBlock[]
  bookings: BookingOnDate[]
  onClose: () => void
  onBlock: () => void
}) {
  const router = useRouter()
  const qc = useQueryClient()
  const dateStr = toYMD(date)

  const dayBlocks = blocks.filter((b) => b.start_date <= dateStr && b.end_date >= dateStr)
  const dayBookings = bookings.filter((b) => b.start_date <= dateStr && b.end_date >= dateStr)

  const deleteBlock = useMutation({
    mutationFn: (id: string) => del(`/assets/${assetId}/blocks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-blocks', assetId] })
      toast.success('Blokir dihapus')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const STATUS_COLOR: Record<string, string> = {
    pending:   'text-amber-700 bg-amber-100',
    confirmed: 'text-blue-700 bg-blue-100',
    active:    'text-emerald-700 bg-emerald-100',
    completed: 'text-slate-600 bg-slate-100',
  }

  return (
    <div className="w-72 shrink-0 border-l border-slate-200 bg-white flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-semibold text-slate-800">
          {date.toLocaleDateString('id-ID', { dateStyle: 'long' })}
        </p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Bookings */}
        {dayBookings.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Booking ({dayBookings.length})
            </p>
            <div className="space-y-2">
              {dayBookings.map((b) => (
                <button key={b.id} onClick={() => router.push(`/bookings/${b.id}`)}
                  className="w-full rounded-lg border border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800">{b.booking_number}</p>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_COLOR[b.status] ?? 'bg-slate-100 text-slate-600')}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{b.customer_name}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    {b.start_date} → {b.end_date}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Blocks */}
        {dayBlocks.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Diblokir ({dayBlocks.length})
            </p>
            <div className="space-y-2">
              {dayBlocks.map((b) => (
                <div key={b.id} className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-800">{b.reason ?? 'Diblokir'}</p>
                      <p className="text-[10px] text-red-500 mt-0.5 font-mono">
                        {b.start_date} → {b.end_date}
                      </p>
                    </div>
                    <ConfirmDialog
                      trigger={<button className="shrink-0 rounded-md p-1 text-red-400 hover:bg-red-100">
                        <Trash2 className="h-3 w-3" /></button>}
                      title="Hapus Blokir"
                      description="Tanggal ini akan tersedia lagi untuk booking."
                      confirmLabel="Hapus"
                      onConfirm={() => deleteBlock.mutateAsync(b.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {dayBookings.length === 0 && dayBlocks.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center">
            <CalendarDays className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-400">Tidak ada aktivitas</p>
            <p className="text-xs text-slate-300">Aset tersedia pada tanggal ini</p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-4">
        <button onClick={onBlock}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors">
          <Ban className="h-4 w-4" />Blokir Tanggal Ini
        </button>
      </div>
    </div>
  )
}

// ---- Page ----
export default function AssetAvailabilityPage() {
  const { id: assetId } = useParams<{ id: string }>()
  const router = useRouter()
  const today  = new Date()

  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockDefaultDate, setBlockDefaultDate] = useState<string | undefined>()

  const days = useMemo(() => getDays(year, month), [year, month])
  const startDate = toYMD(days[0])
  const endDate   = toYMD(days[days.length - 1])

  const { data: asset } = useQuery<AssetInfo>({
    queryKey: ['asset', assetId],
    queryFn: () => get(`/assets/${assetId}`),
  })

  const { data: blocks = [], isLoading: blocksLoading } = useQuery<AssetBlock[]>({
    queryKey: ['asset-blocks', assetId, year, month],
    queryFn: () => get(`/assets/${assetId}/blocks`, { start_date: startDate, end_date: endDate } as Record<string, unknown>),
  })

  const { data: bookings = [] } = useQuery<BookingOnDate[]>({
    queryKey: ['asset-bookings-cal', assetId, year, month],
    queryFn: () => get(`/assets/${assetId}/bookings`, { start_date: startDate, end_date: endDate } as Record<string, unknown>),
  })

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function getDayState(date: Date): 'available' | 'booked' | 'blocked' | 'past' {
    const key = toYMD(date)
    const isPast = date < new Date(toYMD(today))
    if (isPast) return 'past'
    if (blocks.some((b) => b.start_date <= key && b.end_date >= key)) return 'blocked'
    if (bookings.some((b) => b.start_date <= key && b.end_date >= key)) return 'booked'
    return 'available'
  }

  const DAY_STATE_STYLE = {
    available: 'hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer',
    booked:    'bg-blue-50 border-blue-100 cursor-pointer',
    blocked:   'bg-red-50 border-red-100 cursor-pointer',
    past:      'bg-slate-50 opacity-50 cursor-default',
  }

  const DAY_DOT = {
    available: null,
    booked:    'bg-blue-500',
    blocked:   'bg-red-500',
    past:      null,
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ---- Main calendar ---- */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/inventory/${assetId}`)}
              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </button>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Ketersediaan — {asset?.name ?? '...'}
              </p>
              <p className="text-xs text-slate-400">{asset?.code}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={prevMonth}
              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <span className="w-36 text-center text-sm font-semibold text-slate-800">
              {MONTH_NAMES[month]} {year}
            </span>
            <button onClick={nextMonth}
              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50">
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
            <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
              Hari ini
            </button>
          </div>

          <button
            onClick={() => { setBlockDefaultDate(undefined); setShowBlockModal(true) }}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
            <Ban className="h-4 w-4" />Blokir Tanggal
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 min-w-[560px]">
            {DAY_NAMES.map((d) => (
              <div key={d} className="border-b border-r border-slate-100 bg-slate-50 py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {d}
              </div>
            ))}

            {days.map((day, i) => {
              const state = getDayState(day)
              const isCurrentMonth = day.getMonth() === month
              const isToday = toYMD(day) === toYMD(today)
              const isSelected = selectedDate && toYMD(day) === toYMD(selectedDate)
              const dot = DAY_DOT[state]

              return (
                <div
                  key={i}
                  onClick={() => state !== 'past' && setSelectedDate(day)}
                  className={cn(
                    'min-h-[80px] border-b border-r border-slate-100 p-2 transition-colors',
                    !isCurrentMonth && 'opacity-40',
                    DAY_STATE_STYLE[state],
                    isSelected && 'ring-2 ring-inset ring-blue-500',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                      isToday && 'bg-blue-600 text-white',
                      !isToday && 'text-slate-700',
                    )}>
                      {day.getDate()}
                    </span>
                    {dot && <span className={cn('h-2 w-2 rounded-full', dot)} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 border-t border-slate-200 bg-white px-6 py-2 shrink-0">
          {[
            { label: 'Tersedia',   color: 'bg-white border border-slate-200' },
            { label: 'Ada Booking', color: 'bg-blue-500'  },
            { label: 'Diblokir',   color: 'bg-red-500'   },
            { label: 'Lampau',     color: 'bg-slate-300' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={cn('h-3 w-3 rounded-sm', item.color)} />
              <span className="text-xs text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Day detail panel ---- */}
      {selectedDate && (
        <DayPanel
          date={selectedDate}
          assetId={assetId}
          blocks={blocks}
          bookings={bookings}
          onClose={() => setSelectedDate(null)}
          onBlock={() => {
            setBlockDefaultDate(toYMD(selectedDate))
            setShowBlockModal(true)
          }}
        />
      )}

      {/* ---- Block modal ---- */}
      {showBlockModal && (
        <BlockModal
          assetId={assetId}
          defaultStart={blockDefaultDate}
          onClose={() => setShowBlockModal(false)}
        />
      )}
    </div>
  )
}
