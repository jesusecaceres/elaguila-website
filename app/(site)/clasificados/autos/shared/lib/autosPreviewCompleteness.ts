import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { deriveHeroImageUrls } from "@/app/clasificados/autos/negocios/lib/autoDealerHeroImages";
import { hasListingVideo } from "@/app/clasificados/autos/negocios/lib/autoDealerVideo";
import { buildVehicleTitle } from "@/app/publicar/autos/negocios/lib/autoDealerTitle";

export type AutosPreviewLane = "negocios" | "privado";

/**
 * Structural minimum so preview shells (hero, title band, contact) are not empty or misleading.
 * Lane differences:
 * - Negocios: business identity (name or primary phone) expected for dealer CTAs.
 * - Privado: lighter — seller must expose at least one contact path when messaging is on, else phone/WhatsApp/email.
 */
export type AutosPreviewCompletenessKey =
  | "media"
  | "title"
  | "price"
  | "location"
  | "dealerIdentity"
  | "sellerContact";

export function getAutosPreviewCompletenessIssues(lane: AutosPreviewLane, listing: AutoDealerListing): AutosPreviewCompletenessKey[] {
  const missing: AutosPreviewCompletenessKey[] = [];

  const hasMedia = deriveHeroImageUrls(listing).length > 0 || hasListingVideo(listing);
  if (!hasMedia) missing.push("media");

  const autoTitle = buildVehicleTitle(listing.year, listing.make, listing.model, listing.trim);
  const hasTitle = Boolean(listing.vehicleTitle?.trim()) || Boolean(autoTitle?.trim());
  if (!hasTitle) missing.push("title");

  const hasPrice =
    (listing.price !== undefined && Number.isFinite(listing.price)) || Boolean(listing.monthlyEstimate?.trim());
  if (!hasPrice) missing.push("price");

  const hasLocation =
    Boolean(listing.city?.trim()) && Boolean(listing.state?.trim()) && Boolean(listing.zip?.trim());
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
