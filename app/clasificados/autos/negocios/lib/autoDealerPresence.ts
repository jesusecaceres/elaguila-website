import type { AutoDealerListing } from "../types/autoDealerListing";

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

export function hasHeroMedia(data: AutoDealerListing): boolean {
  const imgs = data.heroImages ?? [];
  return imgs.length > 0 || nonEmpty(data.videoUrl ?? undefined);
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
    nonEmpty(data.bodyStyle) ||
    nonEmpty(data.drivetrain) ||
    nonEmpty(data.transmission) ||
    nonEmpty(data.engine) ||
    nonEmpty(data.fuelType) ||
    (data.mpgCity != null && Number.isFinite(data.mpgCity)) ||
    (data.mpgHighway != null && Number.isFinite(data.mpgHighway)) ||
    nonEmpty(data.exteriorColor) ||
    nonEmpty(data.interiorColor) ||
    (data.doors !== undefined && Number.isFinite(data.doors)) ||
    (data.seats !== undefined && Number.isFinite(data.seats)) ||
    c !== undefined ||
    nonEmpty(data.titleStatus) ||
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
  return (
    nonEmpty(data.dealerName) ||
    Boolean(data.dealerLogo) ||
    nonEmpty(data.dealerPhone) ||
    nonEmpty(data.dealerAddress) ||
    (data.dealerHours ?? []).length > 0 ||
    nonEmpty(data.dealerWebsite ?? undefined) ||
    Object.values(soc).some((u) => nonEmpty(u)) ||
    (data.dealerRating !== undefined && Number.isFinite(data.dealerRating)) ||
    (data.dealerReviewCount !== undefined && Number.isFinite(data.dealerReviewCount))
  );
}

export function hasDescriptionSection(data: AutoDealerListing): boolean {
  return nonEmpty(data.description);
}

export function hasHighlightsSection(data: AutoDealerListing): boolean {
  return (data.features ?? []).some((f) => nonEmpty(f));
}
