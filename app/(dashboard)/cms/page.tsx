"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Globe,
  Loader2,
  FileText,
  Menu,
  BookOpen,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, ConfirmDialog, StatusBadge } from "@/components/common";
import { websiteApi, type Website } from "@/lib/api/modules/cms";
import { formatDate } from "@/lib/utils/index";

// ---- Create/Edit Website Modal ----
function WebsiteModal({
  initial,
  onClose,
}: {
  initial?: Website;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    domain: initial?.domain ?? "",
    title: initial?.title ?? "",
    theme: initial?.theme ?? "default",
  });

  const create = useMutation({
    mutationFn: () => websiteApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["websites"] });
      toast.success("Website ditambahkan");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: () => websiteApi.update(initial!.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["websites"] });
      toast.success("Website diperbarui");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isPending = create.isPending || update.isPending;
  const inp =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {initial ? "Edit Website" : "Tambah Website"}
          </h2>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            initial ? update.mutate() : create.mutate();
          }}
          className="space-y-4 p-6"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Judul Website *
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="Toko Rental Jaya"
              className={inp}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Domain *
            </label>
            <input
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              required
              placeholder="rental-jaya.com"
              className={inp}
            />
            <p className="mt-1 text-xs text-slate-400">
              Domain tanpa https:// (contoh: rental-jaya.com)
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Theme
            </label>
            <select
              value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
              className={inp}
            >
              <option value="default">Default</option>
              <option value="minimal">Minimal</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Website Card ----
function WebsiteCard({ website }: { website: Website }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);

  const remove = useMutation({
    mutationFn: () => websiteApi.delete(website.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["websites"] });
      toast.success("Website dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const quickLinks = [
    {
      label: "Halaman",
      icon: FileText,
      href: `/cms/websites/${website.id}/pages`,
      count: null,
    },
    {
      label: "Menu",
      icon: Menu,
      href: `/cms/websites/${website.id}/menus`,
      count: null,
    },
    {
      label: "Blog",
      icon: BookOpen,
      href: `/cms/blogs?website_id=${website.id}`,
      count: null,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Globe className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{website.title}</p>
            <a
              href={`https://${website.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              {website.domain}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <StatusBadge status={website.status} size="sm" />
          <button
            onClick={() => setShowEdit(true)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ConfirmDialog
            trigger={
              <button className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            }
            title="Hapus Website"
            description={`Website "${website.title}" beserta semua halaman dan menu akan dihapus.`}
            confirmLabel="Ya, Hapus"
            onConfirm={async () => {
              await remove.mutateAsync();
            }}
          />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
        {quickLinks.map((link) => (
          <button
            key={link.label}
            onClick={() => router.push(link.href)}
            className="flex flex-col items-center gap-1.5 py-3 hover:bg-slate-50 transition-colors"
          >
            <link.icon className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">
              {link.label}
            </span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-5 py-2.5">
        <p className="text-xs text-slate-400">
          Theme: {website.theme ?? "default"} · Dibuat{" "}
          {formatDate(website.created_at)}
        </p>
      </div>

      {showEdit && (
        <WebsiteModal initial={website} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
}

// ---- Page ----
export default function CMSPage() {
  const [showCreate, setShowCreate] = useState(false);

  const { data: websites, isLoading } = useQuery({
    queryKey: ["websites"],
    queryFn: websiteApi.list,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="CMS"
        description="Kelola website, halaman, menu, dan blog"
        breadcrumbs={[{ label: "CMS" }]}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Website
          </button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>
      ) : !websites?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border-2 border-dashed border-slate-200">
          <Globe className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">
            Belum ada website
          </p>
          <p className="text-sm text-slate-400">
            Tambahkan website pertama untuk mulai mengelola konten
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            + Tambah Website
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {websites.map((w) => (
            <WebsiteCard key={w.id} website={w} />
          ))}
        </div>
      )}

      {showCreate && <WebsiteModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
