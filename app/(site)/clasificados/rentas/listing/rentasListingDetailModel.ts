import { resolveRentasPublicListingById } from "@/app/clasificados/rentas/data/rentasPublicLoader";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";

export type RentasListingDetailExtra = {
  descriptionEs: string;
  descriptionEn: string;
  sellerDisplayEs: string;
  sellerDisplayEn: string;
  gallery: string[];
};

/** @deprecated Prefer `getRentasListingById` from `rentasPublicData` — kept for call sites. */
export function findRentasDemoListingById(id: string): RentasPublicListing | undefined {
  return resolveRentasPublicListingById(id);
}

function defaultExtra(listing: RentasPublicListing): RentasListingDetailExtra {
  const base = listing.title;
  return {
    descriptionEs: `Inmueble en renta: ${base}. Información de muestra mientras activamos el detalle con datos publicados.`,
    descriptionEn: `Rental property: ${base}. Sample copy while we connect published records to this view.`,
    sellerDisplayEs: listing.branch === "privado" ? "Particular en Leonix" : "Negocio en Leonix",
    sellerDisplayEn: listing.branch === "privado" ? "Private seller on Leonix" : "Business seller on Leonix",
    gallery: listing.galleryUrls?.length ? listing.galleryUrls : [listing.imageUrl],
  };
}

/** Resolves bilingual copy + gallery from the public listing contract (sample or future live rows). */
export function getRentasListingDetailExtra(listing: RentasPublicListing): RentasListingDetailExtra {
  if (listing.description && listing.sellerDisplay) {
    return {
      descriptionEs: listing.description.es,
      descriptionEn: listing.description.en,
      sellerDisplayEs: listing.sellerDisplay.es,
      sellerDisplayEn: listing.sellerDisplay.en,
      gallery: listing.galleryUrls?.length ? listing.galleryUrls : [listing.imageUrl],
    };
  }
  return defaultExtra(listing);
}
