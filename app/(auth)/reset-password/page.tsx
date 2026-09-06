'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { post } from '@/lib/api/client'
import { cn } from '@/lib/utils'

const schema = z
  .object({
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirm:  z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirm'],
  })

type Form = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  if (!token) {
    return (
      <div className="rounded-2xl bg-white/95 p-8 shadow-2xl text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">Link tidak valid</p>
          <p className="mt-1 text-sm text-slate-500">
            Token reset password tidak ditemukan atau sudah kadaluarsa.
          </p>
        </div>
        <Link href="/forgot-password"
          className="inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          Minta Link Baru
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-white/95 p-8 shadow-2xl text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-7 w-7 text-emerald-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">Password berhasil direset!</p>
          <p className="mt-1 text-sm text-slate-500">
            Silakan login dengan password baru Anda.
          </p>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Login Sekarang
        </button>
      </div>
    )
  }

  async function onSubmit(data: Form) {
    setIsLoading(true)
    setServerError(null)
    try {
      await post('/auth/reset-password', { token, password: data.password })
      setSuccess(true)
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : 'Token sudah kadaluarsa, minta link baru'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const inputCls = (hasErr?: boolean) =>
    cn(
      'w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
      hasErr ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
    )

  return (
    <div className="rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
          <Package className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Reset Password</h1>
        <p className="mt-1 text-sm text-slate-500">Buat password baru untuk akun Anda</p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
          {' '}
          <Link href="/forgot-password" className="font-medium underline">
            Minta link baru
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Password Baru *
          </label>
          <div className="relative">
            <input {...register('password')}
              type={showPass ? 'text' : 'password'}
              placeholder="Minimal 8 karakter"
              className={cn(inputCls(!!errors.password), 'pr-10')} />
            <button type="button" onClick={() => setShowPass((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Konfirmasi Password *
          </label>
          <div className="relative">
            <input {...register('confirm')}
              type={showConfirm ? 'text' : 'password'}
              placeholder="Ulangi password baru"
              className={cn(inputCls(!!errors.confirm), 'pr-10')} />
            <button type="button" onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirm && (
            <p className="mt-1 text-xs text-red-600">{errors.confirm.message}</p>
          )}
        </div>

        <button type="submit" disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? 'Menyimpan...' : 'Reset Password'}
        </button>
      </form>
    </div>
  )
}
