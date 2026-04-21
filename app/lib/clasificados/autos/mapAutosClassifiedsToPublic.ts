import type { AutosPublicListing } from "@/app/clasificados/autos/data/autosPublicSampleTypes";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { deriveHeroImageUrls } from "@/app/clasificados/autos/negocios/lib/autoDealerHeroImages";
import { normalizeLoadedListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import {
  resolveBodyStyle,
  resolveDrivetrain,
  resolveFuelType,
  resolveTransmission,
  resolveTitleStatus,
} from "@/app/clasificados/autos/negocios/lib/autoDealerSelectResolve";
import type { AutosClassifiedsListingRow } from "./autosClassifiedsTypes";

function firstImageUrl(listing: AutoDealerListing): string {
  const urls = deriveHeroImageUrls(normalizeLoadedListing(listing));
  return urls[0] ?? "";
}

/**
 * Map persisted row → browse card shape (filters, landing, related pool).
 */
export function autosClassifiedsRowToPublicListing(row: AutosClassifiedsListingRow): AutosPublicListing {
  const L = normalizeLoadedListing(row.listing_payload);
  const sellerType = row.lane === "negocios" ? "dealer" : "private";
  const primaryImageUrl = firstImageUrl(L);
  const bodyStyle = resolveBodyStyle(L) ?? "";
  const transmission = resolveTransmission(L) ?? "";
  const drivetrain = resolveDrivetrain(L) ?? "";
  const fuelType = resolveFuelType(L) ?? "";
  const titleStatus = resolveTitleStatus(L);
  return {
    id: row.id,
    sellerType,
    featured: row.featured && sellerType === "dealer",
    year: L.year ?? new Date().getFullYear(),
    make: (L.make ?? "").trim(),
    model: (L.model ?? "").trim(),
    trim: L.trim,
    vehicleTitle: L.vehicleTitle?.trim() || `${L.year ?? ""} ${L.make ?? ""} ${L.model ?? ""}`.trim(),
    price: L.price ?? 0,
    monthlyEstimate: L.monthlyEstimate ?? undefined,
    mileage: L.mileage ?? 0,
    city: L.city ?? "",
    state: L.state ?? "",
    zip: L.zip != null && L.zip !== "" ? String(L.zip).replace(/\D/g, "").slice(0, 5) : "",
    bodyStyle,
    transmission,
    drivetrain,
    fuelType,
    condition: L.condition ?? "used",
    titleStatus,
    badges: L.badges as string[] | undefined,
    primaryImageUrl,
    dealerName: sellerType === "dealer" ? L.dealerName : undefined,
    dealerLogoUrl: sellerType === "dealer" && typeof L.dealerLogo === "string" ? L.dealerLogo : undefined,
    privateSellerLabel: sellerType === "private" ? L.dealerName : undefined,
  };
}
