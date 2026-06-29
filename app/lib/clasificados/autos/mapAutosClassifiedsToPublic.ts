import type { AutosPublicListing } from "@/app/clasificados/autos/data/autosPublicSampleTypes";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { deriveHeroImageUrls } from "@/app/clasificados/autos/negocios/lib/autoDealerHeroImages";
import { normalizeLoadedListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import { buildVehicleTitle } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import { withNormalizedVehicleIdentityForDisplay } from "@/app/lib/clasificados/autos/autosListingDisplayIdentity";
import {
  resolveBodyStyle,
  resolveDrivetrain,
  resolveExteriorColor,
  resolveFuelType,
  resolveInteriorColor,
  resolveTransmission,
  resolveTitleStatus,
} from "@/app/clasificados/autos/negocios/lib/autoDealerSelectResolve";
import type { AutosClassifiedsListingRow } from "./autosClassifiedsTypes";
import { autosPublicSellerTypeFromLane } from "./autosPublicSellerFromLane";
import { dealerAddressHaystackParts } from "./autosDealerStructuredAddress";
import { resolveEngineForDisplay } from "./autosVehicleEngineOptions";
import { dedupeAutosVideoUrls, normalizeAutosExternalVideoUrl } from "./autosExternalVideoUrlValidation";

function parseDbTimeMs(value: string | null | undefined): number {
  if (value == null || value === "") return NaN;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : NaN;
}

function buildSearchableBlurb(L: AutoDealerListing): string {
  const parts: string[] = [];
  if (L.autosLane === "negocios") parts.push("dealer negocio concesionario business");
  if (L.autosLane === "privado") parts.push("private privado particular");
  if (L.year != null && Number.isFinite(L.year)) parts.push(String(Math.round(L.year)));
  if (L.make?.trim()) parts.push(L.make.trim());
  if (L.model?.trim()) parts.push(L.model.trim());
  if (L.trim?.trim()) parts.push(L.trim.trim());
  if (L.vehicleTitle?.trim()) parts.push(L.vehicleTitle.trim());
  if (L.price != null && Number.isFinite(L.price)) parts.push(String(Math.round(L.price)));
  if (L.mileage != null && Number.isFinite(L.mileage)) parts.push(String(Math.round(L.mileage)));
  if (L.city?.trim()) parts.push(L.city.trim());
  if (L.state?.trim()) parts.push(L.state.trim());
  if (L.zip?.trim()) parts.push(L.zip.trim());
  if (L.dealerName?.trim()) parts.push(L.dealerName.trim());
  if (L.condition?.trim()) parts.push(L.condition.trim());
  if (resolveTransmission(L)) parts.push(resolveTransmission(L) ?? "");
  if (resolveFuelType(L)) parts.push(resolveFuelType(L) ?? "");
  if (resolveBodyStyle(L)) parts.push(resolveBodyStyle(L) ?? "");
  if (resolveDrivetrain(L)) parts.push(resolveDrivetrain(L) ?? "");
  if (resolveExteriorColor(L)) parts.push(resolveExteriorColor(L) ?? "");
  if (resolveInteriorColor(L)) parts.push(resolveInteriorColor(L) ?? "");
  if (resolveTitleStatus(L)) parts.push(resolveTitleStatus(L) ?? "");
  if (L.description?.trim()) parts.push(L.description.trim().slice(0, 2000));
  if (L.otherEquipmentDetails?.trim()) parts.push(L.otherEquipmentDetails.trim().slice(0, 2000));
  if (L.vin?.trim()) parts.push(L.vin.trim());
  if (L.stockNumber?.trim()) parts.push(L.stockNumber.trim());
  if (Array.isArray(L.features) && L.features.length) parts.push(L.features.join(" "));
  if (Array.isArray(L.customEquipment) && L.customEquipment.length) parts.push(L.customEquipment.join(" "));
  if (L.financeContactName?.trim()) parts.push(L.financeContactName.trim());
  if (L.financeNotes?.trim()) parts.push(L.financeNotes.trim().slice(0, 500));
  const engineDisplay = resolveEngineForDisplay(L);
  if (engineDisplay) parts.push(engineDisplay);
  if (L.engine?.trim() && L.engine.trim() !== engineDisplay) parts.push(L.engine.trim());
  for (const addr of dealerAddressHaystackParts(L)) parts.push(addr);
  if (L.doors != null && Number.isFinite(L.doors)) parts.push(`${L.doors} doors`);
  if (L.seats != null && Number.isFinite(L.seats)) parts.push(`${L.seats} seats`);
  if (L.mpgCity != null && Number.isFinite(L.mpgCity)) parts.push(`mpg city ${L.mpgCity}`);
  if (L.mpgHighway != null && Number.isFinite(L.mpgHighway)) parts.push(`mpg highway ${L.mpgHighway}`);
  return parts.join(" ").toLowerCase();
}

function firstImageUrl(listing: AutoDealerListing): string {
  const urls = deriveHeroImageUrls(normalizeLoadedListing(listing));
  return urls[0] ?? "";
}

/**
 * Map persisted row → browse card shape (filters, landing, related pool).
 */
export function autosClassifiedsRowToPublicListing(row: AutosClassifiedsListingRow): AutosPublicListing {
  const L = withNormalizedVehicleIdentityForDisplay(normalizeLoadedListing(row.listing_payload));
  const sellerType = autosPublicSellerTypeFromLane(row.lane);
  const primaryImageUrl = firstImageUrl(L);
  const bodyStyle = resolveBodyStyle(L) ?? "";
  const transmission = resolveTransmission(L) ?? "";
  const drivetrain = resolveDrivetrain(L) ?? "";
  const fuelType = resolveFuelType(L) ?? "";
  const exteriorColor = resolveExteriorColor(L) ?? undefined;
  const interiorColor = resolveInteriorColor(L) ?? undefined;
  const titleStatus = resolveTitleStatus(L);
  const externalVideo = dedupeAutosVideoUrls(L.videoUrls ?? []).length > 0 || Boolean(normalizeAutosExternalVideoUrl(L.videoUrl ?? ""));
  const durableVideo = Boolean(L.muxPlaybackId?.trim() || L.muxPlaybackUrl?.trim() || L.muxThumbnailUrl?.trim() || externalVideo);
  const publishedMs = parseDbTimeMs(row.published_at);
  const updatedMs = parseDbTimeMs(row.updated_at);
  const createdMs = parseDbTimeMs(row.created_at);
  const recencyMs = Math.max(
    Number.isFinite(publishedMs) ? publishedMs : 0,
    Number.isFinite(updatedMs) ? updatedMs : 0,
    Number.isFinite(createdMs) ? createdMs : 0,
  );
  const publicSortTimestamp = recencyMs > 0 ? new Date(recencyMs).toISOString() : undefined;
  return {
    id: row.id,
    leonixAdId: row.leonix_ad_id ?? null,
    ownerUserId: row.owner_user_id,
    sellerType,
    featured: row.featured && sellerType === "dealer",
    year: L.year ?? new Date().getFullYear(),
    make: (L.make ?? "").trim(),
    model: (L.model ?? "").trim(),
    trim: L.trim,
    vehicleTitle:
      buildVehicleTitle(L.year, L.make, L.model, L.trim).trim() ||
      (L.vehicleTitle?.trim() ?? "") ||
      `${L.year ?? ""} ${L.make ?? ""} ${L.model ?? ""}`.trim(),
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
    exteriorColor,
    interiorColor,
    condition: L.condition ?? "used",
    titleStatus,
    badges: L.badges as string[] | undefined,
    primaryImageUrl,
    dealerName: sellerType === "dealer" ? L.dealerName : undefined,
    dealerLogoUrl: sellerType === "dealer" && typeof L.dealerLogo === "string" ? L.dealerLogo : undefined,
    privateSellerLabel: sellerType === "private" ? L.dealerName : undefined,
    searchableBlurb: buildSearchableBlurb(L),
    hasPhotos: Boolean(primaryImageUrl),
    hasVideo: durableVideo,
    publicSortTimestamp,
  };
}
