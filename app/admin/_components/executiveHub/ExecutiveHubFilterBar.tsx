"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adminInputClass, adminFilterRow, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import { EXECUTIVE_HUB_STATUSES, executiveHubStatusLabel } from "@/app/admin/_lib/executiveHubTypes";
import { EXECUTIVE_THEME_OPTIONS } from "@/app/lib/digitalContact/digitalContactExecutiveTheme";

/**
 * Search + status + theme filters for the Executive Hub list. Pushes query params so the
 * server component re-fetches/filters — no duplicate client-side data model, matches the
 * `q` search pattern already used on /admin/usuarios, with instant apply on change here.
 */
export function ExecutiveHubFilterBar({
  initialQuery,
  initialStatus,
  initialTheme,
}: {
  initialQuery: string;
  initialStatus: string;
  initialTheme: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushParams(next: { q?: string; status?: string; theme?: string }) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const merged = {
      q: next.q ?? initialQuery,
      status: next.status ?? initialStatus,
      theme: next.theme ?? initialTheme,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/admin/team/executive-hub?${params.toString()}`);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className={`${adminFilterRow} mb-4`}>
      <div className="flex flex-1 flex-col gap-1.5 sm:min-w-[240px]">
        <label htmlFor="exec-hub-search" className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">
          Search
        </label>
        <input
          id="exec-hub-search"
          type="search"
          value={query}
          placeholder="Name, title, company, email, phone…"
          className={adminInputClass}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => pushParams({ q: value }), 300);
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="exec-hub-status-filter" className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">
          Status
        </label>
        <select
          id="exec-hub-status-filter"
          value={initialStatus}
          className={adminInputClass}
          onChange={(e) => pushParams({ status: e.target.value })}
        >
          <option value="">All statuses</option>
          {EXECUTIVE_HUB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {executiveHubStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="exec-hub-theme-filter" className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">
          Theme
        </label>
        <select
          id="exec-hub-theme-filter"
          value={initialTheme}
          className={adminInputClass}
          onChange={(e) => pushParams({ theme: e.target.value })}
        >
          <option value="">All themes</option>
          {EXECUTIVE_THEME_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {initialQuery || initialStatus || initialTheme ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            router.push("/admin/team/executive-hub");
          }}
          className={`${adminCtaChipSecondary} text-xs`}
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
