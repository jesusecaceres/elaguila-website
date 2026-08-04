"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";

import { buildViajesBrowseUrl, defaultViajesBrowseState } from "../lib/buildViajesResultsUrl";
import type { ViajesBusinessResult } from "../data/viajesResultsSampleData";
import { getViajesUi } from "../data/viajesUiCopy";
import { ViajesAudienceBuckets } from "./ViajesAudienceBuckets";
import { ViajesDestinations } from "./ViajesDestinations";
import { ViajesHero } from "./ViajesHero";
import { ViajesLandingIntentPills } from "./ViajesLandingIntentPills";
import { ViajesLangSwitch } from "./ViajesLangSwitch";
import { ViajesLocalDepartures } from "./ViajesLocalDepartures";
import { ViajesLowerSections } from "./ViajesLowerSections";
import { ViajesMobilitySection } from "./ViajesMobilitySection";
import { ViajesNearbyEscapes } from "./ViajesNearbyEscapes";
import { ViajesPublishCtaBand } from "./ViajesPublishCtaBand";
import { ViajesSearchBar } from "./ViajesSearchBar";
import { ViajesStaySection } from "./ViajesStaySection";
import { ViajesTopOffers } from "./ViajesTopOffers";
import { ViajesTrustFooter } from "./ViajesTrustFooter";
import { ViajesTrustStrip } from "./ViajesTrustStrip";

export type ViajesLandingPageProps = {
  initialBusinessRows: ViajesBusinessResult[];
};

export function ViajesLandingPage({ initialBusinessRows }: ViajesLandingPageProps) {
  const sp = useSearchParams();
  const { routeLang, copyLang: lang } = resolveClasificadosPublishLang(sp?.get("lang"));
  const ui = getViajesUi(lang);

  const publicarHref = appendLangToPath("/publicar/viajes", routeLang);
  const homeBackHref = appendLangToPath("/clasificados/viajes", routeLang);
  const browseAllHref = buildViajesBrowseUrl(defaultViajesBrowseState(lang));

  return (
    <div className="min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div className="mx-auto flex max-w-[1280px] justify-end px-3.5 pt-3 sm:px-4 lg:px-5">
        <ViajesLangSwitch compact />
      </div>

      <ViajesHero
        ui={ui}
        exploreHref={browseAllHref}
        publishHref={publicarHref}
        searchBar={<ViajesSearchBar ui={ui} lang={lang} />}
        tripPills={<ViajesLandingIntentPills ui={ui} />}
      />

      <main className="mx-auto max-w-[1280px] space-y-2 overflow-x-hidden px-3.5 pb-14 sm:px-4 lg:px-5">
        <div className="mt-2 flex justify-end">
          <Link href={browseAllHref} className="text-sm font-semibold text-[color:var(--lx-burgundy)] underline-offset-2 hover:underline">
            {ui.landing.browseAllTrips}
          </Link>
        </div>

        <ViajesTopOffers homeBackHref={homeBackHref} browseAllHref={browseAllHref} ui={ui} initialBusinessRows={initialBusinessRows} />
        <ViajesLocalDepartures ui={ui} browseAllHref={browseAllHref} />
        <ViajesNearbyEscapes ui={ui} />
        <ViajesStaySection ui={ui} />
        <ViajesMobilitySection ui={ui} />
        <ViajesDestinations ui={ui} browseAllHref={browseAllHref} />
        <ViajesAudienceBuckets ui={ui} browseAllHref={browseAllHref} />
        <ViajesLowerSections homeBackHref={homeBackHref} ui={ui} />
        <ViajesTrustStrip ui={ui} className="mt-8" />
        <ViajesPublishCtaBand ui={ui} href={publicarHref} />
      </main>

      <ViajesTrustFooter ui={ui} />
    </div>
  );
}
