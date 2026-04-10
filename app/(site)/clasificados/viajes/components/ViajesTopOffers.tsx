import type { ViajesUi } from "../data/viajesUiCopy";
import { selectViajesTopOffersFeed } from "../data/viajesHomeFeedSelectors";
import { ViajesLandingBrowseMore } from "./ViajesLandingBrowseMore";
import { ViajesSectionHeader } from "./ViajesSectionHeader";
import { ViajesTopOfferCard } from "./ViajesTopOfferCard";

type ViajesTopOffersProps = {
  homeBackHref: string;
  browseAllHref: string;
  ui: ViajesUi;
};

export function ViajesTopOffers({ homeBackHref, browseAllHref, ui }: ViajesTopOffersProps) {
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
