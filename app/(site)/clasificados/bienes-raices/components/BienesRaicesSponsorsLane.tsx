"use client";

import Link from "next/link";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import type { BrNegocioListing } from "../resultados/cards/listingTypes";
import { BadgeStack } from "../resultados/cards/BadgeStack";

type Props = {
  lang: "es" | "en";
  listings: BrNegocioListing[];
  surface: "landing" | "results";
  maxItems?: number;
};

/**
 * Bienes Raíces "Patrocinadores de Leonix" sponsor lane.
 * Shows only real active sponsor/highlighted listings.
 * Returns null if no sponsor-qualified entries exist.
 */
export function BienesRaicesSponsorsLane({ lang, listings, surface, maxItems = 8 }: Props) {
  // Sponsor-qualified: active package entitlement overlay (isSponsored) or Destacada/Promo badges.
  // Do NOT qualify: sellerKind negocio alone, adPlanKey paid_business alone, normal recent listings.
  const sponsorListings = listings.filter(
    (listing) =>
      listing.isSponsored === true ||
      listing.badges.includes("destacada") ||
      listing.badges.includes("promocionada"),
  );

  // If no sponsor-qualified entries, return null (no public placeholder)
  if (sponsorListings.length === 0) {
    return null;
  }

  const displayListings = sponsorListings.slice(0, maxItems);

  const title = lang === "es" ? "Patrocinadores de Leonix" : "Leonix Sponsors";
  const subtitle =
    lang === "es"
      ? "Negocios y propiedades con visibilidad premium en Leonix Media, revista digital/impresa y resultados destacados."
      : "Businesses and listings with premium visibility across Leonix Media, digital/print magazine, and featured results.";
  const eyebrow = lang === "es" ? "VISIBILIDAD PREMIUM" : "PREMIUM VISIBILITY";
  const ctaLabel = lang === "es" ? "Ver anuncio" : "View listing";

  return (
    <section
      className="mt-6 rounded-2xl border border-[#C9A84A]/35 bg-[#FFFDF7]/95 p-5 sm:mt-8 sm:p-6"
      aria-labelledby="br-sponsors-heading"
    >
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#556B3E]">{eyebrow}</p>
        <h2 id="br-sponsors-heading" className="mt-2 font-serif text-xl font-bold text-[#2A4536] sm:text-2xl">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#5C5346] sm:text-base">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayListings.map((listing) => {
          const detailHref = appendLangToPath(leonixLiveAnuncioPath(listing.id), lang);
          return (
            <Link
              key={listing.id}
              href={detailHref}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-[#E8DFD0]/80 bg-white shadow-sm transition hover:shadow-md hover:border-[#C9A84A]/50"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F0E8]">
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                <div className="absolute top-2 right-2">
                  <BadgeStack badges={listing.badges} />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-3">
                <p className="text-sm font-semibold text-[#7A1E2C]">{listing.price}</p>
                <h3 className="mt-1 line-clamp-2 font-serif text-base font-bold text-[#2A4536] group-hover:text-[#7A1E2C]">
                  {listing.title}
                </h3>
                {listing.addressLine ? (
                  <p className="mt-1 line-clamp-1 text-xs text-[#5C5346]">{listing.addressLine}</p>
                ) : null}
                <div className="mt-auto pt-3">
                  <span className="inline-flex items-center text-xs font-semibold text-[#B8954A] group-hover:text-[#7A1E2C]">
                    {ctaLabel}
                    <svg
                      className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
