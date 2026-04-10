import {
  rentasResultsFeatured,
  rentasResultsGridDemo,
} from "@/app/clasificados/rentas/results/rentasResultsDemoData";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";

export type RentasListingDetailExtra = {
  descriptionEs: string;
  descriptionEn: string;
  sellerDisplayEs: string;
  sellerDisplayEn: string;
  gallery: string[];
};

function allListings(): RentasPublicListing[] {
  const map = new Map<string, RentasPublicListing>();
  for (const l of [rentasResultsFeatured, ...rentasResultsGridDemo]) {
    map.set(l.id, l);
  }
  return [...map.values()];
}

export function findRentasDemoListingById(id: string): RentasPublicListing | undefined {
  return allListings().find((l) => l.id === id);
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
