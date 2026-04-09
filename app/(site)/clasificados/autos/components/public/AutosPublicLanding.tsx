"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { AUTOS_LANDING_CATEGORY_PILLS } from "../../taxonomy/landingTaxonomy";
import { AUTOS_PUBLIC_BLUEPRINT_COPY } from "../../lib/autosPublicBlueprintCopy";
import type { AutosPublicLang } from "../../lib/autosPublicBlueprintCopy";
import { parseAutosBrowseUrl, serializeAutosBrowseUrl } from "../../filters/autosBrowseFilterContract";
import { emptyAutosPublicFilters } from "../../filters/autosPublicFilterTypes";
import { getFeaturedDealerListings, getStandardListings } from "../../data/sampleAutosPublicInventory";
import { AutosPublicFeaturedCard } from "./AutosPublicFeaturedCard";
import { AutosPublicStandardCard } from "./AutosPublicStandardCard";
import { useAutosPublicListingsFetch } from "./useAutosPublicListingsFetch";

const RESULTADOS_PATH = "/clasificados/autos/resultados";

export function AutosPublicLanding() {
  const sp = useSearchParams();
  const spStr = sp?.toString() ?? "";
  const lang: AutosPublicLang = useMemo(
    () => parseAutosBrowseUrl(new URLSearchParams(spStr)).lang,
    [spStr],
  );
  const copy = AUTOS_PUBLIC_BLUEPRINT_COPY[lang];

  const [searchQ, setSearchQ] = useState("");
  const [city, setCity] = useState("San Jose");
  const [zip, setZip] = useState("");

  useEffect(() => {
    const b = parseAutosBrowseUrl(new URLSearchParams(spStr));
    setSearchQ(b.q);
    setCity(b.filters.city.trim() || "San Jose");
    setZip(b.filters.zip);
  }, [spStr]);

  const { listings: inventory } = useAutosPublicListingsFetch();
  const featured = useMemo(() => getFeaturedDealerListings(inventory), [inventory]);
  const fresh = useMemo(() => getStandardListings(inventory).slice(0, 6), [inventory]);

  const resultsHref = (bundle: Parameters<typeof serializeAutosBrowseUrl>[0]) =>
    `${RESULTADOS_PATH}?${serializeAutosBrowseUrl(bundle)}`;

  const chipHref = (patch: Partial<ReturnType<typeof emptyAutosPublicFilters>>) =>
    resultsHref({
      filters: { ...emptyAutosPublicFilters(), ...patch },
      q: "",
      sort: "newest",
      page: 1,
      lang,
    });

  const searchHref = useMemo(() => {
    const filters = emptyAutosPublicFilters();
    filters.city = city.trim();
    filters.zip = zip.replace(/\D/g, "").slice(0, 5);
    return resultsHref({
      filters,
      q: searchQ.trim(),
      sort: "newest",
      page: 1,
      lang,
    });
  }, [lang, searchQ, city, zip]);

  const browseAllHref = resultsHref({
    filters: emptyAutosPublicFilters(),
    q: "",
    sort: "newest",
    page: 1,
    lang,
  });

  const publicarHref = appendLangToPath("/clasificados/publicar", lang as Lang);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] pb-[calc(6rem+env(safe-area-inset-bottom,0px))] text-[color:var(--lx-text)]">
      <Navbar />
      <div className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-[max(1rem,env(safe-area-inset-left))] py-3 pr-[max(1rem,env(safe-area-inset-right))] sm:px-5">
          <nav className="text-[11px] font-medium text-[color:var(--lx-muted)]">
            <Link href={appendLangToPath("/clasificados", lang as Lang)} className="hover:text-[color:var(--lx-text)]">
              {copy.breadcrumb}
            </Link>
            <span className="mx-1.5 opacity-50">/</span>
            <span className="text-[color:var(--lx-text)]">Autos</span>
          </nav>
          <Link
            href={publicarHref}
            className="inline-flex min-h-[44px] items-center rounded-full bg-[color:var(--lx-cta-dark)] px-4 py-2 text-xs font-bold text-[#FFFCF7] shadow-sm transition hover:bg-[color:var(--lx-cta-dark-hover)] active:opacity-90"
          >
            {copy.postAd}
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-[max(1rem,env(safe-area-inset-left))] py-8 pr-[max(1rem,env(safe-area-inset-right))] sm:px-5 sm:py-10">
        <header className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-4xl md:text-[2.35rem] md:leading-tight">
            {copy.title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:text-base">{copy.tagline}</p>
        </header>

        <section className="mx-auto mt-8 max-w-4xl rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-12px_rgba(42,36,22,0.12)] sm:p-6">
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
              className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(201,168,74,0.95),rgba(184,149,74,0.92))] px-4 py-3 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:brightness-[1.03] active:opacity-95"
            >
              {copy.searchCta}
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{copy.quickDiscovery}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link
              href={chipHref({ bodyStyle: "Sedan" })}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.chips.sedan}
            </Link>
            <Link
              href={chipHref({ bodyStyle: "SUV" })}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.chips.suv}
            </Link>
            <Link
              href={chipHref({ bodyStyle: "Truck" })}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.chips.truck}
            </Link>
            <Link
              href={chipHref({ bodyStyle: "Coupe" })}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.chips.coupe}
            </Link>
            <Link
              href={chipHref({ priceMin: "45000" })}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.chips.luxury}
            </Link>
            <Link
              href={chipHref({ fuelType: "Electric" })}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.chips.ev}
            </Link>
          </div>
        </section>

        <section className="mt-6">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{copy.filterSeller}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link
              href={chipHref({ sellerType: "dealer" })}
              className="rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-4 py-2 text-xs font-bold text-[color:var(--lx-text)] shadow-sm transition hover:brightness-[1.02]"
            >
              {copy.sellerDealer}
            </Link>
            <Link
              href={chipHref({ sellerType: "private" })}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold text-[color:var(--lx-text-2)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.sellerPrivate}
            </Link>
            <Link
              href={browseAllHref}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-2 text-xs font-semibold text-[color:var(--lx-muted)] transition hover:bg-[color:var(--lx-nav-hover)]"
            >
              {copy.sellerAll}
            </Link>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-bold text-[color:var(--lx-text)] sm:text-xl">{copy.featuredZoneTitle}</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {featured.map((l) => (
              <AutosPublicFeaturedCard key={l.id} listing={l} copy={copy} lang={lang} />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-bold text-[color:var(--lx-text)] sm:text-xl">{copy.freshTitle}</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {fresh.map((l) => (
              <AutosPublicStandardCard key={l.id} listing={l} copy={copy} lang={lang} compact />
            ))}
          </div>
        </section>

        <div className="mt-12 flex justify-center">
          <Link
            href={browseAllHref}
            className="inline-flex min-h-[52px] w-full max-w-md items-center justify-center rounded-2xl bg-[color:var(--lx-cta-dark)] px-8 py-3.5 text-sm font-bold text-[#FFFCF7] shadow-lg transition hover:bg-[color:var(--lx-cta-dark-hover)] active:opacity-90 sm:min-h-0"
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
