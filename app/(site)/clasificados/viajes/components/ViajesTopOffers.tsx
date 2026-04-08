import type { ViajesUi } from "../data/viajesUiCopy";
import { selectViajesTopOffersFeed } from "../data/viajesHomeFeedSelectors";
import { ViajesSectionHeader } from "./ViajesSectionHeader";
import { ViajesTopOfferCard } from "./ViajesTopOfferCard";

type ViajesTopOffersProps = {
  homeBackHref: string;
  ui: ViajesUi;
};

export function ViajesTopOffers({ homeBackHref, ui }: ViajesTopOffersProps) {
  const offers = selectViajesTopOffersFeed();

  return (
    <section className="mt-12 sm:mt-14 md:mt-16">
      <ViajesSectionHeader title={ui.topOffers.title} subtitle={ui.topOffers.subtitle} className="mb-6 sm:mb-8" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {offers.map((offer) => (
          <ViajesTopOfferCard key={offer.id} offer={offer} homeBackHref={homeBackHref} ui={ui} />
        ))}
      </div>
    </section>
  );
}
