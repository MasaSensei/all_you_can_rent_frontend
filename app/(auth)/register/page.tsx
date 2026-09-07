"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Package, Check, Loader2, Eye, EyeOff } from "lucide-react";
import { post } from "@/lib/api/client";
import { cn } from "@/lib/utils";

// ---- Schema ----

const registerSchema = z
  .object({
    // Bisnis
    business_name: z.string().min(2, "Nama bisnis minimal 2 karakter").max(255),
    business_slug: z
      .string()
      .min(2, "Slug minimal 2 karakter")
      .max(50)
      .regex(/^[a-z0-9-]+$/, "Hanya huruf kecil, angka, dan tanda hubung"),
    business_phone: z.string().optional(),
    // Admin
    full_name: z.string().min(2, "Nama lengkap wajib diisi"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirm_password: z.string(),
    // Terms
    agree_terms: z.literal(true, {
      message: "Anda harus menyetujui syarat dan ketentuan",
    }),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirm_password"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

// ---- Plans ----

const PLANS = [
  {
    id: "trial",
    name: "Trial",
    price: "Gratis",
    duration: "14 hari",
    highlight: false,
    features: [
      "10 aset",
      "3 pengguna",
      "Inventori & Booking",
      "Keuangan dasar",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: "Rp 299.000",
    duration: "/bulan",
    highlight: false,
    features: [
      "50 aset",
      "5 pengguna",
      "Semua fitur Trial",
      "Laporan & Analitik",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: "Rp 799.000",
    duration: "/bulan",
    highlight: true,
    features: [
      "200 aset",
      "20 pengguna",
      "Semua fitur Starter",
      "CMS & Notifikasi",
      "Maintenance tracker",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Rp 1.999.000",
    duration: "/bulan",
    highlight: false,
    features: [
      "Tidak terbatas",
      "Pengguna tak terbatas",
      "Semua fitur",
      "API Keys & Webhooks",
      "Priority support",
    ],
  },
];

// ---- Field helper ----

function Field({
  label,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputCls = (hasErr?: boolean) =>
  cn(
    "w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-blue-500",
    hasErr ? "border-red-300 bg-red-50" : "border-slate-200 bg-white",
  );

// ---- Step 1: Pilih Plan ----

function PlanSelector({
  selected,
  onSelect,
  onNext,
}: {
  selected: string;
  onSelect: (plan: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">Pilih Plan</h2>
        <p className="mt-1 text-sm text-slate-500">
          Mulai dengan Trial gratis, upgrade kapan saja
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => onSelect(plan.id)}
            className={cn(
              "relative rounded-xl border-2 p-4 text-left transition-all",
              selected === plan.id
                ? "border-blue-600 bg-blue-50"
                : "border-slate-200 bg-white hover:border-slate-300",
              plan.highlight && "ring-2 ring-blue-200",
            )}
          >
            {plan.highlight && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wide">
                Populer
              </span>
            )}

            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {plan.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-bold text-slate-800">{plan.price}</span>{" "}
                  {plan.duration}
                </p>
              </div>
              {selected === plan.id && (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            <ul className="mt-3 space-y-1">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-1.5 text-xs text-slate-600"
                >
                  <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        Lanjut dengan Plan {PLANS.find((p) => p.id === selected)?.name}
      </button>
    </div>
  );
}

// ---- Step 2: Form Registrasi ----

function RegisterForm({ plan, onBack }: { plan: string; onBack: () => void }) {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { agree_terms: undefined as any },
  });

  // Auto-generate slug dari nama bisnis
  const businessName = watch("business_name");
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setValue("business_name", name);
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 50);
    setValue("business_slug", slug);
  }

  async function onSubmit(data: RegisterForm) {
    setServerError(null);
    setIsLoading(true);
    try {
      await post("/auth/register", {
        business_name: data.business_name,
        business_slug: data.business_slug,
        business_phone: data.business_phone,
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        plan,
      });
      router.push("/login?registered=1");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Registrasi gagal");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">
          Daftarkan Bisnis Anda
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Plan:{" "}
          <span className="font-semibold text-blue-600 capitalize">{plan}</span>
        </p>
      </div>

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Bisnis section */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Informasi Bisnis
        </p>

        <Field
          label="Nama Bisnis"
          required
          error={errors.business_name?.message}
        >
          <input
            {...register("business_name")}
            onChange={handleNameChange}
            placeholder="PT. Alat Berat Jaya"
            className={inputCls(!!errors.business_name)}
          />
        </Field>

        <Field
          label="URL Bisnis (slug)"
          required
          error={errors.business_slug?.message}
          hint="rentos.app/register/slug-bisnis-anda"
        >
          <div className="flex items-center gap-0">
            <span className="flex h-9 items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-100 px-3 text-xs text-slate-500">
              rentos.app/
            </span>
            <input
              {...register("business_slug")}
              placeholder="alat-berat-jaya"
              className={cn(inputCls(!!errors.business_slug), "rounded-l-none")}
            />
          </div>
        </Field>

        <Field
          label="Nomor Telepon Bisnis"
          error={errors.business_phone?.message}
        >
          <input
            {...register("business_phone")}
            type="tel"
            placeholder="+62 21 1234 5678"
            className={inputCls()}
          />
        </Field>
      </div>

      {/* Admin section */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Akun Admin
        </p>

        <Field label="Nama Lengkap" required error={errors.full_name?.message}>
          <input
            {...register("full_name")}
            placeholder="Budi Santoso"
            className={inputCls(!!errors.full_name)}
          />
        </Field>

        <Field label="Email" required error={errors.email?.message}>
          <input
            {...register("email")}
            type="email"
            placeholder="budi@bisnis.com"
            className={inputCls(!!errors.email)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Password" required error={errors.password?.message}>
            <div className="relative">
              <input
                {...register("password")}
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                className={cn(inputCls(!!errors.password), "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPass ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </Field>

          <Field
            label="Konfirmasi Password"
            required
            error={errors.confirm_password?.message}
          >
            <div className="relative">
              <input
                {...register("confirm_password")}
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                className={cn(inputCls(!!errors.confirm_password), "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </Field>
        </div>
      </div>

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          {...register("agree_terms")}
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
        />
        <span className="text-sm text-slate-600">
          Saya setuju dengan{" "}
          <a href="/terms" className="text-blue-600 hover:underline">
            Syarat & Ketentuan
          </a>{" "}
          dan{" "}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Kebijakan Privasi
          </a>{" "}
          RentOS
        </span>
      </label>
      {errors.agree_terms && (
        <p className="text-xs text-red-600">{errors.agree_terms.message}</p>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Mendaftarkan..." : "Daftar Sekarang"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          ← Kembali pilih plan
        </button>
      </div>
    </form>
  );
}

// ---- Page ----

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState("trial");

  return (
    <div className="rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
          <Package className="h-6 w-6 text-white" />
        </div>
        <p className="text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Masuk
          </Link>
        </p>
      </div>

      {step === 1 ? (
        <PlanSelector
          selected={selectedPlan}
          onSelect={setSelectedPlan}
          onNext={() => setStep(2)}
        />
      ) : (
        <RegisterForm plan={selectedPlan} onBack={() => setStep(1)} />
      )}
    </div>
  );
}
