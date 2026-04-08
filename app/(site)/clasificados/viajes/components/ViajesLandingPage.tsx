"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import { getViajesUi } from "../data/viajesUiCopy";
import { ViajesAudienceBuckets } from "./ViajesAudienceBuckets";
import { ViajesCategoryCarousel } from "./ViajesCategoryCarousel";
import { ViajesDestinations } from "./ViajesDestinations";
import { ViajesHero } from "./ViajesHero";
import { ViajesLangSwitch } from "./ViajesLangSwitch";
import { ViajesLocalDepartures } from "./ViajesLocalDepartures";
import { ViajesLowerSections } from "./ViajesLowerSections";
import { ViajesSearchBar } from "./ViajesSearchBar";
import { ViajesTopOffers } from "./ViajesTopOffers";
import { ViajesTrustFooter } from "./ViajesTrustFooter";
import { ViajesTrustStrip } from "./ViajesTrustStrip";

export function ViajesLandingPage() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const ui = getViajesUi(lang);

  const clasificadosHref = appendLangToPath("/clasificados", lang);
  const publicarHref = appendLangToPath("/publicar/viajes", lang);
  const homeBackHref = appendLangToPath("/clasificados/viajes", lang);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] pb-20 text-[color:var(--lx-text)]">
      <Navbar />
      <div className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-6">
          <nav className="text-[11px] font-medium text-[color:var(--lx-muted)]" aria-label="Breadcrumb">
            <Link href={clasificadosHref} className="hover:text-[color:var(--lx-text)]">
              {ui.breadcrumbClassifieds}
            </Link>
            <span className="mx-1.5 opacity-50">/</span>
            <span className="text-[color:var(--lx-text)]">{ui.categoryViajes}</span>
          </nav>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ViajesLangSwitch compact />
            <Link
              href={publicarHref}
              className="rounded-full bg-[color:var(--lx-cta-dark)] px-4 py-2 text-xs font-bold text-[#FFFCF7] shadow-sm transition hover:bg-[color:var(--lx-cta-dark-hover)]"
            >
              {ui.postListing}
            </Link>
          </div>
        </div>
      </div>

      <ViajesHero ui={ui} searchBar={<ViajesSearchBar lang={lang} ui={ui} />} />

      <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-5 lg:px-6">
        <ViajesTrustStrip ui={ui} />
        <section className="mt-8 sm:mt-10">
          <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)] sm:text-left">
            {ui.exploreByTripType}
          </p>
          <ViajesCategoryCarousel lang={lang} ui={ui} />
        </section>

        <ViajesTopOffers homeBackHref={homeBackHref} ui={ui} />
        <ViajesLocalDepartures ui={ui} />
        <ViajesDestinations ui={ui} />
        <ViajesAudienceBuckets ui={ui} />
        <ViajesLowerSections homeBackHref={homeBackHref} ui={ui} />
      </main>
      <ViajesTrustFooter ui={ui} />
    </div>
  );
}
