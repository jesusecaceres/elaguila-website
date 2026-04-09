"use client";

import { useId, useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa";

type Props = {
  keywordPlaceholder: string;
  locationPlaceholder: string;
  filtersLabel: string;
  searchLabel: string;
  initialKeyword?: string;
};

export function EmpleosSearchBar({
  keywordPlaceholder,
  locationPlaceholder,
  filtersLabel,
  searchLabel,
  initialKeyword = "",
}: Props) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [location, setLocation] = useState("");
  useEffect(() => {
    setKeyword(initialKeyword);
  }, [initialKeyword]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();

  return (
    <div className="rounded-lg border border-black/[0.06] bg-white p-4 shadow-[0_4px_24px_rgba(30,24,16,0.08)] sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-3">
        <label className="min-w-0 flex-1 lg:min-h-[44px]">
          <span className="sr-only">{keywordPlaceholder}</span>
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={keywordPlaceholder}
            autoComplete="off"
            className="h-11 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] placeholder:text-[color:var(--lx-muted)] focus:ring-2"
          />
        </label>
        <label className="min-w-0 flex-1 lg:min-h-[44px]">
          <span className="sr-only">{locationPlaceholder}</span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={locationPlaceholder}
            autoComplete="address-level2"
            className="h-11 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] placeholder:text-[color:var(--lx-muted)] focus:ring-2"
          />
        </label>
        <div className="relative lg:w-40 lg:shrink-0">
          <button
            type="button"
            id={filtersId}
            aria-expanded={filtersOpen}
            aria-haspopup="dialog"
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-black/[0.08] bg-white px-3 text-left text-sm font-medium text-[color:var(--lx-text-2)] transition hover:bg-neutral-50"
          >
            {filtersLabel}
            <FaChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-[color:var(--lx-muted)] transition ${filtersOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {filtersOpen ? (
            <div
              role="dialog"
              aria-labelledby={filtersId}
              className="absolute left-0 right-0 top-full z-20 mt-2 rounded-lg border border-black/[0.08] bg-white p-4 shadow-lg"
            >
              <p className="text-xs text-[color:var(--lx-muted)]">
                Los filtros estructurados se conectarán cuando el flujo de publicación esté activo.
              </p>
            </div>
          ) : null}
        </div>
        <div className="lg:w-36 lg:shrink-0">
          <button
            type="button"
            className="h-11 w-full rounded-lg bg-[#C41E3A] text-sm font-bold text-white shadow-sm transition hover:bg-[#A01830]"
          >
            {searchLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
