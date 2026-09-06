'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Database, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, DataTable, type Column, ConfirmDialog } from '@/components/common'
import { categoryApi } from '@/lib/api/modules/masterdata'
import { formatDate } from '@/lib/utils'
import type { Category } from '@/types/api'

// ---- Form ----
function CategoryForm({
  initial,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initial?: Partial<Category>
  onSubmit: (data: { name: string; slug: string; description: string }) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [desc, setDesc] = useState(initial?.description ?? '')

  function handleNameChange(v: string) {
    setName(v)
    if (!initial?.id) {
      setSlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
    }
  }

  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit({ name, slug, description: desc }) }}
      className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-3"
    >
      <p className="text-sm font-semibold text-slate-800">
        {initial?.id ? 'Edit Kategori' : 'Tambah Kategori Baru'}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nama *</label>
          <input value={name} onChange={(e) => handleNameChange(e.target.value)}
            required placeholder="Alat Berat" className={inp} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Slug *</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)}
            required placeholder="alat-berat" className={inp} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Deskripsi</label>
        <input value={desc} onChange={(e) => setDesc(e.target.value)}
          placeholder="Deskripsi kategori..." className={inp} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-white">
          Batal
        </button>
        <button type="submit" disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {initial?.id ? 'Simpan' : 'Tambah'}
        </button>
      </div>
    </form>
  )
}

// ---- Page ----
export default function CategoriesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list(),
  })

  const create = useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Kategori ditambahkan'); setShowForm(false) },
    onError: (e: Error) => toast.error(e.message),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => categoryApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Kategori diperbarui'); setEditing(null) },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: categoryApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Kategori dihapus') },
    onError: (e: Error) => toast.error(e.message),
  })

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Nama',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <Database className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{row.name}</p>
            <p className="text-xs text-slate-400">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Deskripsi',
      cell: (row) => <span className="text-sm text-slate-600">{row.description ?? '—'}</span>,
    },
    {
      key: 'parent_id',
      header: 'Parent',
      cell: (row) => <span className="text-sm text-slate-500">{row.parent_id ? 'Sub-kategori' : 'Root'}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: 'w-24',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(row); setShowForm(false) }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ConfirmDialog
            trigger={
              <button onClick={(e) => e.stopPropagation()}
                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            }
            title="Hapus Kategori"
            description={`Kategori "${row.name}" akan dihapus. Aset yang menggunakan kategori ini perlu diperbarui.`}
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
        title="Kategori"
        description="Kelompokkan aset berdasarkan kategori"
        breadcrumbs={[{ label: 'Master Data' }, { label: 'Kategori' }]}
        actions={
          <button onClick={() => { setShowForm(true); setEditing(null) }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />Tambah Kategori
          </button>
        }
      />

      {showForm && (
        <CategoryForm
          onSubmit={(data) => create.mutate(data)}
          onCancel={() => setShowForm(false)}
          isLoading={create.isPending}
        />
      )}

      {editing && (
        <CategoryForm
          initial={editing}
          onSubmit={(data) => update.mutate({ id: editing.id, data })}
          onCancel={() => setEditing(null)}
          isLoading={update.isPending}
        />
      )}

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        emptyTitle="Belum ada kategori"
        emptyDescription="Tambahkan kategori untuk mengelompokkan aset Anda."
      />
    </div>
  )
}
