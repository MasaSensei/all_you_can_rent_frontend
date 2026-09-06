'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, CheckCheck, Loader2, BellOff } from 'lucide-react'
import { get, post } from '@/lib/api/client'
import { PageHeader } from '@/components/common'
import { formatRelative, cn } from '@/lib/utils'

// ---- Types ----

interface Notification {
  id: string
  title: string
  message: string
  channel: string
  is_read: boolean
  read_at?: string
  created_at: string
}

// ---- API ----

const notificationApi = {
  list: (params?: { is_read?: boolean; page?: number }) =>
    get<Notification[]>('/notifications', params as Record<string, unknown>),
  markRead: (id: string) =>
    post(`/notifications/${id}/read`),
  markAllRead: () =>
    post('/notifications/read-all'),
}

// ---- Notification item ----

function NotificationItem({
  notification,
  onMarkRead,
  isMarking,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  isMarking: boolean
}) {
  const channelColor: Record<string, string> = {
    in_app:    'bg-blue-100 text-blue-600',
    email:     'bg-emerald-100 text-emerald-600',
    whatsapp:  'bg-green-100 text-green-600',
    sms:       'bg-amber-100 text-amber-600',
  }

  return (
    <div className={cn(
      'flex items-start gap-4 px-5 py-4 transition-colors',
      !notification.is_read ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'
    )}>
      {/* Icon */}
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
        channelColor[notification.channel] ?? 'bg-slate-100 text-slate-500'
      )}>
        <Bell className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={cn(
              'text-sm',
              !notification.is_read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
            )}>
              {notification.title}
            </p>
            <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
              {notification.message}
            </p>
          </div>

          {/* Unread dot */}
          {!notification.is_read && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-400">
            {formatRelative(notification.created_at)}
          </span>
          {!notification.is_read && (
            <button
              onClick={() => onMarkRead(notification.id)}
              disabled={isMarking}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
            >
              {isMarking ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Tandai dibaca
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Page ----

export default function NotificationsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [markingId, setMarkingId] = useState<string | null>(null)

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () =>
      notificationApi.list(filter === 'unread' ? { is_read: false } : undefined),
    refetchInterval: 30_000,
  })

  const markRead = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      setMarkingId(null)
    },
  })

  const markAllRead = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length

  async function handleMarkRead(id: string) {
    setMarkingId(id)
    await markRead.mutateAsync(id)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifikasi"
        description="Pesan dan pemberitahuan sistem"
        breadcrumbs={[{ label: 'Notifikasi' }]}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-colors"
            >
              {markAllRead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Tandai Semua Dibaca
            </button>
          ) : null
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
        {[
          { key: 'all'    as const, label: 'Semua'  },
          { key: 'unread' as const, label: 'Belum Dibaca' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              filter === tab.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.label}
            {tab.key === 'unread' && unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="space-y-0 divide-y divide-slate-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4">
                <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-72 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : !notifications?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BellOff className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              {filter === 'unread' ? 'Tidak ada notifikasi belum dibaca' : 'Belum ada notifikasi'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={handleMarkRead}
                isMarking={markingId === n.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
