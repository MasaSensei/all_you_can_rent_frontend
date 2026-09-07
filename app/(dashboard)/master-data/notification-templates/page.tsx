"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, FileText, Pencil, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  DataTable,
  type Column,
  StatusBadge,
  ConfirmDialog,
} from "@/components/common";
import {
  notifTemplateApi,
  type NotifTemplate,
  type NotifTemplateCreate,
} from "@/lib/api/modules/masterdata";
import { formatDate } from "@/lib/utils/index";

const CHANNELS = [
  { value: "in_app", label: "In-App" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
];

const EVENT_TRIGGERS = [
  { value: "booking.created", label: "Booking Dibuat" },
  { value: "booking.confirmed", label: "Booking Dikonfirmasi" },
  { value: "booking.cancelled", label: "Booking Dibatalkan" },
  { value: "booking.completed", label: "Booking Selesai" },
  { value: "payment.succeeded", label: "Pembayaran Berhasil" },
  { value: "payment.failed", label: "Pembayaran Gagal" },
  { value: "invoice.created", label: "Invoice Dibuat" },
  { value: "invoice.overdue", label: "Invoice Jatuh Tempo" },
  { value: "maintenance.due", label: "Maintenance Jatuh Tempo" },
];

const VARIABLES = [
  "{{customer_name}}",
  "{{booking_number}}",
  "{{invoice_number}}",
  "{{amount}}",
  "{{start_date}}",
  "{{end_date}}",
  "{{asset_name}}",
];

function NotifTemplateModal({
  initial,
  onClose,
}: {
  initial?: NotifTemplate;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<NotifTemplateCreate>({
    name: initial?.name ?? "",
    channel: initial?.channel ?? "in_app",
    subject: initial?.subject ?? "",
    body: initial?.body ?? "",
    event_trigger: initial?.event_trigger ?? "booking.confirmed",
  });

  const create = useMutation({
    mutationFn: () => notifTemplateApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notif-templates"] });
      toast.success("Template ditambahkan");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: () => notifTemplateApi.update(initial!.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notif-templates"] });
      toast.success("Template diperbarui");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function insertVar(v: string) {
    setForm((f) => ({ ...f, body: f.body + v }));
  }

  const isPending = create.isPending || update.isPending;
  const inp =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {initial ? "Edit Template" : "Tambah Template Notifikasi"}
          </h2>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            initial ? update.mutate() : create.mutate();
          }}
          className="space-y-4 p-6"
        >
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Nama Template *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Booking Confirmed - WhatsApp"
              className={inp}
            />
          </div>

          {/* Channel + Trigger */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Channel *
              </label>
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                className={inp}
              >
                {CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Event Trigger *
              </label>
              <select
                value={form.event_trigger}
                onChange={(e) =>
                  setForm({ ...form, event_trigger: e.target.value })
                }
                className={inp}
              >
                {EVENT_TRIGGERS.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject (email only) */}
          {form.channel === "email" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Subject Email *
              </label>
              <input
                value={form.subject ?? ""}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required={form.channel === "email"}
                placeholder="Booking {{booking_number}} Telah Dikonfirmasi"
                className={inp}
              />
            </div>
          )}

          {/* Variables helper */}
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">
                Isi Pesan *
              </label>
              <Info
                className="h-3.5 w-3.5 text-slate-400"
                title="Gunakan variabel di bawah"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVar(v)}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
              rows={5}
              placeholder={`Halo {{customer_name}},\nBooking {{booking_number}} Anda telah dikonfirmasi.\nPeriode: {{start_date}} - {{end_date}}`}
              className={`${inp} resize-y`}
            />
          </div>

          {/* Preview */}
          {form.body && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                Preview
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {form.body
                  .replace(/{{customer_name}}/g, "Budi Santoso")
                  .replace(/{{booking_number}}/g, "BK-a1b2c3d4")
                  .replace(/{{amount}}/g, "Rp 1.500.000")
                  .replace(/{{start_date}}/g, "1 Jan 2025")
                  .replace(/{{end_date}}/g, "7 Jan 2025")
                  .replace(/{{asset_name}}/g, "Excavator CAT 320")
                  .replace(/{{invoice_number}}/g, "INV-001")}
              </p>
            </div>
          )}

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
              {initial ? "Simpan" : "Tambah Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NotificationTemplatesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<"create" | NotifTemplate | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["notif-templates"],
    queryFn: notifTemplateApi.list,
  });

  const remove = useMutation({
    mutationFn: notifTemplateApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notif-templates"] });
      toast.success("Template dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const CHANNEL_BADGE: Record<string, string> = {
    in_app: "bg-blue-100 text-blue-700",
    email: "bg-emerald-100 text-emerald-700",
    whatsapp: "bg-green-100 text-green-700",
    sms: "bg-amber-100 text-amber-700",
  };

  const columns: Column<NotifTemplate>[] = [
    {
      key: "name",
      header: "Template",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{row.name}</p>
            {row.subject && (
              <p className="text-xs text-slate-400 truncate max-w-xs">
                {row.subject}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      cell: (row) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CHANNEL_BADGE[row.channel] ?? "bg-slate-100 text-slate-600"}`}
        >
          {CHANNELS.find((c) => c.value === row.channel)?.label ?? row.channel}
        </span>
      ),
    },
    {
      key: "event_trigger",
      header: "Event",
      cell: (row) => (
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
          {row.event_trigger}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "created_at",
      header: "Dibuat",
      cell: (row) => (
        <span className="text-sm text-slate-500">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "w-20",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setModal(row);
            }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ConfirmDialog
            trigger={
              <button
                onClick={(e) => e.stopPropagation()}
                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            }
            title="Hapus Template"
            description={`Template "${row.name}" akan dihapus.`}
            confirmLabel="Ya, Hapus"
            onConfirm={() => remove.mutateAsync(row.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Template Notifikasi"
        description="Kustomisasi pesan yang dikirim ke customer"
        breadcrumbs={[
          { label: "Master Data" },
          { label: "Template Notifikasi" },
        ]}
        actions={
          <button
            onClick={() => setModal("create")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Template
          </button>
        }
      />

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        Gunakan variabel{" "}
        <code className="font-mono">{"{{nama_variabel}}"}</code> dalam isi
        pesan. Sistem akan menggantinya secara otomatis saat mengirim
        notifikasi.
      </div>

      <DataTable
        columns={columns}
        data={templates}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        emptyTitle="Belum ada template notifikasi"
        emptyDescription="Buat template untuk mengirim notifikasi otomatis ke customer."
      />

      {modal && (
        <NotifTemplateModal
          initial={modal === "create" ? undefined : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
