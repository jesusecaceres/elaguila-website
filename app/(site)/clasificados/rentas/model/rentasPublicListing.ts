import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type { BrResultsPropertyKind } from "@/app/clasificados/lib/leonixRealEstateListingContract";

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
  /** Deposit in USD whole dollars when persisted (`Leonix:rent:deposit_usd` pair or future column). */
  depositUsd?: number;
  /** Public contact surfaced on detail when policy allows (from `listings.contact_*`). */
  contactPhone?: string;
  contactEmail?: string;
  addressLine: string;
  /** Normalized city/metro for browse filters (maps from publish `ciudad` + geocoding). */
  city?: string;
  /** State or entity label (e.g. NL, Jal.) — optional until backend normalizes. */
  stateRegion?: string;
  /** Postal / ZIP (digits). Publish forms use free `ubicacionLinea`; structured ZIP comes from adapters. */
  postalCode?: string;
  /** ISO 8601 timestamp when the listing went live — drives "recientes" and fairness. */
  publishedAt?: string;
  /** When false, exclude from public grids (unpublished / expired). Default true in demos. */
  browseActive?: boolean;
  /**
   * Rentas availability from `Leonix:rent:listing_status` (not DB moderation status).
   * Public catalog typically includes `disponible` and `pendiente` only.
   */
  rentasListingAvailability?: "disponible" | "pendiente" | "bajo_contrato" | "rentado" | null;
  beds: string;
  baths: string;
  /** Half-baths count when persisted (`Leonix:rent:half_baths_count`). */
  halfBathsCount?: number | null;
  sqft: string;
  categoriaPropiedad: BrNegocioCategoriaPropiedad;
  branch: RentasSellerType;
  badges: string[];
  promoted?: boolean;
  layout?: "vertical" | "horizontal";
  recencyRank?: number;
  amueblado?: boolean;
  mascotasPermitidas?: boolean;
  /** Parsed interior / lot size when numeric (from detail_pairs text). */
  interiorSqftApprox?: number | null;
  /** From `Leonix:parking_spots` when present. */
  parkingSpots?: number | null;
  /** From `Leonix:pool` when present. */
  pool?: boolean | null;
  /** Raw subtype code (`Leonix:property_subtype`). */
  propertySubtype?: string | null;
  /** `Leonix:results_property_kind` when present (casa, departamento, …). */
  resultsPropertyKind?: BrResultsPropertyKind | null;
  /** Parsed `Leonix:highlight_slugs` (amenities / BR highlights / comercial|terreno tokens). */
  highlightSlugs?: string[];
  /** Rentas machine: `Leonix:rent:lease_term_code` (e.g. mes-a-mes, 12-meses). */
  leaseTermCode?: string | null;
  availabilityNote?: string | null;
  servicesIncluded?: string | null;
  requirements?: string | null;
  /** Negocio-only machine fields (public on detail). */
  businessLicense?: string | null;
  businessWebsite?: string | null;
  /** Free-text or URLs from machine pair `Leonix:rent:business:social` (Negocio). */
  businessSocial?: string | null;
  /** From `listings.business_meta` (`negocioNombreCorreduria` / marca). */
  businessMarca?: string | null;
  /** From `listings.business_meta` (`negocioAgente` / contact name line). */
  businessAgentName?: string | null;
  /** From `listings.business_meta` (`negocioDescripcion` / BR meta) when present. */
  businessDescription?: string | null;
  /** Public map link when publisher provided one (`Leonix:rent:map_url`). */
  mapUrl?: string | null;
  /** External video URL (`Leonix:rent:video_url`). */
  videoUrl?: string | null;
  /** Localized short copy for detail; sample-only until CMS/DB. */
  description?: { es: string; en: string };
  /** Display line for seller (localized). */
  sellerDisplay?: { es: string; en: string };
};
