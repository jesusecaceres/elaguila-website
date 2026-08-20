import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { deriveHeroImageUrls } from "@/app/clasificados/autos/negocios/lib/autoDealerHeroImages";
import { hasListingVideo } from "@/app/clasificados/autos/negocios/lib/autoDealerVideo";
import { buildVehicleTitle } from "@/app/publicar/autos/negocios/lib/autoDealerTitle";
import { hasPrivadoPreviewLocation } from "@/app/clasificados/autos/privado/lib/autosPrivadoLocationReady";
import { AUTOS_DEFAULT_STATE } from "@/app/lib/clasificados/autos/autosLocationContract";

export type AutosPreviewLane = "negocios" | "privado";

/**
 * Structural minimum so preview shells (hero, title band, contact) are not empty or misleading.
 * Lane differences:
 * - Negocios: business identity (name or primary phone) expected for dealer CTAs.
 * - Privado: lighter — seller must expose at least one of phone, WhatsApp, or email.
 */
export type AutosPreviewCompletenessKey =
  | "media"
  | "title"
  | "price"
  | "location"
  | "dealerIdentity"
  | "sellerContact";

function hasNonEmptyText(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * The US state <select> displays AUTOS_DEFAULT_STATE when draft state is empty,
 * so completeness must treat that visible default as present.
 */
function effectiveUsState(state: string | undefined | null): string {
  const t = typeof state === "string" ? state.trim() : "";
  return t || AUTOS_DEFAULT_STATE;
}

function hasCityStateZip(
  city: string | undefined | null,
  state: string | undefined | null,
  zip: string | undefined | null,
  opts?: { defaultUsState?: boolean },
): boolean {
  const stateValue = opts?.defaultUsState ? effectiveUsState(state) : typeof state === "string" ? state.trim() : "";
  return hasNonEmptyText(city) && hasNonEmptyText(stateValue) && hasNonEmptyText(zip);
}

/** Negocios location lives on dealer structured address and/or vehicle city/state/ZIP. */
export function listingHasAutosNegociosPreviewLocation(listing: AutoDealerListing): boolean {
  const hasDealerLocation = hasCityStateZip(
    listing.dealerAddressCity,
    listing.dealerAddressState,
    listing.dealerAddressZip,
    { defaultUsState: true },
  );
  const hasVehicleLocation = hasCityStateZip(listing.city, listing.state, listing.zip, { defaultUsState: true });
  return hasDealerLocation || hasVehicleLocation;
}

export function getAutosPreviewCompletenessIssues(lane: AutosPreviewLane, listing: AutoDealerListing): AutosPreviewCompletenessKey[] {
  const missing: AutosPreviewCompletenessKey[] = [];

  const hasMedia = deriveHeroImageUrls(listing).length > 0 || hasListingVideo(listing);
  if (!hasMedia) missing.push("media");

  const autoTitle = buildVehicleTitle(listing.year, listing.make, listing.model, listing.trim);
  const hasTitle = Boolean(listing.vehicleTitle?.trim()) || Boolean(autoTitle?.trim());
  if (!hasTitle) missing.push("title");

  if (lane === "privado") {
    const hasUsdPrice = listing.price !== undefined && Number.isFinite(listing.price);
    if (!hasUsdPrice) missing.push("price");
  } else {
    const hasPrice =
      (listing.price !== undefined && Number.isFinite(listing.price)) || Boolean(listing.monthlyEstimate?.trim());
    if (!hasPrice) missing.push("price");
  }

  const hasLocation =
    lane === "negocios"
      ? listingHasAutosNegociosPreviewLocation(listing)
      : hasPrivadoPreviewLocation(listing);
  if (!hasLocation) missing.push("location");

  if (lane === "negocios") {
    const hasDealer =
      Boolean(listing.dealerName?.trim()) ||
      Boolean(listing.dealerPhoneOffice?.trim() || listing.dealerPhone?.trim()) ||
      Boolean(listing.dealerLogo);
    if (!hasDealer) missing.push("dealerIdentity");
  } else {
    const hasPhone = Boolean(listing.dealerPhoneOffice?.trim() || listing.dealerPhone?.trim());
    const hasMobile = Boolean(listing.dealerPhoneMobile?.trim());
    const hasWa = Boolean(listing.dealerWhatsapp?.trim());
    const hasEmail = Boolean(listing.dealerEmail?.trim());
    if (!hasPhone && !hasMobile && !hasWa && !hasEmail) missing.push("sellerContact");
  }

  return missing;
}

export function isAutosPreviewStructurallyComplete(lane: AutosPreviewLane, listing: AutoDealerListing): boolean {
  return getAutosPreviewCompletenessIssues(lane, listing).length === 0;
}

/** Step indices match `getAutosApplicationStepLabels` order (0–6). */
export function mapAutosPreviewIssueToStep(issue: AutosPreviewCompletenessKey, lane: AutosPreviewLane = "privado"): number {
  switch (issue) {
    case "media":
      return 3;
    case "title":
    case "price":
      return 0;
    case "location":
      return lane === "negocios" ? 4 : 0;
    case "dealerIdentity":
    case "sellerContact":
      return 4;
    default:
      return 0;
  }
}

/** Distinct steps that still have blocking gaps (sorted). */
export function getAutosPreviewBlockingStepIndices(lane: AutosPreviewLane, listing: AutoDealerListing): number[] {
  const issues = getAutosPreviewCompletenessIssues(lane, listing);
  const set = new Set(issues.map((i) => mapAutosPreviewIssueToStep(i, lane)));
  return [...set].sort((a, b) => a - b);
}

/** Earliest step in the flow that still has a blocking issue (for jump-to-fix). */
export function getFirstBlockingStepIndex(lane: AutosPreviewLane, listing: AutoDealerListing): number | null {
  const steps = getAutosPreviewBlockingStepIndices(lane, listing);
  if (steps.length === 0) return null;
  return steps[0] ?? null;
}
