"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Package,
  LayoutDashboard,
  Box,
  CalendarCheck,
  CalendarDays,
  Users,
  Receipt,
  Wrench,
  Bell,
  Globe,
  BarChart3,
  Plug,
  Settings,
  ChevronLeft,
  LogOut,
  Database,
  Tag,
  Percent,
  FileText,
  UserCog,
  Shield,
  Gift,
} from "lucide-react";
import { cn, initials } from "@/lib/utils/index";
import { useUIStore } from "@/lib/stores/ui";
import { useAuthStore } from "@/lib/stores/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    label: "Utama",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Operasional",
    items: [
      { label: "Inventori", href: "/inventory", icon: Box },
      { label: "Booking", href: "/bookings", icon: CalendarCheck },
      { label: "Kalender", href: "/bookings/calendar", icon: CalendarDays },
      { label: "Customer", href: "/customers", icon: Users },
      { label: "Keuangan", href: "/finance", icon: Receipt },
      { label: "Maintenance", href: "/maintenance", icon: Wrench },
    ],
  },
  {
    label: "Master Data",
    items: [
      { label: "Kategori", href: "/master-data/categories", icon: Database },
      { label: "Aturan Harga", href: "/master-data/pricing-rules", icon: Tag },
      { label: "Kupon", href: "/master-data/coupons", icon: Percent },
      { label: "Pajak", href: "/master-data/taxes", icon: Receipt },
      {
        label: "Template Notif",
        href: "/master-data/notification-templates",
        icon: FileText,
      },
      { label: "Program Loyalti", href: "/master-data/loyalty", icon: Gift },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Notifikasi", href: "/notifications", icon: Bell },
      { label: "CMS", href: "/cms", icon: Globe },
      { label: "Laporan", href: "/reports", icon: BarChart3 },
      { label: "Integrasi", href: "/integrations", icon: Plug },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { label: "Pengguna", href: "/master-data/users", icon: UserCog },
      { label: "Roles", href: "/master-data/roles", icon: Shield },
      { label: "Pengaturan", href: "/settings", icon: Settings },
    ],
  },
];

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-blue-600 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        collapsed && "justify-center px-2",
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon
        className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "text-white" : "text-slate-400",
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleCollapsed = useUIStore((s) => s.toggleSidebarCollapsed);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[220px]",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-slate-200 px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <Package className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="ml-2.5 text-base font-bold text-slate-900 tracking-tight">
            RentOS
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {NAV.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      {user && (
        <div
          className={cn(
            "border-t border-slate-200 p-3",
            collapsed && "flex justify-center",
          )}
        >
          {collapsed ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
              {initials(user.first_name ?? user.username)}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {initials(user.first_name ?? user.username)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-700">
                  {user.first_name
                    ? `${user.first_name} ${user.last_name ?? ""}`
                    : user.username}
                </p>
                <p className="truncate text-xs text-slate-400">{user.email}</p>
              </div>
              <button
                onClick={() => logout()}
                title="Keluar"
                className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:text-slate-600 transition-colors"
        title={collapsed ? "Perluas sidebar" : "Perkecil sidebar"}
      >
        <ChevronLeft
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            collapsed && "rotate-180",
          )}
        />
      </button>
    </aside>
  );
}
