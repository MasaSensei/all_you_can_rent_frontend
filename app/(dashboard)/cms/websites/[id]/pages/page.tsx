'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, FileText, Pencil, Trash2, Eye, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, DataTable, type Column, StatusBadge, ConfirmDialog } from '@/components/common'
import { pageApi, websiteApi, type Page } from '@/lib/api/modules/cms'
import { formatDate } from '@/lib/utils'

function PageModal({
  websiteId,
  initial,
  onClose,
}: {
  websiteId: string
  initial?: Page
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title:    initial?.title    ?? '',
    slug:     initial?.slug     ?? '',
    content:  initial?.content  ?? '',
    template: initial?.template ?? 'default',
    status:   initial?.status   ?? 'draft',
  })

  const create = useMutation({
    mutationFn: () => pageApi.create({ ...form, website_id: websiteId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pages', websiteId] }); toast.success('Halaman dibuat'); onClose() },
    onError: (e: Error) => toast.error(e.message),
  })
  const update = useMutation({
    mutationFn: () => pageApi.update(initial!.id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pages', websiteId] }); toast.success('Halaman diperbarui'); onClose() },
    onError: (e: Error) => toast.error(e.message),
  })

  function handleTitleChange(v: string) {
    setForm((f) => ({
      ...f, title: v,
      slug: !initial?.id ? v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : f.slug,
    }))
  }

  const isPending = create.isPending || update.isPending
  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {initial ? 'Edit Halaman' : 'Halaman Baru'}
          </h2>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); initial ? update.mutate() : create.mutate() }}
          className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Judul *</label>
              <input value={form.title} onChange={(e) => handleTitleChange(e.target.value)}
                required placeholder="Tentang Kami" className={inp} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Slug *</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required placeholder="tentang-kami" className={inp} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Template</label>
              <select value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })} className={inp}>
                <option value="default">Default</option>
                <option value="landing">Landing Page</option>
                <option value="contact">Kontak</option>
                <option value="blank">Blank</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
                <option value="draft">Draft</option>
                <option value="published">Dipublikasi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Konten</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={10} placeholder="Tulis konten halaman di sini... (HTML/Markdown didukung)"
              className={`${inp} resize-y font-mono text-xs`} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Batal
            </button>
            <button type="submit" disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial ? 'Simpan' : 'Buat Halaman'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PagesPage() {
  const { id: websiteId } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | Page | null>(null)

  const { data: website } = useQuery({ queryKey: ['website', websiteId], queryFn: () => websiteApi.get(websiteId) })
  const { data: pages, isLoading } = useQuery({ queryKey: ['pages', websiteId], queryFn: () => pageApi.list(websiteId) })

  const remove = useMutation({
    mutationFn: pageApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pages', websiteId] }); toast.success('Halaman dihapus') },
    onError: (e: Error) => toast.error(e.message),
  })

  const columns: Column<Page>[] = [
    {
      key: 'title', header: 'Halaman',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{row.title}</p>
            <p className="text-xs text-slate-400">/{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'template', header: 'Template',
      cell: (row) => <span className="text-sm text-slate-600 capitalize">{row.template ?? 'default'}</span>,
    },
    {
      key: 'status', header: 'Status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'created_at', header: 'Diperbarui',
      cell: (row) => <span className="text-sm text-slate-500">{formatDate(row.updated_at)}</span>,
    },
    {
      key: 'actions', header: '', width: 'w-28', align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status === 'published' && website && (
            <a href={`https://${website.domain}/${row.slug}`} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600">
              <Eye className="h-3.5 w-3.5" />
            </a>
          )}
          <button onClick={(e) => { e.stopPropagation(); setModal(row) }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ConfirmDialog
            trigger={<button onClick={(e) => e.stopPropagation()}
              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" /></button>}
            title="Hapus Halaman"
            description={`Halaman "${row.title}" akan dihapus permanen.`}
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
        title={`Halaman — ${website?.title ?? '...'}`}
        description={website?.domain}
        breadcrumbs={[
          { label: 'CMS', href: '/cms' },
          { label: website?.title ?? '...', href: '/cms' },
          { label: 'Halaman' },
        ]}
        actions={
          <div className="flex gap-2">
            <button onClick={() => router.push('/cms')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" />Kembali
            </button>
            <button onClick={() => setModal('create')}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" />Halaman Baru
            </button>
          </div>
        }
      />
      <DataTable columns={columns} data={pages} isLoading={isLoading} rowKey={(r) => r.id}
        emptyTitle="Belum ada halaman"
        emptyDescription="Buat halaman pertama untuk website ini."
        onRowClick={(row) => setModal(row)} />
      {modal && <PageModal websiteId={websiteId} initial={modal === 'create' ? undefined : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
