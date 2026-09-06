'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, BookOpen, Pencil, Trash2, Send, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, DataTable, type Column, StatusBadge, ConfirmDialog, FilterBar } from '@/components/common'
import { blogApi, websiteApi, type Blog, type BlogCategory } from '@/lib/api/modules/cms'
import { formatDate } from '@/lib/utils'

// ---- Blog Modal ----
function BlogModal({ initial, onClose }: { initial?: Blog; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: websites } = useQuery({ queryKey: ['websites'], queryFn: websiteApi.list })
  const { data: categories } = useQuery({ queryKey: ['blog-categories'], queryFn: blogApi.listCategories })

  const [form, setForm] = useState({
    title:            initial?.title            ?? '',
    slug:             initial?.slug             ?? '',
    website_id:       initial?.website_id       ?? '',
    blog_category_id: initial?.blog_category_id ?? '',
    content:          initial?.content          ?? '',
    featured_image:   initial?.featured_image   ?? '',
    status:           initial?.status           ?? 'draft',
  })

  function handleTitleChange(v: string) {
    setForm((f) => ({
      ...f, title: v,
      slug: !initial?.id
        ? v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : f.slug,
    }))
  }

  const create = useMutation({
    mutationFn: () => blogApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blogs'] }); toast.success('Artikel dibuat'); onClose() },
    onError: (e: Error) => toast.error(e.message),
  })
  const update = useMutation({
    mutationFn: () => blogApi.update(initial!.id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blogs'] }); toast.success('Artikel diperbarui'); onClose() },
    onError: (e: Error) => toast.error(e.message),
  })

  const isPending = create.isPending || update.isPending
  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {initial ? 'Edit Artikel' : 'Artikel Baru'}
          </h2>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); initial ? update.mutate() : create.mutate() }}
          className="space-y-4 p-6">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Judul *</label>
            <input value={form.title} onChange={(e) => handleTitleChange(e.target.value)}
              required placeholder="Cara Memilih Alat Berat yang Tepat" className={inp} />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Slug</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="cara-memilih-alat-berat" className={inp} />
          </div>

          {/* Website + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Website *</label>
              <select value={form.website_id}
                onChange={(e) => setForm({ ...form, website_id: e.target.value })}
                required className={inp}>
                <option value="">Pilih website...</option>
                {(websites ?? []).map((w) => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Kategori</label>
              <select value={form.blog_category_id}
                onChange={(e) => setForm({ ...form, blog_category_id: e.target.value })}
                className={inp}>
                <option value="">Tanpa kategori</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Featured image */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">URL Gambar Utama</label>
            <input value={form.featured_image}
              onChange={(e) => setForm({ ...form, featured_image: e.target.value })}
              placeholder="https://..." className={inp} />
            {form.featured_image && (
              <img src={form.featured_image} alt="preview"
                className="mt-2 h-24 w-full rounded-lg object-cover border border-slate-200"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
          </div>

          {/* Content */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Konten</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={12} placeholder="Tulis artikel di sini... (HTML/Markdown didukung)"
              className={`${inp} resize-y font-mono text-xs leading-relaxed`} />
            <p className="mt-1 text-xs text-slate-400">
              {form.content.length} karakter · {Math.ceil(form.content.split(/\s+/).length / 200)} menit baca
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
            <div className="flex gap-2">
              {[
                { value: 'draft',     label: 'Draft'        },
                { value: 'published', label: 'Dipublikasi'  },
              ].map((s) => (
                <button key={s.value} type="button"
                  onClick={() => setForm({ ...form, status: s.value })}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    form.status === s.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  {s.label}
                </button>
              ))}
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
              {initial ? 'Simpan' : 'Buat Artikel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Category sidebar ----
function CategorySidebar({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (id: string) => void
}) {
  const qc = useQueryClient()
  const { data: categories } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: blogApi.listCategories,
  })
  const [newCat, setNewCat] = useState('')

  const create = useMutation({
    mutationFn: () => blogApi.createCategory({
      name: newCat,
      slug: newCat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blog-categories'] }); setNewCat('') },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="w-48 shrink-0 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Kategori</p>
      <div className="space-y-0.5">
        <button onClick={() => onSelect('')}
          className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
            !selected ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'
          }`}>
          Semua Artikel
        </button>
        {(categories ?? []).map((c) => (
          <button key={c.id} onClick={() => onSelect(c.id)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              selected === c.id ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Add category */}
      <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="flex gap-1">
        <input value={newCat} onChange={(e) => setNewCat(e.target.value)}
          placeholder="Kategori baru"
          className="flex-1 min-w-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" disabled={!newCat || create.isPending}
          className="rounded-lg bg-slate-800 px-2 py-1.5 text-xs text-white hover:bg-slate-700 disabled:opacity-50">
          +
        </button>
      </form>
    </div>
  )
}

// ---- Page ----
export default function BlogsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | Blog | null>(null)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const { data: blogs, isLoading } = useQuery({
    queryKey: ['blogs', search, categoryId],
    queryFn: () => blogApi.list({
      search: search || undefined,
      blog_category_id: categoryId || undefined,
    }),
  })

  const remove = useMutation({
    mutationFn: blogApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blogs'] }); toast.success('Artikel dihapus') },
    onError: (e: Error) => toast.error(e.message),
  })

  const publish = useMutation({
    mutationFn: blogApi.publish,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blogs'] }); toast.success('Artikel dipublikasi') },
    onError: (e: Error) => toast.error(e.message),
  })

  const columns: Column<Blog>[] = [
    {
      key: 'title', header: 'Artikel',
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.featured_image ? (
            <img src={row.featured_image} alt={row.title}
              className="h-10 w-16 shrink-0 rounded-lg object-cover border border-slate-200" />
          ) : (
            <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <BookOpen className="h-4 w-4 text-slate-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{row.title}</p>
            <p className="text-xs text-slate-400">/{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'published_at', header: 'Tanggal',
      cell: (row) => (
        <span className="text-sm text-slate-500">
          {row.published_at ? formatDate(row.published_at) : formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: 'actions', header: '', width: 'w-32', align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status === 'draft' && (
            <ConfirmDialog
              trigger={
                <button onClick={(e) => e.stopPropagation()}
                  className="rounded-md p-1.5 text-emerald-500 hover:bg-emerald-50" title="Publish">
                  <Send className="h-3.5 w-3.5" />
                </button>
              }
              title="Publikasikan Artikel"
              description={`Artikel "${row.title}" akan dipublikasikan dan dapat diakses publik.`}
              confirmLabel="Ya, Publish"
              variant="warning"
              onConfirm={() => publish.mutateAsync(row.id)}
            />
          )}
          <button onClick={(e) => { e.stopPropagation(); setModal(row) }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ConfirmDialog
            trigger={<button onClick={(e) => e.stopPropagation()}
              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" /></button>}
            title="Hapus Artikel"
            description={`Artikel "${row.title}" akan dihapus permanen.`}
            confirmLabel="Ya, Hapus"
            onConfirm={() => remove.mutateAsync(row.id)}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Blog"
        description="Kelola artikel dan konten blog"
        breadcrumbs={[{ label: 'CMS', href: '/cms' }, { label: 'Blog' }]}
        actions={
          <button onClick={() => setModal('create')}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />Artikel Baru
          </button>
        }
      />

      <FilterBar
        search={{ value: search, onChange: (v) => setSearch(v), placeholder: 'Cari judul artikel...' }}
        hasActiveFilter={!!search}
        onReset={() => setSearch('')}
      />

      <div className="flex gap-6">
        {/* Category sidebar */}
        <CategorySidebar selected={categoryId} onSelect={setCategoryId} />

        {/* Blog table */}
        <div className="flex-1 min-w-0">
          <DataTable
            columns={columns}
            data={blogs}
            isLoading={isLoading}
            rowKey={(r) => r.id}
            emptyTitle="Belum ada artikel"
            emptyDescription="Buat artikel pertama untuk mulai mengisi blog website Anda."
            onRowClick={(row) => setModal(row)}
          />
        </div>
      </div>

      {modal && (
        <BlogModal initial={modal === 'create' ? undefined : modal} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
