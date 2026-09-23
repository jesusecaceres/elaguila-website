"use client";

import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryPartnerSection,
  LeonixCategoryShortcutSection,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";

import { buildViajesBrowseUrl, defaultViajesBrowseState } from "../lib/buildViajesResultsUrl";

import type { ViajesBusinessResult } from "../data/viajesResultsSampleData";
import { getViajesUi } from "../data/viajesUiCopy";
import { ViajesAudienceBuckets } from "./ViajesAudienceBuckets";
import { ViajesCategoryPillsPanel } from "./ViajesCategoryPillsPanel";
import { ViajesDestinations } from "./ViajesDestinations";
import { ViajesLandingTierBreak } from "./ViajesLandingTierBreak";
import { ViajesLangSwitch } from "./ViajesLangSwitch";
import { ViajesLocalDepartures } from "./ViajesLocalDepartures";
import { ViajesLowerSections } from "./ViajesLowerSections";
import { ViajesPublishCtaBand } from "./ViajesPublishCtaBand";
import { ViajesSearchBar } from "./ViajesSearchBar";
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

  const viajesSearchForm = (
    <LeonixCategorySearchCanvas
      lang={lang as V2Lang}
      surface="landing"
      query=""
      city=""
      state=""
      zip=""
      country=""
      onQuery={() => {}}
      onCity={() => {}}
      onState={() => {}}
      onZip={() => {}}
      onCountry={() => {}}
      onSearch={() => {}}
      onOpenFilters={() => {}}
      browseAllHref={browseAllHref}
      browseAllLabel={lang === "es" ? "Ver todos" : "View all"}
      searchButtonLabel={lang === "es" ? "Buscar" : "Search"}
      filtersButtonLabel={lang === "es" ? "Filtros" : "Filters"}
      publishHref={publicarHref}
      publishLabel={lang === "es" ? "Publicar viaje" : "Post trip"}
    />
  );

  return (
    <LeonixCategoryPageShell surface="landing" topSlot={
      <div className="mx-auto flex max-w-[1280px] justify-end px-3.5 pt-3 sm:px-4 lg:px-5">
        <ViajesLangSwitch compact />
      </div>
    }>
      <LeonixCategoryHeroGateway
        lang={lang as V2Lang}
        surface="landing"
        title={lang === "es" ? "Viajes" : "Travel"}
        tagline=""
        intro={lang === "es" ? "Descubre destinos, ofertas de viajes y experiencias locales." : "Discover destinations, travel deals, and local experiences."}
        introSecondary=""
        searchSlot={viajesSearchForm}
        eyebrow={lang === "es" ? "VIAJES · LEONIX" : "TRAVEL · LEONIX"}
      />

<<<<<<< HEAD
      <main className="mx-auto max-w-[1280px] space-y-6 overflow-x-hidden px-3.5 pb-14 sm:px-4 sm:space-y-8 lg:px-5">
        <ViajesTopOffers homeBackHref={homeBackHref} browseAllHref={browseAllHref} ui={ui} initialBusinessRows={initialBusinessRows} />
=======
      <main className="mx-auto max-w-[1280px] space-y-2 overflow-x-hidden px-3.5 pb-14 sm:px-4 lg:px-5">
        <div className="mt-2 flex justify-end">
          <Link href={browseAllHref} className="text-sm font-semibold text-[color:var(--lx-burgundy)] underline-offset-2 hover:underline">
            {ui.landing.browseAllTrips}
          </Link>
        </div>

        <ViajesTopOffers browseAllHref={browseAllHref} ui={ui} initialBusinessRows={initialBusinessRows} />
>>>>>>> 9f92bb50 (preservation: capture final local Viajes launch work)
        <ViajesLocalDepartures ui={ui} browseAllHref={browseAllHref} />

        <ViajesLandingTierBreak label={ui.landing.tier2Eyebrow} />

        <ViajesDestinations ui={ui} browseAllHref={browseAllHref} />
        <ViajesAudienceBuckets ui={ui} browseAllHref={browseAllHref} />
<<<<<<< HEAD

        <ViajesLowerSections homeBackHref={homeBackHref} ui={ui} />

        <ViajesLandingTierBreak label={ui.landing.trustTransitionBreak} />

        <ViajesTrustStrip ui={ui} className="mt-0" />

=======
        <ViajesLowerSections homeBackHref={homeBackHref} ui={ui} initialBusinessRows={initialBusinessRows} />
        <ViajesTrustStrip ui={ui} className="mt-8" />
>>>>>>> 9f92bb50 (preservation: capture final local Viajes launch work)
        <ViajesPublishCtaBand ui={ui} href={publicarHref} />
      </main>

      <ViajesTrustFooter ui={ui} />
    </LeonixCategoryPageShell>
  );
}
