import type { ViajesUi } from "../data/viajesUiCopy";
import type { ViajesBusinessResult } from "../data/viajesResultsSampleData";
import { selectViajesTopOffersFeed } from "../data/viajesHomeFeedSelectors";
import { viajesAllowCuratedDemoCatalog } from "../lib/viajesPublicInventory";
import { sortViajesResultRows } from "../lib/viajesDiscoveryRanking";
import { ViajesLandingBrowseMore } from "./ViajesLandingBrowseMore";
import { ViajesSectionHeader } from "./ViajesSectionHeader";
import { ViajesTopOfferCard } from "./ViajesTopOfferCard";
import { ViajesResultsBusinessCard } from "./ViajesResultsBusinessCard";

type ViajesTopOffersProps = {
  homeBackHref: string;
  browseAllHref: string;
  ui: ViajesUi;
  /** Approved listings from `viajes_staged_listings` (business + private lanes mapped to browse cards). */
  initialBusinessRows: ViajesBusinessResult[];
};

export function ViajesTopOffers({ homeBackHref, browseAllHref, ui, initialBusinessRows }: ViajesTopOffersProps) {
  const allowCurated = viajesAllowCuratedDemoCatalog();
  const rankedLive = sortViajesResultRows([...initialBusinessRows], "featured").slice(0, 8) as ViajesBusinessResult[];

  if (rankedLive.length > 0) {
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-2 lg:gap-6 xl:grid-cols-4">
          {rankedLive.map((row) => (
            <ViajesResultsBusinessCard key={row.id} row={row} ui={ui} />
          ))}
        </div>
        <ViajesLandingBrowseMore href={browseAllHref} label={ui.landing.browseAllTrips} />
      </section>
    );
  }

  if (allowCurated) {
    const offers = selectViajesTopOffersFeed();
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-2 lg:gap-6 xl:grid-cols-4">
          {offers.map((offer) => (
            <ViajesTopOfferCard key={offer.id} offer={offer} homeBackHref={homeBackHref} ui={ui} />
          ))}
        </div>
        <ViajesLandingBrowseMore href={browseAllHref} label={ui.landing.browseAllTrips} />
      </section>
    );
  }

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
      <div className="rounded-2xl border border-[color:var(--lx-gold-border)]/80 bg-[#fffdf9]/95 p-6 text-center shadow-[0_10px_36px_-18px_rgba(30,40,55,0.1)] sm:p-8">
        <p className="text-base font-bold text-[color:var(--lx-text)]">{ui.topOffers.emptyTitle}</p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--lx-text-2)]">{ui.topOffers.emptyBody}</p>
        <ViajesLandingBrowseMore href={browseAllHref} label={ui.landing.browseAllTrips} />
      </div>
    </section>
  );
}
