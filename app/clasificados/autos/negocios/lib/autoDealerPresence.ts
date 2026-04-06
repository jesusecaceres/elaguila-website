import type { AutoDealerListing } from "../types/autoDealerListing";
import { resolveDealerBookingHref, resolveDealerOfficePhone } from "./dealerContactResolve";
import { safeExternalHref, sanitizeDealerRating, sanitizeReviewCount } from "./dealerDraftSanitize";
import { deriveHeroImageUrls } from "./autoDealerHeroImages";
import { filterDealerHoursForDisplay } from "./dealerHoursDisplay";
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

export function hasHeroMedia(data: AutoDealerListing): boolean {
  return deriveHeroImageUrls(data).length > 0 || hasListingVideo(data);
}

export function hasTitleBand(data: AutoDealerListing): boolean {
  const badges = data.badges ?? [];
  return (
    nonEmpty(data.vehicleTitle) ||
    badges.length > 0 ||
    (data.price !== undefined && Number.isFinite(data.price)) ||
    nonEmpty(data.monthlyEstimate ?? undefined) ||
    (data.mileage !== undefined && Number.isFinite(data.mileage)) ||
    nonEmpty(data.city) ||
    nonEmpty(data.state) ||
    nonEmpty(data.vin) ||
    nonEmpty(data.stockNumber)
  );
}

export function hasSpecsSection(data: AutoDealerListing): boolean {
  const c = data.condition;
  return (
    (data.year !== undefined && Number.isFinite(data.year)) ||
    nonEmpty(data.make) ||
    nonEmpty(data.model) ||
    nonEmpty(data.trim) ||
    nonEmpty(resolveBodyStyle(data)) ||
    nonEmpty(resolveDrivetrain(data)) ||
    nonEmpty(resolveTransmission(data)) ||
    nonEmpty(data.engine) ||
    nonEmpty(resolveFuelType(data)) ||
    (data.mpgCity != null && Number.isFinite(data.mpgCity)) ||
    (data.mpgHighway != null && Number.isFinite(data.mpgHighway)) ||
    nonEmpty(resolveExteriorColor(data)) ||
    nonEmpty(resolveInteriorColor(data)) ||
    (data.doors !== undefined && Number.isFinite(data.doors)) ||
    (data.seats !== undefined && Number.isFinite(data.seats)) ||
    c !== undefined ||
    nonEmpty(resolveTitleStatus(data)) ||
    nonEmpty(data.vin) ||
    nonEmpty(data.stockNumber) ||
    (data.mileage !== undefined && Number.isFinite(data.mileage))
  );
}

export function hasSidebarCta(data: AutoDealerListing): boolean {
  return (
    (data.price !== undefined && Number.isFinite(data.price)) ||
    nonEmpty(data.monthlyEstimate ?? undefined) ||
    nonEmpty(data.city) ||
    nonEmpty(data.state) ||
    nonEmpty(data.dealerWebsite ?? undefined)
  );
}

export function hasDealerCard(data: AutoDealerListing): boolean {
  const soc = data.dealerSocials ?? {};
  const hasHours = filterDealerHoursForDisplay(data.dealerHours).length > 0;
  const hasRating = sanitizeDealerRating(data.dealerRating) !== undefined;
  const hasReviews = sanitizeReviewCount(data.dealerReviewCount) !== undefined;
  return (
    nonEmpty(data.dealerName) ||
    Boolean(data.dealerLogo) ||
    nonEmpty(resolveDealerOfficePhone(data)) ||
    nonEmpty(data.dealerWhatsapp ?? undefined) ||
    Boolean(resolveDealerBookingHref(data)) ||
    nonEmpty(data.dealerAddress) ||
    hasHours ||
    nonEmpty(data.dealerWebsite ?? undefined) ||
    Object.values(soc).some((u) => nonEmpty(u) && Boolean(safeExternalHref(u))) ||
    hasRating ||
    hasReviews
  );
}

export function hasDescriptionSection(data: AutoDealerListing): boolean {
  return nonEmpty(data.description);
}

export function hasHighlightsSection(data: AutoDealerListing): boolean {
  return (data.features ?? []).some((f) => nonEmpty(f));
}
