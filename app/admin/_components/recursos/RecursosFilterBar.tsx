"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { adminInputClass, adminFilterRow, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import { PRIMARY_CATEGORIES } from "@/app/lib/recursos/categories";
import { URGENCY_LEVELS } from "@/app/lib/recursos/urgency";

/**
 * Search + category + urgency + verification + active filters for the Recursos admin list.
 * Pushes query params so the server component re-filters — same pattern as
 * `ExecutiveHubFilterBar` (no duplicate client-side data model).
 */
export function RecursosFilterBar({
  initialQuery,
  initialCategory,
  initialUrgency,
  initialVerification,
  initialActive,
}: {
  initialQuery: string;
  initialCategory: string;
  initialUrgency: string;
  initialVerification: string;
  initialActive: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushParams(next: Partial<{ q: string; category: string; urgency: string; verification: string; active: string }>) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const merged = {
      q: next.q ?? initialQuery,
      category: next.category ?? initialCategory,
      urgency: next.urgency ?? initialUrgency,
      verification: next.verification ?? initialVerification,
      active: next.active ?? initialActive,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/admin/recursos?${params.toString()}`);
  }

  const hasFilters = initialQuery || initialCategory || initialUrgency || initialVerification || initialActive;

  return (
    <div className={`${adminFilterRow} mb-4`}>
      <div className="flex flex-1 flex-col gap-1.5 sm:min-w-[220px]">
        <label htmlFor="recursos-search" className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">
          Search
        </label>
        <input
          id="recursos-search"
          type="search"
          value={query}
          placeholder="Organization, program…"
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
        <label htmlFor="recursos-category-filter" className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">
          Category
        </label>
        <select
          id="recursos-category-filter"
          value={initialCategory}
          className={adminInputClass}
          onChange={(e) => pushParams({ category: e.target.value })}
        >
          <option value="">All categories</option>
          {PRIMARY_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.labelEn}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="recursos-urgency-filter" className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">
          Urgency
        </label>
        <select
          id="recursos-urgency-filter"
          value={initialUrgency}
          className={adminInputClass}
          onChange={(e) => pushParams({ urgency: e.target.value })}
        >
          <option value="">All urgency levels</option>
          {URGENCY_LEVELS.map((u) => (
            <option key={u.level} value={u.level}>
              {u.labelEn}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="recursos-verification-filter" className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">
          Verification
        </label>
        <select
          id="recursos-verification-filter"
          value={initialVerification}
          className={adminInputClass}
          onChange={(e) => pushParams({ verification: e.target.value })}
        >
          <option value="">All statuses</option>
          <option value="verified">Verified</option>
          <option value="needs_review">Needs review</option>
          <option value="stale">Stale</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="recursos-active-filter" className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">
          Active
        </label>
        <select
          id="recursos-active-filter"
          value={initialActive}
          className={adminInputClass}
          onChange={(e) => pushParams({ active: e.target.value })}
        >
          <option value="">All</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
      </div>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            router.push("/admin/recursos");
          }}
          className={`${adminCtaChipSecondary} text-xs`}
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
