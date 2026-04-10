"use client";

import Link from "next/link";
import { FaSearch } from "react-icons/fa";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";

export function AutosHeroSearch({
  copy,
  searchQ,
  setSearchQ,
  city,
  setCity,
  zip,
  setZip,
  searchHref,
  browseAllHref,
}: {
  copy: AutosPublicBlueprintCopy;
  searchQ: string;
  setSearchQ: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  zip: string;
  setZip: (v: string) => void;
  searchHref: string;
  browseAllHref: string;
}) {
  return (
    <section className="mx-auto w-full max-w-[1280px] min-w-0 px-4 sm:px-5 md:px-6">
      <header className="mx-auto max-w-3xl text-center">
        <h1 className="text-balance font-serif text-[1.85rem] font-semibold leading-[1.12] tracking-tight text-[color:var(--lx-text)] sm:text-[2.35rem] md:text-[2.6rem]">
          {copy.heroHeading}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:text-base">{copy.heroSubhead}</p>
      </header>

      <div className="mx-auto mt-6 max-w-[960px] min-w-0 rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/95 p-3 shadow-[0_16px_48px_-20px_rgba(42,36,22,0.28)] backdrop-blur-sm sm:mt-8 sm:p-5 md:p-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-0">
          <div className="min-w-0 flex-1 lg:border-r lg:border-[color:var(--lx-nav-border)] lg:pr-4">
            <label className="mb-1.5 block text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]" htmlFor="autos-landing-q">
              {copy.heroSearchFieldLabel}
            </label>
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--lx-muted)]" aria-hidden />
              <input
                id="autos-landing-q"
                className="min-h-[48px] w-full min-w-0 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] py-3 pl-11 pr-3 text-sm outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={copy.searchPlaceholder}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:gap-3 lg:pl-4">
            <div className="min-w-0">
              <label className="mb-1 block text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]" htmlFor="autos-landing-city">
                {copy.cityLabel}
              </label>
              <p className="mb-1.5 text-[10px] leading-snug text-[color:var(--lx-muted)]">{copy.cityHelper}</p>
              <input
                id="autos-landing-city"
                className="min-h-[48px] w-full min-w-0 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={copy.cityPlaceholder}
                autoComplete="address-level2"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]" htmlFor="autos-landing-zip">
                {copy.zipLabel}
              </label>
              <p className="mb-1.5 text-[10px] leading-snug text-[color:var(--lx-muted)]">{copy.zipHelper}</p>
              <input
                id="autos-landing-zip"
                className="min-h-[48px] w-full min-w-0 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                inputMode="numeric"
                maxLength={5}
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder={copy.zipPlaceholder}
                autoComplete="postal-code"
              />
            </div>
            <div className="hidden items-end lg:flex">
              <p className="pb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">{copy.heroRadiusShort}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
          <Link
            href={searchHref}
            className="inline-flex min-h-[52px] w-full flex-1 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,rgba(201,168,74,0.98),rgba(184,149,74,0.94))] px-6 text-sm font-bold text-[#FFFCF7] shadow-[0_8px_28px_-8px_rgba(120,90,30,0.55)] transition hover:brightness-[1.03] active:opacity-95 sm:min-w-[200px]"
          >
            {copy.searchCta}
          </Link>
          <Link
            href={browseAllHref}
            className="inline-flex min-h-[48px] w-full flex-1 items-center justify-center rounded-[14px] border-2 border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-5 text-sm font-semibold text-[color:var(--lx-text-2)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] sm:max-w-[280px]"
          >
            {copy.browseAllShort}
          </Link>
        </div>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-[color:var(--lx-muted)] sm:text-xs">{copy.heroSearchFooterHint}</p>
        <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--lx-muted)] lg:hidden">{copy.heroRadiusShort}</p>
      </div>
    </section>
  );
}
