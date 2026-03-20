/**
 * BR Negocio — normalized typed models (preflight).
 *
 * These types document the target shape for the rebuild. Current runtime still uses
 * `Record<string, string>` for form state and `ListingData` for preview.
 */

import type { ListingData } from "@/app/clasificados/components/ListingView";

/** Subset of form `details` keys required for BR negocio identification */
export type BrNegocioBranch = "negocio";

/**
 * Application/form input for BR negocio (dedicated flow).
 * Aligns with publish `details` + `title` / `description` / `city` / `price` held in sibling state in page.
 */
export type BrNegocioFormState = {
  bienesRaicesBranch: BrNegocioBranch;
} & Record<string, string | undefined>;

/**
 * Normalized business rail — mirrors `BusinessRailData` in ListingView.tsx.
 * Canonical preview-facing shape for brokerage / agent identity.
 */
export type BrNegocioBusinessRailData = {
  name: string;
  agent: string;
  role: string;
  agentLicense?: string | null;
  officePhone: string;
  agentEmail?: string | null;
  website: string | null;
  socialLinks: Array<{ label: string; url: string }>;
  rawSocials: string;
  logoUrl: string | null;
  agentPhotoUrl: string | null;
  languages: string;
  hours: string;
  virtualTourUrl: string | null;
  plusMoreListings: boolean;
  businessDescription?: string;
  availabilityRows?: Array<{ title: string; price: string; size: string; ctaText?: string; ctaLink?: string }>;
};

/**
 * Normalized preview payload for BR negocio full preview (future dedicated page).
 * Extends compatibility with existing `ListingData` so `ListingView` / `BienesRaicesPreviewNegocioFresh` keep working.
 */
export type BrNegocioNormalizedPreviewData = Omit<ListingData, "businessRail" | "category" | "floorPlanUrl"> & {
  category: "bienes-raices";
  businessRail: BrNegocioBusinessRailData;
  floorPlanUrl: string | null;
  /**
   * Structured facts — target for rebuild; until then `detailPairs` remains authoritative for Zillow-style sections.
   */
  structuredFacts?: {
    propertyTypeLabel?: string;
    addressLine?: string;
    neighborhood?: string;
    beds?: string;
    baths?: string;
    halfBaths?: string;
    sqft?: string;
    lotSize?: string;
    levels?: string;
    parking?: string;
    yearBuilt?: string;
    zoning?: string;
  };
};

/** Compatibility: current code path builds `ListingData` directly — this is the intended invariant */
export function assertListingDataHasBrNegocioRail(data: ListingData): data is ListingData & { businessRail: BrNegocioBusinessRailData; category: "bienes-raices" } {
  return data.category === "bienes-raices" && data.businessRail != null;
}
