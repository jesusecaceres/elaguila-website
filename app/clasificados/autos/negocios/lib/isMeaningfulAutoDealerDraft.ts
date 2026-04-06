import type { AutoDealerListing } from "../types/autoDealerListing";
import { deriveHeroImageUrls } from "./autoDealerHeroImages";
import { hasListingVideo } from "./autoDealerVideo";
import {
  resolveBodyStyle,
  resolveDrivetrain,
  resolveExteriorColor,
  resolveFuelType,
  resolveInteriorColor,
  resolveTitleStatus,
  resolveTransmission,
} from "./autoDealerSelectResolve";

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

/**
 * True when the listing has enough user-entered content to show a real preview
 * (not the normalized empty template).
 */
export function isMeaningfulAutoDealerDraft(listing: AutoDealerListing): boolean {
  if (nonEmpty(listing.vehicleTitle)) return true;

  if (listing.year !== undefined && Number.isFinite(listing.year)) return true;
  if (nonEmpty(listing.make)) return true;
  if (nonEmpty(listing.model)) return true;
  if (nonEmpty(listing.trim)) return true;

  if (listing.price !== undefined && Number.isFinite(listing.price)) return true;
  if (nonEmpty(listing.monthlyEstimate ?? undefined)) return true;
  if (listing.mileage !== undefined && Number.isFinite(listing.mileage)) return true;

  if (deriveHeroImageUrls(listing).length > 0) return true;
  if (hasListingVideo(listing)) return true;

  if (nonEmpty(listing.city)) return true;
  if (nonEmpty(listing.state)) return true;
  if (nonEmpty(listing.vin)) return true;
  if (nonEmpty(listing.stockNumber)) return true;

  if (listing.condition !== undefined) return true;
  if (nonEmpty(resolveTransmission(listing))) return true;
  if (nonEmpty(resolveDrivetrain(listing))) return true;
  if (nonEmpty(listing.engine)) return true;
  if (nonEmpty(resolveFuelType(listing))) return true;
  if (listing.mpgCity != null && Number.isFinite(listing.mpgCity)) return true;
  if (listing.mpgHighway != null && Number.isFinite(listing.mpgHighway)) return true;
  if (nonEmpty(resolveBodyStyle(listing))) return true;
  if (nonEmpty(resolveExteriorColor(listing))) return true;
  if (nonEmpty(resolveInteriorColor(listing))) return true;
  if (listing.doors !== undefined && Number.isFinite(listing.doors)) return true;
  if (listing.seats !== undefined && Number.isFinite(listing.seats)) return true;
  if (nonEmpty(resolveTitleStatus(listing))) return true;

  if ((listing.badges?.length ?? 0) > 0) return true;
  if ((listing.features?.length ?? 0) > 0) return true;
  if (nonEmpty(listing.description)) return true;

  if (nonEmpty(listing.dealerName)) return true;
  if (Boolean(listing.dealerLogo)) return true;
  if (nonEmpty(listing.dealerPhone)) return true;
  if (nonEmpty(listing.dealerWhatsapp ?? undefined)) return true;
  if (nonEmpty(listing.dealerAddress)) return true;
  if (nonEmpty(listing.dealerWebsite ?? undefined)) return true;

  const hours = listing.dealerHours ?? [];
  if (hours.some((r) => nonEmpty(r.day))) return true;

  if (Object.values(listing.dealerSocials ?? {}).some((u) => nonEmpty(u))) return true;
  if (listing.dealerRating !== undefined && Number.isFinite(listing.dealerRating)) return true;
  if (
    listing.dealerReviewCount !== undefined &&
    Number.isFinite(listing.dealerReviewCount) &&
    listing.dealerReviewCount > 0
  ) {
    return true;
  }

  if ((listing.relatedDealerListings?.length ?? 0) > 0) return true;

  return false;
}
