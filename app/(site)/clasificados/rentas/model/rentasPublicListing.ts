import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";

/** How the listing is offered in Leonix Rentas (public surface). */
export type RentasSellerType = "privado" | "negocio";

/**
 * Canonical public-facing listing record for Rentas shell pages (landing, results, detail).
 * Live DB adapters should map published rows into this shape.
 */
export type RentasPublicListing = {
  id: string;
  /** Future-friendly slug for pretty URLs / SEO. */
  slug?: string;
  title: string;
  imageUrl: string;
  /** Optional gallery; when absent, UI uses `imageUrl` only. */
  galleryUrls?: string[];
  rentDisplay: string;
  /** Monthly rent as a number when known (for sorting/filters); demo may omit. */
  rentMonthly?: number;
  addressLine: string;
  beds: string;
  baths: string;
  sqft: string;
  categoriaPropiedad: BrNegocioCategoriaPropiedad;
  branch: RentasSellerType;
  badges: string[];
  promoted?: boolean;
  layout?: "vertical" | "horizontal";
  recencyRank?: number;
  amueblado?: boolean;
  mascotasPermitidas?: boolean;
  /** Localized short copy for detail; sample-only until CMS/DB. */
  description?: { es: string; en: string };
  /** Display line for seller (localized). */
  sellerDisplay?: { es: string; en: string };
};
