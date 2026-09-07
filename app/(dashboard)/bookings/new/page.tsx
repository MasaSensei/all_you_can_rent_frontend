"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  Box,
  Users,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { useAssets, useCustomers, useCreateBooking } from "@/lib/hooks";
import { PageHeader, StatusBadge } from "@/components/common";
import { formatCurrency, formatDate, cn } from "@/lib/utils/index";
import type { Asset, Customer } from "@/types/api";

// ---- Types ----

interface BookingItem {
  asset: Asset;
  quantity: number;
  start_date: string;
  end_date: string;
}

type Step = 1 | 2 | 3;

// ---- Step indicator ----

const STEPS = [
  { step: 1 as Step, label: "Pilih Aset", icon: Box },
  { step: 2 as Step, label: "Pilih Customer", icon: Users },
  { step: 3 as Step, label: "Konfirmasi", icon: ClipboardCheck },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.step} className="flex items-center gap-0 flex-1">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
                s.step < current
                  ? "border-blue-600 bg-blue-600 text-white"
                  : s.step === current
                    ? "border-blue-600 bg-white text-blue-600"
                    : "border-slate-200 bg-white text-slate-400",
              )}
            >
              {s.step < current ? (
                <Check className="h-4 w-4" />
              ) : (
                <s.icon className="h-4 w-4" />
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium whitespace-nowrap",
                s.step === current
                  ? "text-blue-600"
                  : s.step < current
                    ? "text-slate-600"
                    : "text-slate-400",
              )}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "h-0.5 flex-1 mb-5 mx-2 transition-colors",
                s.step < current ? "bg-blue-600" : "bg-slate-200",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---- Step 1: Pilih Aset ----

function StepAsset({
  selected,
  onSelect,
  onNext,
}: {
  selected: BookingItem | null;
  onSelect: (item: BookingItem) => void;
  onNext: () => void;
}) {
  const { data: assets, isLoading } = useAssets({ per_page: 50 });
  const [search, setSearch] = useState("");
  const [dates, setDates] = useState({ start_date: "", end_date: "" });
  const [qty, setQty] = useState(1);
  const [chosen, setChosen] = useState<Asset | null>(null);

  const filtered = (assets ?? []).filter(
    (a) =>
      a.is_available &&
      (search === "" || a.name.toLowerCase().includes(search.toLowerCase())),
  );

  function handleSelect(asset: Asset) {
    setChosen(asset);
  }

  function handleConfirm() {
    if (!chosen || !dates.start_date || !dates.end_date) return;
    onSelect({
      asset: chosen,
      quantity: qty,
      start_date: dates.start_date,
      end_date: dates.end_date,
    });
    onNext();
  }

  return (
    <div className="space-y-5">
      {/* Date & qty row */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">
          Periode Sewa
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Mulai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dates.start_date}
              onChange={(e) =>
                setDates({ ...dates, start_date: e.target.value })
              }
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Selesai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dates.end_date}
              onChange={(e) => setDates({ ...dates, end_date: e.target.value })}
              min={dates.start_date || new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Jumlah
            </label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Asset list */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4 flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aset..."
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-slate-400">
            {filtered.length} tersedia
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Tidak ada aset tersedia
              </p>
            ) : (
              filtered.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleSelect(asset)}
                  className={cn(
                    "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors",
                    chosen?.id === asset.id
                      ? "bg-blue-50"
                      : "hover:bg-slate-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      chosen?.id === asset.id ? "bg-blue-600" : "bg-slate-100",
                    )}
                  >
                    {chosen?.id === asset.id ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : (
                      <Box className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {asset.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={asset.condition} size="sm" />
                      {asset.location && (
                        <span className="text-xs text-slate-400">
                          {asset.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {asset.current_value && (
                    <span className="text-sm font-medium text-slate-600 shrink-0">
                      {formatCurrency(asset.current_value)}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleConfirm}
          disabled={!chosen || !dates.start_date || !dates.end_date}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          Lanjut
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---- Step 2: Pilih Customer ----

function StepCustomer({
  selected,
  onSelect,
  onNext,
  onBack,
}: {
  selected: Customer | null;
  onSelect: (c: Customer) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { data: customers, isLoading } = useCustomers({ per_page: 50 });
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<Customer | null>(selected);

  const filtered = (customers ?? []).filter(
    (c) =>
      search === "" ||
      `${c.first_name} ${c.last_name} ${c.email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  function handleConfirm() {
    if (!chosen) return;
    onSelect(chosen);
    onNext();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email customer..."
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Customer tidak ditemukan
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChosen(c)}
                  className={cn(
                    "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors",
                    chosen?.id === c.id ? "bg-blue-50" : "hover:bg-slate-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      chosen?.id === c.id
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-700",
                    )}
                  >
                    {chosen?.id === c.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      `${c.first_name[0]}${c.last_name[0]}`
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {c.first_name} {c.last_name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{c.email}</p>
                  </div>
                  <StatusBadge status={c.customer_type} size="sm" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Kembali
        </button>
        <button
          onClick={handleConfirm}
          disabled={!chosen}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          Lanjut
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---- Step 3: Konfirmasi ----

function StepConfirm({
  item,
  customer,
  onBack,
  onSubmit,
  isLoading,
}: {
  item: BookingItem;
  customer: Customer;
  onBack: () => void;
  onSubmit: (notes: string, coupon: string) => void;
  isLoading: boolean;
}) {
  const [notes, setNotes] = useState("");
  const [coupon, setCoupon] = useState("");

  const durationDays = Math.ceil(
    (new Date(item.end_date).getTime() - new Date(item.start_date).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Asset */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Box className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-700">Aset</h3>
          </div>
          <p className="font-medium text-slate-900">{item.asset.name}</p>
          <p className="text-sm text-slate-500 mt-1">
            {formatDate(item.start_date)} — {formatDate(item.end_date)}
          </p>
          <p className="text-sm text-slate-500">
            {durationDays} hari · Qty: {item.quantity}
          </p>
        </div>

        {/* Customer */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-700">Customer</h3>
          </div>
          <p className="font-medium text-slate-900">
            {customer.first_name} {customer.last_name}
          </p>
          <p className="text-sm text-slate-500 mt-1">{customer.email}</p>
          {customer.phone && (
            <p className="text-sm text-slate-500">{customer.phone}</p>
          )}
        </div>
      </div>

      {/* Notes + Coupon */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Kode Kupon (opsional)
          </label>
          <input
            type="text"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            placeholder="DISKON10"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Catatan
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instruksi khusus, lokasi pengiriman, dll..."
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Kembali
        </button>
        <button
          onClick={() => onSubmit(notes, coupon)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          <ClipboardCheck className="h-4 w-4" />
          Buat Booking
        </button>
      </div>
    </div>
  );
}

// ---- Page ----

export default function NewBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [bookingItem, setBookingItem] = useState<BookingItem | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const createBooking = useCreateBooking();

  async function handleSubmit(notes: string, couponCode: string) {
    if (!bookingItem || !customer) return;
    const booking = await createBooking.mutateAsync({
      customer_id: customer.id,
      items: [
        {
          asset_id: bookingItem.asset.id,
          quantity: bookingItem.quantity,
          start_date: new Date(bookingItem.start_date).toISOString(),
          end_date: new Date(bookingItem.end_date).toISOString(),
        },
      ],
      coupon_code: couponCode || undefined,
      notes: notes || undefined,
    });
    router.push(`/bookings/${booking.id}`);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Buat Booking Baru"
        breadcrumbs={[
          { label: "Booking", href: "/bookings" },
          { label: "Buat Baru" },
        ]}
      />

      <div className="mx-auto max-w-2xl">
        <StepIndicator current={step} />

        {step === 1 && (
          <StepAsset
            selected={bookingItem}
            onSelect={setBookingItem}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <StepCustomer
            selected={customer}
            onSelect={setCustomer}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && bookingItem && customer && (
          <StepConfirm
            item={bookingItem}
            customer={customer}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
            isLoading={createBooking.isPending}
          />
        )}
      </div>
    </div>
  );
}
