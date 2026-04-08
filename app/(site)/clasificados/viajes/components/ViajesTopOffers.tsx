import { VIAJES_TOP_OFFERS } from "../data/viajesLandingSampleData";
import { ViajesSectionHeader } from "./ViajesSectionHeader";
import { ViajesTopOfferCard } from "./ViajesTopOfferCard";

export function ViajesTopOffers() {
  return (
    <section className="mt-12 sm:mt-14 md:mt-16">
      <ViajesSectionHeader
        title="Top ofertas de la semana"
        subtitle="Una selección curada de escapadas, resorts, tours y cruceros con gran valor."
        className="mb-6 sm:mb-8"
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {VIAJES_TOP_OFFERS.map((offer) => (
          <ViajesTopOfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </section>
  );
}
