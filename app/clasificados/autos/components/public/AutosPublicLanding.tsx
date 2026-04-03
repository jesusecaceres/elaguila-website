"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { AUTOS_LANDING_CATEGORY_PILLS } from "../../taxonomy/landingTaxonomy";
import { AUTOS_PUBLIC_BLUEPRINT_COPY } from "../../lib/autosPublicBlueprintCopy";
import type { AutosPublicLang } from "../../lib/autosPublicBlueprintCopy";
import {
  AUTOS_PUBLIC_SAMPLE_LISTINGS,
  getFeaturedDealerListings,
  getStandardListings,
} from "../../data/sampleAutosPublicInventory";
import { AutosPublicFeaturedCard } from "./AutosPublicFeaturedCard";
import { AutosPublicStandardCard } from "./AutosPublicStandardCard";

export function AutosPublicLanding() {
  const sp = useSearchParams();
  const lang: AutosPublicLang = sp?.get("lang") === "en" ? "en" : "es";
  const copy = AUTOS_PUBLIC_BLUEPRINT_COPY[lang];

  const [searchQ, setSearchQ] = useState("");
  const [city, setCity] = useState("San Jose");
  const [zip, setZip] = useState("");

  const featured = useMemo(() => getFeaturedDealerListings(AUTOS_PUBLIC_SAMPLE_LISTINGS), []);
  const fresh = useMemo(() => getStandardListings(AUTOS_PUBLIC_SAMPLE_LISTINGS).slice(0, 6), []);

  const resultsHref = (extra: Record<string, string>) => {
    const q = new URLSearchParams({ lang, ...extra });
    return `/clasificados/autos/resultados?${q.toString()}`;
  };

  const searchHref = useMemo(() => {
    const q = new URLSearchParams({ lang });
    if (searchQ.trim()) q.set("q", searchQ.trim());
    if (city.trim()) q.set("city", city.trim());
    const z = zip.replace(/\D/g, "").slice(0, 5);
    if (z.length === 5) q.set("zip", z);
    return `/clasificados/autos/resultados?${q.toString()}`;
  }, [lang, searchQ, city, zip]);

  const publicarHref = appendLangToPath("/clasificados/publicar", lang as Lang);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] pb-24 text-[color:var(--lx-text)]">
      <Navbar />
      <div className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <nav className="text-[11px] font-medium text-[color:var(--lx-muted)]">
            <Link href={appendLangToPath("/clasificados", lang as Lang)} className="hover:text-[color:var(--lx-text)]">
              {copy.breadcrumb}
            </Link>
            <span className="mx-1.5 opacity-50">/</span>
            <span className="text-[color:var(--lx-text)]">Autos</span>
          </nav>
          <Link
            href={publicarHref}
            className="rounded-full bg-[color:var(--lx-cta-dark)] px-4 py-2 text-xs font-bold text-[#FFFCF7] shadow-sm transition hover:bg-[color:var(--lx-cta-dark-hover)]"
          >
            {copy.postAd}
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-10">
        <header className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-4xl md:text-[2.35rem] md:leading-tight">
            {copy.title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:text-base">{copy.tagline}</p>
        </header>

        <section className="mx-auto mt-8 max-w-4xl rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-12px_rgba(42,36,22,0.12)] sm:p-5">
          <div className="flex flex-col gap-3">
            <div className="min-w-0">
              <label className="mb-1 block text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">
                {copy.searchPlaceholder}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--lx-muted)]" aria-hidden>
                  ⌕
                </span>
                <input
                  className="w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] py-3 pl-9 pr-3 text-sm outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder={copy.searchPlaceholder}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">
                  {copy.cityLabel}
                </label>
                <input
                  className="w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={copy.cityPlaceholder}
                />
              </div>
              <div>
                <label className="mb-1 block text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">
                  {copy.zipLabel}
                </label>
                <input
                  className="w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]"
                  inputMode="numeric"
                  maxLength={5}
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder={copy.zipPlaceholder}
                />
              </div>
            </div>
            <Link
              href={searchHref}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(201,168,74,0.95),rgba(184,149,74,0.92))] px-4 py-3 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:brightness-[1.03]"
            >
              {copy.searchCta}
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{copy.quickDiscovery}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link
              href={resultsHref({ bodyStyle: "Sedan" })}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.chips.sedan}
            </Link>
            <Link
              href={resultsHref({ bodyStyle: "SUV" })}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.chips.suv}
            </Link>
            <Link
              href={resultsHref({ bodyStyle: "Truck" })}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.chips.truck}
            </Link>
            <Link
              href={resultsHref({ bodyStyle: "Coupe" })}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.chips.coupe}
            </Link>
            <Link
              href={resultsHref({ priceMin: "45000" })}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.chips.luxury}
            </Link>
            <Link
              href={resultsHref({ fuelType: "Electric" })}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.chips.ev}
            </Link>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-bold text-[color:var(--lx-text)] sm:text-xl">{copy.featuredZoneTitle}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((l) => (
              <AutosPublicFeaturedCard key={l.id} listing={l} copy={copy} />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-bold text-[color:var(--lx-text)] sm:text-xl">{copy.freshTitle}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fresh.map((l) => (
              <AutosPublicStandardCard key={l.id} listing={l} copy={copy} compact />
            ))}
          </div>
        </section>

        <div className="mt-12 flex justify-center">
          <Link
            href={appendLangToPath("/clasificados/autos/resultados", lang as Lang)}
            className="inline-flex min-h-[52px] w-full max-w-md items-center justify-center rounded-2xl bg-[color:var(--lx-cta-dark)] px-8 py-3.5 text-sm font-bold text-[#FFFCF7] shadow-lg transition hover:bg-[color:var(--lx-cta-dark-hover)] sm:min-h-0"
          >
            {copy.browseAll}
          </Link>
        </div>

        <section className="mt-12 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-4 sm:p-5">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{copy.hubNote}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {AUTOS_LANDING_CATEGORY_PILLS.map(({ key, labelEs, labelEn }) => (
              <Link
                key={key}
                href={appendLangToPath(`/clasificados/${key}`, lang as Lang)}
                className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-1.5 text-xs font-medium text-[color:var(--lx-text-2)] transition hover:bg-[color:var(--lx-nav-hover)]"
              >
                {lang === "es" ? labelEs : labelEn}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
