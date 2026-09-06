'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft, ChevronRight, List, CalendarDays,
  Circle, Loader2,
} from 'lucide-react'
import { get } from '@/lib/api/client'
import { categoryApi } from '@/lib/api/modules/masterdata'
import { cn } from '@/lib/utils'

// ---- Types ----

interface BookingSlot {
  id: string
  booking_number: string
  customer_name: string
  asset_name: string
  asset_id: string
  category_id?: string
  start_date: string
  end_date: string
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  total_amount: number
}

// ---- Constants ----

const DAY_NAMES  = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pending:   { bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-500',   label: 'Menunggu'     },
  confirmed: { bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-500',    label: 'Dikonfirmasi' },
  active:    { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Aktif'        },
  completed: { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400',   label: 'Selesai'      },
  cancelled: { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-400',     label: 'Dibatalkan'   },
}

// ---- Helpers ----

function toYMD(date: Date) {
  return date.toISOString().split('T')[0]
}

function parseYMD(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isBetween(date: Date, start: Date, end: Date) {
  return date >= start && date <= end
}

function getDaysInMonth(year: number, month: number) {
  // Returns array of Date objects for all days in the month grid (padded to full weeks)
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const days: Date[] = []

  // Pad start
  for (let i = 0; i < first.getDay(); i++) {
    days.push(new Date(year, month, 1 - (first.getDay() - i)))
  }
  // Month days
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  // Pad end
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i))
  }
  return days
}

// ---- Booking pill ----
function BookingPill({
  booking,
  onClick,
  truncate,
}: {
  booking: BookingSlot
  onClick: () => void
  truncate?: boolean
}) {
  const style = STATUS_STYLE[booking.status] ?? STATUS_STYLE.pending
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title={`${booking.asset_name} — ${booking.customer_name}`}
      className={cn(
        'w-full rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium transition-opacity hover:opacity-80',
        style.bg, style.text,
        truncate && 'truncate'
      )}
    >
      {booking.asset_name}
    </button>
  )
}

// ---- Day cell ----
function DayCell({
  date,
  isCurrentMonth,
  isToday,
  bookings,
  onBookingClick,
}: {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  bookings: BookingSlot[]
  onBookingClick: (id: string) => void
}) {
  const MAX_VISIBLE = 3
  const visible  = bookings.slice(0, MAX_VISIBLE)
  const overflow = bookings.length - MAX_VISIBLE

  return (
    <div className={cn(
      'min-h-[100px] border-b border-r border-slate-100 p-1.5 transition-colors',
      !isCurrentMonth && 'bg-slate-50/50',
      isToday && 'bg-blue-50/40',
    )}>
      {/* Date number */}
      <span className={cn(
        'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
        isToday && 'bg-blue-600 text-white',
        !isToday && isCurrentMonth && 'text-slate-700',
        !isToday && !isCurrentMonth && 'text-slate-300',
      )}>
        {date.getDate()}
      </span>

      {/* Booking pills */}
      <div className="space-y-0.5">
        {visible.map((b) => (
          <BookingPill key={b.id} booking={b} onClick={() => onBookingClick(b.id)} truncate />
        ))}
        {overflow > 0 && (
          <span className="block px-1.5 text-[10px] text-slate-500">
            +{overflow} lagi
          </span>
        )}
      </div>
    </div>
  )
}

// ---- Booking detail drawer ----
function BookingDrawer({
  booking,
  onClose,
}: {
  booking: BookingSlot
  onClose: () => void
}) {
  const router = useRouter()
  const style = STATUS_STYLE[booking.status] ?? STATUS_STYLE.pending

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative h-full w-80 bg-white shadow-2xl border-l border-slate-200 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn('px-5 py-4 border-b border-slate-200', style.bg)}>
          <div className="flex items-center justify-between">
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', style.bg, style.text)}>
              {style.label}
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900">{booking.booking_number}</p>
        </div>

        {/* Detail rows */}
        <div className="divide-y divide-slate-100 px-5">
          {[
            { label: 'Aset',        value: booking.asset_name    },
            { label: 'Customer',    value: booking.customer_name },
            { label: 'Mulai',       value: new Date(booking.start_date).toLocaleDateString('id-ID', { dateStyle: 'long' }) },
            { label: 'Selesai',     value: new Date(booking.end_date).toLocaleDateString('id-ID', { dateStyle: 'long' }) },
            {
              label: 'Total',
              value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })
                .format(booking.total_amount),
            },
          ].map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4 py-3">
              <span className="text-sm text-slate-400 shrink-0">{row.label}</span>
              <span className="text-sm font-medium text-slate-800 text-right">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="p-5">
          <button
            onClick={() => router.push(`/bookings/${booking.id}`)}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Lihat Detail Booking
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Page ----
export default function BookingCalendarPage() {
  const router = useRouter()
  const today  = new Date()

  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedBooking, setSelectedBooking] = useState<BookingSlot | null>(null)
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const days = useMemo(() => getDaysInMonth(year, month), [year, month])

  // ---- Fetch bookings for the visible month range ----
  const startDate = toYMD(days[0])
  const endDate   = toYMD(days[days.length - 1])

  const { data: bookings, isLoading } = useQuery<BookingSlot[]>({
    queryKey: ['bookings-calendar', year, month, filterCategoryId, filterStatus],
    queryFn: () => get('/bookings/calendar', {
      start_date:  startDate,
      end_date:    endDate,
      category_id: filterCategoryId || undefined,
      status:      filterStatus     || undefined,
    } as Record<string, unknown>),
    placeholderData: [],
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list(),
  })

  // ---- Map bookings to days ----
  const bookingsByDay = useMemo(() => {
    const map: Record<string, BookingSlot[]> = {}
    for (const b of bookings ?? []) {
      const start = parseYMD(b.start_date)
      const end   = parseYMD(b.end_date)
      for (const day of days) {
        if (isBetween(day, start, end)) {
          const key = toYMD(day)
          if (!map[key]) map[key] = []
          map[key].push(b)
        }
      }
    }
    return map
  }, [bookings, days])

  // ---- Navigation ----
  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  // ---- Stats for the month ----
  const monthBookings = useMemo(() => {
    return (bookings ?? []).filter((b) => {
      const s = parseYMD(b.start_date)
      return s.getFullYear() === year && s.getMonth() === month
    })
  }, [bookings, year, month])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const b of monthBookings) {
      counts[b.status] = (counts[b.status] ?? 0) + 1
    }
    return counts
  }, [monthBookings])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* ---- Top bar ---- */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3 shrink-0">
        {/* Month navigation */}
        <div className="flex items-center gap-3">
          <button onClick={prevMonth}
            className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 transition-colors">
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </button>
          <h2 className="text-base font-bold text-slate-900 w-40 text-center">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button onClick={nextMonth}
            className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 transition-colors">
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </button>
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Hari ini
          </button>
        </div>

        {/* Status counts */}
        <div className="hidden md:flex items-center gap-4">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            Object.entries(STATUS_STYLE)
              .filter(([key]) => (statusCounts[key] ?? 0) > 0)
              .map(([key, style]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Circle className={cn('h-2.5 w-2.5 fill-current', style.dot.replace('bg-', 'text-'))} />
                  <span>{style.label}</span>
                  <span className="font-semibold">{statusCounts[key]}</span>
                </div>
              ))
          )}
        </div>

        {/* Filters + View toggle */}
        <div className="flex items-center gap-2">
          <select value={filterCategoryId} onChange={(e) => setFilterCategoryId(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 px-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Kategori</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 px-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Status</option>
            {Object.entries(STATUS_STYLE).map(([key, s]) => (
              <option key={key} value={key}>{s.label}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
              title="Calendar view"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Kalender
            </button>
            <button
              onClick={() => router.push('/bookings')}
              className="flex items-center gap-1.5 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>
        </div>
      </div>

      {/* ---- Calendar grid ---- */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 min-w-[700px]">
          {/* Day headers */}
          {DAY_NAMES.map((d) => (
            <div key={d}
              className="border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {d}
            </div>
          ))}

          {/* Day cells */}
          {days.map((day, i) => {
            const key  = toYMD(day)
            const isCurrentMonth = day.getMonth() === month
            const isToday = key === toYMD(today)
            const dayBookings = bookingsByDay[key] ?? []

            return (
              <DayCell
                key={i}
                date={day}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                bookings={dayBookings}
                onBookingClick={(id) => {
                  const b = (bookings ?? []).find((x) => x.id === id)
                  if (b) setSelectedBooking(b)
                }}
              />
            )
          })}
        </div>
      </div>

      {/* ---- Legend ---- */}
      <div className="flex items-center gap-4 border-t border-slate-200 bg-white px-6 py-2 shrink-0">
        <span className="text-xs text-slate-400">Status:</span>
        {Object.entries(STATUS_STYLE).map(([key, style]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-full', style.dot)} />
            <span className="text-xs text-slate-500">{style.label}</span>
          </div>
        ))}
      </div>

      {/* ---- Booking detail drawer ---- */}
      {selectedBooking && (
        <BookingDrawer
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  )
}
