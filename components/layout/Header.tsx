"use client";

import { Menu, Bell, Search } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      {/* Left: mobile hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <h2 className="text-sm font-semibold text-slate-700 lg:hidden">
            {title}
          </h2>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Command search (⌘K) */}
        <button
          className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-50 transition-colors md:flex"
          onClick={() => useUIStore.getState().toggleCommand()}
        >
          <Search className="h-4 w-4" />
          <span>Cari...</span>
          <kbd className="ml-2 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative rounded-md p-1.5 text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5" />
          {/* Unread dot */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
