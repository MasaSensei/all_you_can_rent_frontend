'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { post } from '@/lib/api/client'

const schema = z.object({
  email: z.string().email('Format email tidak valid'),
})
type Form = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: Form) {
    setIsLoading(true)
    setServerError(null)
    try {
      await post('/auth/forgot-password', { email: data.email })
      setSent(true)
    } catch (err: unknown) {
      // Even on error, show sent state to avoid email enumeration
      setSent(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
          <Package className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Lupa Password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Masukkan email akun Anda untuk mendapatkan link reset
        </p>
      </div>

      {sent ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-7 w-7 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Email terkirim!</p>
            <p className="mt-1 text-sm text-slate-500">
              Jika email <strong>{getValues('email')}</strong> terdaftar, Anda akan menerima instruksi reset password dalam beberapa menit.
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Tidak menerima email? Cek folder spam atau{' '}
            <button onClick={() => setSent(false)} className="text-blue-600 hover:underline">
              coba lagi
            </button>
          </p>
          <Link href="/login"
            className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke halaman login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email *
            </label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="email@bisnis.com"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke login
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
