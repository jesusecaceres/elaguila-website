import { resolveRentasPublicListingById } from "@/app/clasificados/rentas/data/rentasPublicLoader";
import { sanitizeLeonixListingPublishDescriptionBody } from "@/app/clasificados/lib/leonixPublishPublicDescription";
import { filterRentasPhotoUrlList } from "@/app/clasificados/rentas/lib/rentasListingPublishedMediaGuards";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";

export type RentasListingDetailExtra = {
  descriptionEs: string;
  descriptionEn: string;
  sellerDisplayEs: string;
  sellerDisplayEn: string;
  gallery: string[];
  /** When `listings.contact_*` is populated and policy allows public display. */
  contactPhone?: string;
  contactEmail?: string;
  contactSmsDigits?: string;
  contactWhatsappDigits?: string;
};

/** @deprecated Prefer `getRentasListingById` from `rentasPublicData` — kept for call sites. */
export function findRentasDemoListingById(id: string): RentasPublicListing | undefined {
  return resolveRentasPublicListingById(id);
}

function galleryStringsForDetail(listing: RentasPublicListing): string[] {
  const fromGallery = filterRentasPhotoUrlList(listing.galleryUrls ?? []);
  if (fromGallery.length) return fromGallery;
  return filterRentasPhotoUrlList(listing.imageUrl ? [listing.imageUrl] : []);
}

function defaultExtra(listing: RentasPublicListing): RentasListingDetailExtra {
  const base = listing.title;
  return {
    descriptionEs: `Inmueble en renta: ${base}. Información de muestra mientras activamos el detalle con datos publicados.`,
    descriptionEn: `Rental property: ${base}. Sample copy while we connect published records to this view.`,
    sellerDisplayEs: listing.branch === "privado" ? "Particular en Leonix" : "Negocio en Leonix",
    sellerDisplayEn: listing.branch === "privado" ? "Private seller on Leonix" : "Business seller on Leonix",
    gallery: galleryStringsForDetail(listing),
  };
}

/** Resolves bilingual copy + gallery from the public listing contract (sample or future live rows). */
export function getRentasListingDetailExtra(listing: RentasPublicListing): RentasListingDetailExtra {
  const contactPhone = listing.contactPhone?.trim() || undefined;
  const contactEmail = listing.contactEmail?.trim() || undefined;
  const contactSmsDigits = listing.contactSmsDigits?.replace(/\D/g, "").length
    ? listing.contactSmsDigits.replace(/\D/g, "").slice(0, 15)
    : undefined;
  const contactWhatsappDigits = listing.contactWhatsappDigits?.replace(/\D/g, "").length
    ? listing.contactWhatsappDigits.replace(/\D/g, "").slice(0, 15)
    : undefined;
  if (listing.description && listing.sellerDisplay) {
    const es = sanitizeLeonixListingPublishDescriptionBody(listing.description.es);
    const en = sanitizeLeonixListingPublishDescriptionBody(listing.description.en);
    return {
      descriptionEs: es,
      descriptionEn: en,
      sellerDisplayEs: listing.sellerDisplay.es,
      sellerDisplayEn: listing.sellerDisplay.en,
      gallery: galleryStringsForDetail(listing),
      contactPhone,
      contactEmail,
      contactSmsDigits,
      contactWhatsappDigits,
    };
  }
  const base = defaultExtra(listing);
  return { ...base, contactPhone, contactEmail, contactSmsDigits, contactWhatsappDigits };
}
