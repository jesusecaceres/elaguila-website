"use client";

import Link from "next/link";
import { FaSearch } from "react-icons/fa";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";
import { AutosGeolocationButton } from "../components/public/AutosGeolocationButton";
import { autosLandingSectionClass } from "./autosLandingLayout";

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
    <section className={`${autosLandingSectionClass} pb-5 sm:pb-7 md:pb-8`}>
      <header className="mx-auto max-w-[min(100%,40rem)] text-center sm:max-w-[42rem] lg:max-w-[44rem] xl:max-w-[46rem]">
        <h1 className="text-balance font-serif text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-[color:var(--lx-text)] sm:text-[2.1rem] md:text-[2.35rem] lg:text-[2.55rem] xl:text-[2.7rem] 2xl:text-[2.85rem]">
          {copy.heroHeading}
        </h1>
        <p className="mx-auto mt-3 max-w-[min(100%,36rem)] text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:mt-4 sm:text-base md:max-w-2xl lg:max-w-3xl lg:text-[1.05rem] lg:leading-relaxed">
          {copy.heroSubhead}
        </p>
      </header>

      <div
        className={
          "mx-auto mt-6 w-full min-w-0 rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/96 p-3 shadow-[0_18px_52px_-22px_rgba(42,36,22,0.32)] backdrop-blur-[6px] sm:mt-7 sm:max-w-[min(100%,40rem)] sm:p-5 md:mt-8 md:max-w-[min(100%,44rem)] md:p-6 lg:max-w-[min(100%,48rem)] xl:mt-9 xl:max-w-[min(100%,56rem)] 2xl:max-w-[68rem]"
        }
      >
        {/* Tablet / laptop: stack keyword row; wide desktop: split columns */}
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-0">
          <div className="min-w-0 flex-1 xl:border-r xl:border-[color:var(--lx-nav-border)] xl:pr-5 2xl:pr-6">
            <label className="mb-1.5 block text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]" htmlFor="autos-landing-q">
              {copy.heroSearchFieldLabel}
            </label>
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--lx-muted)]" aria-hidden />
              <input
                id="autos-landing-q"
                className="min-h-[48px] w-full min-w-0 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] py-3 pl-11 pr-3 text-sm outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2 md:min-h-[50px] md:text-[15px]"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={copy.searchPlaceholder}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(11rem,14rem)_auto] xl:gap-4 xl:pl-5 2xl:pl-6">
            <div className="min-w-0 sm:col-span-1">
              <label className="mb-1 block text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]" htmlFor="autos-landing-city">
                {copy.cityLabel}
              </label>
              <p className="mb-1.5 text-[10px] leading-snug text-[color:var(--lx-muted)]">{copy.cityHelper}</p>
              <input
                id="autos-landing-city"
                className="min-h-[48px] w-full min-w-0 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)] md:min-h-[50px] md:text-[15px]"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={copy.cityPlaceholder}
                autoComplete="address-level2"
              />
            </div>
            <div className="min-w-0 sm:col-span-1">
              <label className="mb-1 block text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]" htmlFor="autos-landing-zip">
                {copy.zipLabel}
              </label>
              <p className="mb-1.5 text-[10px] leading-snug text-[color:var(--lx-muted)]">{copy.zipHelper}</p>
              <input
                id="autos-landing-zip"
                className="min-h-[48px] w-full min-w-0 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)] md:min-h-[50px] md:text-[15px]"
                inputMode="numeric"
                maxLength={5}
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder={copy.zipPlaceholder}
                autoComplete="postal-code"
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2 xl:col-span-1">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)] xl:hidden">
                {copy.resultsUseLocation}
              </span>
              <AutosGeolocationButton
                copy={copy}
                className="w-full sm:max-w-xs"
                onResolved={({ city: c, zip: z }) => {
                  const canon = c.trim() ? getCanonicalCityName(c.trim()) || c.trim() : "";
                  setCity(canon || c);
                  setZip(z.replace(/\D/g, "").slice(0, 5));
                }}
              />
            </div>
            <div className="hidden items-end xl:flex xl:col-span-1">
              <p className="pb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">{copy.heroRadiusShort}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex w-full min-w-0 flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-3 md:mt-6">
          <Link
            href={searchHref}
            className="inline-flex min-h-[52px] w-full flex-1 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,rgba(201,168,74,0.98),rgba(184,149,74,0.94))] px-6 text-sm font-bold text-[#FFFCF7] shadow-[0_8px_28px_-8px_rgba(120,90,30,0.55)] transition hover:brightness-[1.03] active:opacity-95 sm:min-h-[52px] md:text-[15px] xl:min-w-[12rem] xl:flex-initial"
          >
            {copy.searchCta}
          </Link>
          <Link
            href={browseAllHref}
            className="inline-flex min-h-[48px] w-full flex-1 items-center justify-center rounded-[14px] border-2 border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-5 text-sm font-semibold text-[color:var(--lx-text-2)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] md:min-h-[50px] md:text-[15px] xl:max-w-[17rem]"
          >
            {copy.browseAllShort}
          </Link>
        </div>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-[color:var(--lx-muted)] sm:mt-4 sm:text-xs md:max-w-2xl md:mx-auto">
          {copy.heroSearchFooterHint}
        </p>
        <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--lx-muted)] xl:hidden">{copy.heroRadiusShort}</p>
      </div>
    </section>
  );
}
