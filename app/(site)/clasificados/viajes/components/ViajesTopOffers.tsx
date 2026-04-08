import { selectViajesTopOffersFeed } from "../data/viajesHomeFeedSelectors";
import { ViajesSectionHeader } from "./ViajesSectionHeader";
import { ViajesTopOfferCard } from "./ViajesTopOfferCard";

type ViajesTopOffersProps = {
  homeBackHref: string;
};

export function ViajesTopOffers({ homeBackHref }: ViajesTopOffersProps) {
  const offers = selectViajesTopOffersFeed();

  return (
    <section className="mt-12 sm:mt-14 md:mt-16">
      <ViajesSectionHeader
        title="Top ofertas de la semana"
        subtitle="Selección curada: socios comerciales, negocios publicados e ideas editoriales — cada tarjeta indica el origen."
        className="mb-6 sm:mb-8"
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {offers.map((offer) => (
          <ViajesTopOfferCard key={offer.id} offer={offer} homeBackHref={homeBackHref} />
        ))}
      </div>
    </section>
  );
}
