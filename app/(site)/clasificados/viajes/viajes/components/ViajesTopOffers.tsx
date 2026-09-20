import type { ViajesUi } from "../data/viajesUiCopy";
import type { ViajesBusinessResult } from "../data/viajesResultsSampleData";
import { filterViajesProductionFeaturedOffers } from "../lib/viajesPublicInventory";
import { sortViajesResultRows } from "../lib/viajesDiscoveryRanking";
import { ViajesLandingBrowseMore } from "./ViajesLandingBrowseMore";
import { ViajesSectionHeader } from "./ViajesSectionHeader";
import { ViajesResultsBusinessCard } from "./ViajesResultsBusinessCard";

type ViajesTopOffersProps = {
  browseAllHref: string;
  ui: ViajesUi;
  /** Approved listings from `viajes_staged_listings` (business + private lanes mapped to browse cards). */
  initialBusinessRows: ViajesBusinessResult[];
};

export function ViajesTopOffers({ browseAllHref, ui, initialBusinessRows }: ViajesTopOffersProps) {
  const rankedLive = sortViajesResultRows(
    [...filterViajesProductionFeaturedOffers(initialBusinessRows)],
    "featured"
  ).slice(0, 4) as ViajesBusinessResult[];

  if (!rankedLive.length) return null;

  return (
    <section className="mt-8 sm:mt-10">
      <ViajesSectionHeader
        title={ui.topOffers.title}
        subtitle={ui.topOffers.subtitle}
        showRail
        eyebrow={ui.landing.tier1Eyebrow}
        headingScale="primary"
        className="mb-6 sm:mb-8"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {rankedLive.map((row) => (
          <ViajesResultsBusinessCard key={row.id} row={row} ui={ui} />
        ))}
      </div>
      <ViajesLandingBrowseMore href={browseAllHref} label={ui.landing.browseAllTrips} />
    </section>
  );
}
