"use client";

import Link from "next/link";
import { FormEvent } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";

const SEARCH_CANVAS =
  "overflow-hidden rounded-xl border border-[#D6C7AD]/90 bg-[#FFFDF7] shadow-[0_6px_22px_-16px_rgba(31,36,28,0.16)]";
const BTN_PRIMARY =
  "inline-flex min-h-[2.625rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721]";
const BTN_SECONDARY =
  "inline-flex min-h-[2.625rem] items-center justify-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3.5 text-sm font-semibold text-[#3D3428] hover:border-[#C9A84A] hover:bg-[#FBF7EF]";
const INPUT =
  "min-h-[2.625rem] w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#3D3428]/45";

export function ServiciosCompactSearchCanvas({ lang }: { lang: Lang }) {
  const resultsHref = buildCategoryResultsUrl("servicios", lang);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    params.set("lang", lang);
    const q = String(fd.get("q") ?? "").trim();
    const city = String(fd.get("city") ?? "").trim();
    const zip = String(fd.get("zip") ?? "").trim();
    const location = city || zip;
    if (q) params.set("q", q);
    if (location) params.set("city", location);
    window.location.href = `${resultsHref}?${params.toString()}`;
  };

  return (
    <div className="w-full min-w-0 space-y-2">
      <form onSubmit={onSubmit} className={SEARCH_CANVAS} role="search">
        <input type="hidden" name="lang" value={lang} />
        <div className="flex flex-col sm:grid sm:grid-cols-12 sm:items-stretch">
          <label className="flex min-h-[2.625rem] min-w-0 items-center border-b border-[#D6C7AD]/80 sm:col-span-5 sm:border-b-0 sm:border-r">
            <span className="shrink-0 pl-3 text-[#556B3E]" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              name="q"
              type="search"
              placeholder={lang === "es" ? "Servicio, oficio o negocio…" : "Service, trade, or business…"}
              aria-label={lang === "es" ? "Buscar" : "Search"}
              className={`${INPUT} min-w-0 flex-1 px-2`}
            />
          </label>
          <label className="flex min-h-[2.625rem] min-w-0 border-b border-[#D6C7AD]/80 sm:col-span-2 sm:border-b-0 sm:border-r">
            <input name="city" type="text" placeholder={lang === "es" ? "Ciudad" : "City"} aria-label={lang === "es" ? "Ciudad" : "City"} className={INPUT} />
          </label>
          <label className="flex min-h-[2.625rem] min-w-0 border-b border-[#D6C7AD]/80 sm:col-span-2 sm:border-b-0 sm:border-r">
            <input name="zip" type="text" inputMode="numeric" placeholder="ZIP" aria-label="ZIP" className={INPUT} />
          </label>
          <div className="flex gap-1.5 p-1.5 sm:col-span-3">
            <Link href={`${resultsHref}?lang=${lang}`} className={`${BTN_SECONDARY} flex-1 text-center`}>
              {lang === "es" ? "Filtros" : "Filters"}
            </Link>
            <button type="submit" className={`${BTN_PRIMARY} flex-[1.2]`}>
              {lang === "es" ? "Buscar" : "Search"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
