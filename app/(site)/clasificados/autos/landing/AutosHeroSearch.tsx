"use client";

import Link from "next/link";
import { FaSearch } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";
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
  mode = "full",
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
  /** `fields` — search panel only (CAT-STD-ALL landing slot). */
  mode?: "full" | "fields";
}) {
  const searchFields = (
        <div className="relative mx-auto w-full min-w-0 md:max-w-[min(100%,56rem)] lg:max-w-[min(100%,64rem)]">
          <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7A7A] sm:text-left">
            {copy.heroSearchPanelTitle}
          </p>
          <div className="rounded-[20px] border-2 border-[#D4A574]/45 bg-[#FFFCF7]/98 p-3 shadow-[0_16px_48px_-20px_rgba(212,165,116,0.35)] sm:p-5 md:p-6">
            <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-0">
              <div className="min-w-0 flex-1 xl:border-r xl:border-[#E5E5E5] xl:pr-5 2xl:pr-6">
                <label
                  className="mb-1.5 block text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[#1A1A1A]"
                  htmlFor="autos-landing-q"
                >
                  {copy.heroSearchFieldLabel}
                </label>
                <div className="relative">
                  <FaSearch
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D4A574]"
                    aria-hidden
                  />
                  <input
                    id="autos-landing-q"
                    className="min-h-[52px] w-full min-w-0 rounded-[14px] border-2 border-[#D4A574]/35 bg-[#FFFEF7] py-3 pl-11 pr-3 text-sm font-medium outline-none ring-[#D4A574]/50 focus:border-[#D4A574] focus:ring-2 md:min-h-[54px] md:text-[15px]"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder={copy.searchPlaceholder}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(11rem,14rem)_auto] xl:gap-4 xl:pl-5 2xl:pl-6">
                <div className="min-w-0 sm:col-span-1">
                  <label
                    className="mb-1 block text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[#7A7A7A]"
                    htmlFor="autos-landing-city"
                  >
                    {copy.cityLabel}
                  </label>
                  <p className="mb-1.5 text-[10px] leading-snug text-[#7A7A7A]">{copy.cityHelper}</p>
                  <input
                    id="autos-landing-city"
                    className="min-h-[48px] w-full min-w-0 rounded-[14px] border border-[#E5E5E5] bg-[#FFFEF7] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4A574] md:min-h-[50px] md:text-[15px]"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={copy.cityPlaceholder}
                    autoComplete="address-level2"
                  />
                </div>
                <div className="min-w-0 sm:col-span-1">
                  <label
                    className="mb-1 block text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[#7A7A7A]"
                    htmlFor="autos-landing-zip"
                  >
                    {copy.zipLabel}
                  </label>
                  <p className="mb-1.5 text-[10px] leading-snug text-[#7A7A7A]">{copy.zipHelper}</p>
                  <input
                    id="autos-landing-zip"
                    className="min-h-[48px] w-full min-w-0 rounded-[14px] border border-[#E5E5E5] bg-[#FFFEF7] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4A574] md:min-h-[50px] md:text-[15px]"
                    inputMode="numeric"
                    maxLength={5}
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder={copy.zipPlaceholder}
                    autoComplete="postal-code"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2 xl:col-span-1">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#7A7A7A] xl:hidden">
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
                  <p className="pb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A7A7A]">
                    {copy.heroRadiusShort}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch md:mt-6">
              <Link
                href={searchHref}
                className="inline-flex min-h-[54px] w-full flex-1 items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,rgba(212,165,116,0.98),rgba(193,154,107,0.94))] px-6 text-sm font-bold text-white shadow-[0_10px_32px_-8px_rgba(120,90,30,0.55)] transition hover:brightness-[1.04] active:opacity-95 md:text-[15px]"
              >
                <FaSearch className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                {copy.searchCta}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-[17rem]">
                <Link
                  href={browseAllHref}
                  className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[14px] border-2 border-[#D4A574]/40 bg-[#FFFAF0] px-5 text-sm font-semibold text-[#1A1A1A] transition hover:border-[#D4A574] hover:bg-[#F5F0E8] md:min-h-[52px] md:text-[15px]"
                >
                  {copy.browseAllShort}
                  <FiArrowRight className="h-4 w-4 shrink-0 text-[#D4A574]" aria-hidden />
                </Link>
                <p className="text-center text-[10px] leading-snug text-[#7A7A7A] sm:text-left">{copy.browseAllSecondaryHint}</p>
              </div>
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-[#7A7A7A] sm:text-xs md:mx-auto md:max-w-2xl">
              {copy.heroSearchFooterHint}
            </p>
            <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A7A7A] xl:hidden">
              {copy.heroRadiusShort}
            </p>
          </div>
        </div>
  );

  if (mode === "fields") return searchFields;

  return (
    <section className={`${autosLandingSectionClass} pb-5 sm:pb-7 md:pb-8`}>
      <div className="relative overflow-hidden rounded-[24px] border border-[#D4A574]/35 bg-[linear-gradient(165deg,rgba(255,250,240,0.98)_0%,rgba(255,252,247,0.92)_45%,rgba(245,240,232,0.88)_100%)] px-4 py-8 shadow-[0_22px_64px_-28px_rgba(212,165,116,0.45)] sm:px-6 sm:py-10 md:px-8 md:py-11">
        <header className="relative mx-auto max-w-[min(100%,44rem)] text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#D4A574]">{copy.heroEyebrow}</p>
          <h1 className="mt-3 text-balance font-serif text-[1.85rem] font-bold leading-[1.08] tracking-tight text-[#1A1A1A] sm:text-[2.25rem] md:text-[2.5rem] lg:text-[2.65rem]">
            {copy.heroHeading}
          </h1>
          <p className="mx-auto mt-3 max-w-[min(100%,38rem)] text-sm leading-relaxed text-[#4A4A4A] sm:mt-4 sm:text-base md:leading-relaxed">
            {copy.heroSubhead}
          </p>
          <p className="mx-auto mt-4 max-w-[min(100%,40rem)] text-xs leading-relaxed text-[#5C5346] sm:text-[13px]">
            {copy.heroSearchGuidance}
          </p>
        </header>
        <div className="relative mt-7 sm:mt-8">{searchFields}</div>
      </div>
    </section>
  );
}
