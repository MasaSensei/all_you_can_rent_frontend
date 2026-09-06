'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plug, Key, Webhook, Plus, Copy, Trash2, Check, Loader2, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { get, post, del } from '@/lib/api/client'
import { PageHeader, ConfirmDialog, StatusBadge } from '@/components/common'
import { formatDate, formatRelative, cn } from '@/lib/utils'
import type { ApiKey, ApiKeyCreated, Webhook as WebhookType } from '@/types/api'

// ---- API ----

const integrationApi = {
  listApiKeys: () => get<ApiKey[]>('/api-keys'),
  createApiKey: (data: { name: string; scopes: string[]; expires_at?: string }) =>
    post<ApiKeyCreated>('/api-keys', data),
  revokeApiKey: (id: string) => del(`/api-keys/${id}`),
  listWebhooks: () => get<WebhookType[]>('/webhooks'),
  createWebhook: (data: { url: string; events: string[] }) =>
    post<WebhookType>('/webhooks', data),
  deleteWebhook: (id: string) => del(`/webhooks/${id}`),
}

const WEBHOOK_EVENTS = [
  'booking.created', 'booking.confirmed', 'booking.cancelled', 'booking.completed',
  'payment.succeeded', 'payment.failed', 'customer.created', 'maintenance.scheduled',
]

const SCOPES = [
  { value: 'bookings:read',   label: 'Booking (Baca)'   },
  { value: 'bookings:write',  label: 'Booking (Tulis)'  },
  { value: 'customers:read',  label: 'Customer (Baca)'  },
  { value: 'inventory:read',  label: 'Inventori (Baca)' },
  { value: 'finance:read',    label: 'Keuangan (Baca)'  },
]

type Tab = 'api_keys' | 'webhooks'

// ---- Create API Key Modal ----

function CreateApiKeyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (raw: string) => void
}) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>(['bookings:read'])
  const [expiresAt, setExpiresAt] = useState('')

  const create = useMutation({
    mutationFn: () => integrationApi.createApiKey({ name, scopes, expires_at: expiresAt || undefined }),
    onSuccess: (key) => {
      qc.invalidateQueries({ queryKey: ['api-keys'] })
      onCreated(key.key)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function toggleScope(scope: string) {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Buat API Key</h2>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Nama Key <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production API Key"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Scopes</label>
            <div className="space-y-2">
              {SCOPES.map((scope) => (
                <label key={scope.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scopes.includes(scope.value)}
                    onChange={() => toggleScope(scope.value)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-sm text-slate-700">{scope.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Kadaluarsa (opsional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={() => create.mutate()}
              disabled={!name || create.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Buat Key
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Raw Key Display Modal ----

function RawKeyModal({ rawKey, onClose }: { rawKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(rawKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">API Key Dibuat</h2>
        </div>
        <div className="space-y-4 p-6">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm font-medium text-amber-800">⚠️ Simpan key ini sekarang</p>
            <p className="text-xs text-amber-700 mt-1">
              Raw key hanya ditampilkan sekali. Setelah ditutup, tidak bisa dilihat lagi.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <code className="flex-1 text-xs font-mono text-slate-800 break-all">{rawKey}</code>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-md p-1.5 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            Saya Sudah Menyimpannya
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Create Webhook Modal ----

function CreateWebhookModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>(['booking.confirmed'])

  const create = useMutation({
    mutationFn: () => integrationApi.createWebhook({ url, events }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhooks'] })
      toast.success('Webhook berhasil dibuat')
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function toggleEvent(event: string) {
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Tambah Webhook</h2>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Endpoint URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.yourapp.com/webhooks/rentos"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Events</label>
            <div className="grid grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map((event) => (
                <label key={event} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={events.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-xs font-mono text-slate-600">{event}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={() => create.mutate()}
              disabled={!url || events.length === 0 || create.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Tambah
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- API Keys Tab ----

function APIKeysTab() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [rawKey, setRawKey] = useState<string | null>(null)

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: integrationApi.listApiKeys,
  })

  const revoke = useMutation({
    mutationFn: integrationApi.revokeApiKey,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); toast.success('API key dicabut') },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{apiKeys?.length ?? 0} API key aktif</p>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Buat API Key
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="space-y-0 divide-y divide-slate-100">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : !apiKeys?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Key className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">Belum ada API key</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {apiKeys.map((key) => (
              <div key={key.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Key className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800">{key.name}</p>
                    <StatusBadge status={key.status} size="sm" />
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{key.key_prefix}••••••••••••••••</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Dibuat {formatDate(key.created_at)}
                    {key.last_used_at && ` · Terakhir digunakan ${formatRelative(key.last_used_at)}`}
                    {key.expires_at && ` · Kadaluarsa ${formatDate(key.expires_at)}`}
                  </p>
                </div>
                <ConfirmDialog
                  trigger={
                    <button className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  }
                  title="Cabut API Key"
                  description={`API key "${key.name}" akan dicabut. Semua request menggunakan key ini akan gagal.`}
                  confirmLabel="Ya, Cabut"
                  onConfirm={() => revoke.mutateAsync(key.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateApiKeyModal
          onClose={() => setShowCreate(false)}
          onCreated={(raw) => { setShowCreate(false); setRawKey(raw) }}
        />
      )}

      {rawKey && <RawKeyModal rawKey={rawKey} onClose={() => setRawKey(null)} />}
    </div>
  )
}

// ---- Webhooks Tab ----

function WebhooksTab() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: integrationApi.listWebhooks,
  })

  const deleteWebhook = useMutation({
    mutationFn: integrationApi.deleteWebhook,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); toast.success('Webhook dihapus') },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{webhooks?.length ?? 0} webhook aktif</p>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Tambah Webhook
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : !webhooks?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Globe className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">Belum ada webhook</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {webhooks.map((wh) => (
              <div key={wh.id} className="flex items-start gap-4 px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 mt-0.5">
                  <Globe className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-medium text-slate-800 truncate">{wh.url}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {wh.events.slice(0, 4).map((event) => (
                      <span key={event} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                        {event}
                      </span>
                    ))}
                    {wh.events.length > 4 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                        +{wh.events.length - 4} lagi
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Dibuat {formatDate(wh.created_at)} ·{' '}
                    <span className={wh.is_active ? 'text-emerald-600' : 'text-slate-400'}>
                      {wh.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </p>
                </div>
                <ConfirmDialog
                  trigger={
                    <button className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  }
                  title="Hapus Webhook"
                  description={`Webhook ke "${wh.url}" akan dihapus permanen.`}
                  confirmLabel="Ya, Hapus"
                  onConfirm={() => deleteWebhook.mutateAsync(wh.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateWebhookModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}

// ---- Page ----

export default function IntegrationsPage() {
  const [tab, setTab] = useState<Tab>('api_keys')

  return (
    <div className="space-y-5">
      <PageHeader
        title="Integrasi"
        description="API Keys dan Webhooks untuk integrasi sistem eksternal"
        breadcrumbs={[{ label: 'Integrasi' }]}
      />

      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
        {[
          { key: 'api_keys' as Tab, label: 'API Keys', icon: Key      },
          { key: 'webhooks' as Tab, label: 'Webhooks', icon: Globe },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'api_keys' ? <APIKeysTab /> : <WebhooksTab />}
    </div>
  )
}
