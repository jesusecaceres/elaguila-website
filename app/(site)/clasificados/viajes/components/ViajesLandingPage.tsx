"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import { getViajesUi } from "../data/viajesUiCopy";
import { ViajesAudienceBuckets } from "./ViajesAudienceBuckets";
import { ViajesCategoryPillsPanel } from "./ViajesCategoryPillsPanel";
import { ViajesDestinations } from "./ViajesDestinations";
import { ViajesHero } from "./ViajesHero";
import { ViajesLandingAmbience } from "./ViajesLandingAmbience";
import { ViajesLandingTierBreak } from "./ViajesLandingTierBreak";
import { ViajesLangSwitch } from "./ViajesLangSwitch";
import { ViajesLocalDepartures } from "./ViajesLocalDepartures";
import { ViajesLowerSections } from "./ViajesLowerSections";
import { ViajesPublishCtaBand } from "./ViajesPublishCtaBand";
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
  const browseAllHref = appendLangToPath("/clasificados/viajes/resultados", lang);

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-16 text-[color:var(--lx-text)] sm:pb-20">
      <ViajesLandingAmbience />

      <div className="relative z-[2] min-w-0">
        <Navbar />

        <div className="relative z-30 border-b border-[color:var(--lx-gold-border)]/55 bg-[#fffdf9]/88 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl min-w-0 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-6">
            <nav className="min-w-0 text-[11px] font-medium text-[color:var(--lx-muted)]" aria-label="Breadcrumb">
              <Link href={clasificadosHref} className="transition hover:text-sky-900 hover:underline">
                {ui.breadcrumbClassifieds}
              </Link>
              <span className="mx-1.5 opacity-50">/</span>
              <span className="font-semibold text-[color:var(--lx-text)]">{ui.categoryViajes}</span>
            </nav>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ViajesLangSwitch compact />
              <Link
                href={publicarHref}
                className="rounded-full bg-[color:var(--lx-cta-dark)] px-4 py-2 text-xs font-bold text-[#FFFCF7] shadow-[0_8px_20px_-10px_rgba(42,36,22,0.35)] transition hover:bg-[color:var(--lx-cta-dark-hover)]"
              >
                {ui.postListing}
              </Link>
            </div>
          </div>
        </div>

        <ViajesHero
          ui={ui}
          searchBar={<ViajesSearchBar lang={lang} ui={ui} />}
          tripPills={<ViajesCategoryPillsPanel lang={lang} ui={ui} />}
        />

        <main className="relative mx-auto max-w-7xl min-w-0 px-4 pb-10 pt-10 sm:px-5 sm:pt-12 lg:px-6">
          <ViajesTopOffers homeBackHref={homeBackHref} browseAllHref={browseAllHref} ui={ui} />
          <ViajesLocalDepartures ui={ui} browseAllHref={browseAllHref} />

          <ViajesLandingTierBreak label={ui.landing.tier2Eyebrow} />

          <ViajesDestinations ui={ui} browseAllHref={browseAllHref} />
          <ViajesAudienceBuckets ui={ui} browseAllHref={browseAllHref} />

          <ViajesLowerSections homeBackHref={homeBackHref} ui={ui} />

          <ViajesLandingTierBreak label={ui.landing.trustTransitionBreak} />

          <ViajesTrustStrip ui={ui} className="mt-0" />

          <ViajesPublishCtaBand ui={ui} href={publicarHref} />
        </main>

        <ViajesTrustFooter ui={ui} />
      </div>
    </div>
  );
}
