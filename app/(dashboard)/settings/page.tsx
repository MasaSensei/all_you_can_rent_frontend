'use client'

import { useState } from 'react'
import { User, Shield, Tag, Plug, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/common'
import { useAuthStore } from '@/lib/stores/auth'

type Tab = 'profile' | 'security' | 'pricing' | 'api_keys'

const TABS = [
  { key: 'profile'  as Tab, label: 'Profil',         icon: User    },
  { key: 'security' as Tab, label: 'Keamanan',        icon: Shield  },
  { key: 'pricing'  as Tab, label: 'Aturan Harga',    icon: Tag     },
  { key: 'api_keys' as Tab, label: 'API Keys',         icon: Plug    },
]

// ---- Profile Tab ----
function ProfileTab() {
  const user = useAuthStore((s) => s.user)
  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name:  user?.last_name  ?? '',
    email:      user?.email      ?? '',
    username:   user?.username   ?? '',
  })

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">Informasi Profil</h3>
        <p className="text-sm text-slate-500 mt-0.5">Perbarui data akun Anda</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { label: 'Nama Depan',  key: 'first_name', placeholder: 'Budi' },
          { label: 'Nama Belakang', key: 'last_name', placeholder: 'Santoso' },
          { label: 'Email',       key: 'email',      placeholder: 'budi@email.com', type: 'email' },
          { label: 'Username',    key: 'username',   placeholder: 'budi_santoso' },
        ].map((field) => (
          <div key={field.key}>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {field.label}
            </label>
            <input
              type={field.type ?? 'text'}
              value={form[field.key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              placeholder={field.placeholder}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          Simpan Perubahan
        </button>
      </div>
    </div>
  )
}

// ---- Security Tab ----
function SecurityTab() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">Ubah Password</h3>
        <p className="text-sm text-slate-500 mt-0.5">Gunakan password yang kuat dan unik</p>
      </div>

      <div className="max-w-sm space-y-4">
        {[
          { label: 'Password Saat Ini', key: 'current' },
          { label: 'Password Baru',     key: 'next'    },
          { label: 'Konfirmasi Password Baru', key: 'confirm' },
        ].map((f) => (
          <div key={f.key}>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{f.label}</label>
            <input
              type="password"
              value={form[f.key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          Update Password
        </button>
      </div>
    </div>
  )
}

// ---- Pricing Rules Tab ----
function PricingTab() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">Aturan Harga</h3>
        <p className="text-sm text-slate-500 mt-0.5">Kelola tarif sewa per aset atau kategori</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Per Hari',   desc: 'Tarif harian standar',  icon: '📅' },
          { label: 'Per Jam',    desc: 'Tarif per jam',          icon: '⏰' },
          { label: 'Per Minggu', desc: 'Diskon untuk 7 hari+',  icon: '📆' },
        ].map((item) => (
          <button
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-sm font-medium text-slate-800">{item.label}</p>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
        <Tag className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-2 text-sm text-slate-500">
          Belum ada aturan harga. Tambahkan aturan untuk mulai menetapkan tarif otomatis.
        </p>
        <button className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          + Tambah Aturan
        </button>
      </div>
    </div>
  )
}

// ---- API Keys Tab ----
function APIKeysTab() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">API Keys</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola akses programatik ke RentOS API
          </p>
        </div>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          + Buat API Key
        </button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">⚠️ Keamanan API Key</p>
        <p className="text-xs text-amber-700 mt-1">
          Raw key hanya ditampilkan sekali saat dibuat. Simpan di tempat aman.
          Jangan bagikan atau commit ke repository.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
        <Plug className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-2 text-sm text-slate-500">
          Belum ada API key. Buat key untuk mengakses API secara programatik.
        </p>
      </div>
    </div>
  )
}

// ---- Page ----
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const TabContent = {
    profile:  ProfileTab,
    security: SecurityTab,
    pricing:  PricingTab,
    api_keys: APIKeysTab,
  }[activeTab]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pengaturan"
        description="Kelola akun dan konfigurasi platform"
        breadcrumbs={[{ label: 'Pengaturan' }]}
      />

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* Sidebar tabs */}
        <nav className="flex shrink-0 flex-row gap-1 lg:w-48 lg:flex-col">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6">
          <TabContent />
        </div>
      </div>
    </div>
  )
}
