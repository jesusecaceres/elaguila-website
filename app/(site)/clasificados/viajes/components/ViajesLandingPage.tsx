"use client";

import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { CategoryStandardLandingPage } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage";
import { CategoryStandardLandingPageShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPageShell";

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
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const ui = getViajesUi(lang);

  const publicarHref = appendLangToPath("/publicar/viajes", lang);
  const homeBackHref = appendLangToPath("/clasificados/viajes", lang);
  const browseAllHref = buildViajesBrowseUrl(defaultViajesBrowseState(lang));

  return (
    <CategoryStandardLandingPageShell>
      <div className="flex justify-end px-3 pt-3 sm:px-5">
        <ViajesLangSwitch compact />
      </div>

      <CategoryStandardLandingPage
        category="viajes"
        lang={lang}
        publishHref={publicarHref}
        browseHref={browseAllHref}
        searchSlot={<ViajesSearchBar lang={lang} ui={ui} />}
        searchChips={<ViajesCategoryPillsPanel lang={lang} ui={ui} />}
        suppressVisibilityCta
      />

      <main className="relative mx-auto max-w-7xl min-w-0 px-3 pb-10 pt-6 sm:px-5 sm:pt-9 lg:px-6 lg:pt-11">
        <ViajesTopOffers homeBackHref={homeBackHref} browseAllHref={browseAllHref} ui={ui} initialBusinessRows={initialBusinessRows} />
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
    </CategoryStandardLandingPageShell>
  );
}
