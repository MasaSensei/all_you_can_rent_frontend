"use client";

import { useRef, type ChangeEvent } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// ---- Types ----

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterSelect {
  key: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  /** Search input */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** Dropdown selects (e.g. status, type) */
  selects?: FilterSelect[];
  /** Total results — shown on the right */
  total?: number;
  /** Whether any filter is active */
  hasActiveFilter?: boolean;
  /** Called when user clicks "Reset" */
  onReset?: () => void;
  className?: string;
}

export function FilterBar({
  search,
  selects,
  total,
  hasActiveFilter,
  onReset,
  className,
}: FilterBarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />

      {/* Search */}
      {search && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={search.value}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              search.onChange(e.target.value)
            }
            placeholder={search.placeholder ?? "Cari..."}
            className="h-9 w-56 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          {search.value && (
            <button
              onClick={() => {
                search.onChange("");
                searchRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Selects */}
      {selects?.map((sel) => (
        <div key={sel.key} className="relative">
          <select
            value={sel.value}
            onChange={(e) => sel.onChange(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="">{sel.placeholder}</option>
            {sel.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Chevron */}
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            ▾
          </span>
        </div>
      ))}

      {/* Reset */}
      {hasActiveFilter && onReset && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Reset
        </button>
      )}

      {/* Total — push to right */}
      {total !== undefined && (
        <span className="ml-auto text-sm text-slate-400">{total} hasil</span>
      )}
    </div>
  );
}
