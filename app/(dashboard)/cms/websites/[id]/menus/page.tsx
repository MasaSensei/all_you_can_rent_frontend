'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Menu as MenuIcon, ArrowLeft, GripVertical, Trash2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, ConfirmDialog } from '@/components/common'
import { menuApi, websiteApi, type Menu, type MenuItem } from '@/lib/api/modules/cms'

// ---- Add Menu Item Form ----
function AddMenuItemForm({
  menuId,
  onSuccess,
}: {
  menuId: string
  onSuccess: () => void
}) {
  const qc = useQueryClient()
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')

  const add = useMutation({
    mutationFn: () => menuApi.addItem(menuId, { label, url: url || undefined, sort_order: 0 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu', menuId] })
      toast.success('Item ditambahkan')
      setLabel('')
      setUrl('')
      onSuccess()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); add.mutate() }}
      className="flex items-end gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">Label *</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} required
          placeholder="Beranda" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">URL</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="/" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button type="submit" disabled={add.isPending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 shrink-0">
        {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Tambah
      </button>
    </form>
  )
}

// ---- Menu Item Row ----
function MenuItemRow({ item, depth = 0 }: { item: MenuItem; depth?: number }) {
  const qc = useQueryClient()
  const remove = useMutation({
    mutationFn: () => menuApi.deleteItem(item.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menus'] })
      toast.success('Item dihapus')
    },
  })

  return (
    <>
      <div className={`flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 ${depth > 0 ? 'ml-6' : ''}`}>
        <GripVertical className="h-4 w-4 shrink-0 text-slate-300 cursor-grab" />
        {depth > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800">{item.label}</p>
          {item.url && <p className="text-xs text-slate-400 font-mono">{item.url}</p>}
        </div>
        <ConfirmDialog
          trigger={
            <button className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          }
          title="Hapus Item Menu"
          description={`Item "${item.label}" akan dihapus dari menu.`}
          confirmLabel="Ya, Hapus"
          onConfirm={() => remove.mutateAsync()}
        />
      </div>
      {item.children?.map((child) => (
        <MenuItemRow key={child.id} item={child} depth={depth + 1} />
      ))}
    </>
  )
}

// ---- Menu Card ----
function MenuCard({ menu }: { menu: Menu }) {
  const qc = useQueryClient()
  const [addingItem, setAddingItem] = useState(false)

  const LOCATION_LABELS: Record<string, string> = {
    header: 'Header', footer: 'Footer', sidebar: 'Sidebar',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <MenuIcon className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{menu.name}</p>
            {menu.location && (
              <p className="text-xs text-slate-400">
                {LOCATION_LABELS[menu.location] ?? menu.location}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setAddingItem((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah Item
        </button>
      </div>

      {/* Items */}
      <div className="p-4 space-y-2">
        {!menu.items?.length ? (
          <p className="text-center text-sm text-slate-400 py-4">
            Belum ada item. Tambahkan link navigasi di bawah.
          </p>
        ) : (
          menu.items.map((item) => (
            <MenuItemRow key={item.id} item={item} />
          ))
        )}

        {addingItem && (
          <AddMenuItemForm
            menuId={menu.id}
            onSuccess={() => setAddingItem(false)}
          />
        )}
      </div>
    </div>
  )
}

// ---- Create Menu Modal ----
function CreateMenuModal({ websiteId, onClose }: { websiteId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('header')

  const create = useMutation({
    mutationFn: () => menuApi.create({ name, location, website_id: websiteId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menus', websiteId] })
      toast.success('Menu dibuat')
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Buat Menu Baru</h2>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Menu *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              placeholder="Main Navigation"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Lokasi</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="header">Header</option>
              <option value="footer">Footer</option>
              <option value="sidebar">Sidebar</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Batal
            </button>
            <button type="submit" disabled={create.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Buat Menu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Page ----
export default function MenusPage() {
  const { id: websiteId } = useParams<{ id: string }>()
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)

  const { data: website } = useQuery({ queryKey: ['website', websiteId], queryFn: () => websiteApi.get(websiteId) })
  const { data: menus, isLoading } = useQuery({ queryKey: ['menus', websiteId], queryFn: () => menuApi.list(websiteId) })

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Menu — ${website?.title ?? '...'}`}
        breadcrumbs={[
          { label: 'CMS', href: '/cms' },
          { label: website?.title ?? '...' },
          { label: 'Menu' },
        ]}
        actions={
          <div className="flex gap-2">
            <button onClick={() => router.push('/cms')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" />Kembali
            </button>
            <button onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" />Buat Menu
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-200" />)}
        </div>
      ) : !menus?.length ? (
        <div className="flex flex-col items-center py-16 text-center rounded-xl border-2 border-dashed border-slate-200">
          <MenuIcon className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">Belum ada menu</p>
          <button onClick={() => setShowCreate(true)}
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + Buat Menu Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {menus.map((menu) => <MenuCard key={menu.id} menu={menu} />)}
        </div>
      )}

      {showCreate && <CreateMenuModal websiteId={websiteId} onClose={() => setShowCreate(false)} />}
    </div>
  )
}
