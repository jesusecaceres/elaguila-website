import type { ViajesBusinessResult } from "../../data/viajesResultsSampleData";
import type { ViajesStagedListingRow } from "../viajesStagedListingTypes";
import {
  viajesBudgetBandFromTag,
  viajesDestSlugsFromDestinationLabel,
  viajesDurationKeyFromDraft,
  viajesSeasonKeysFromDraft,
  viajesServiceLanguageKeysFromDraft,
} from "../viajesDraftToPublicBrowseFacets";
import type { ViajesOfferModelV2 } from "./viajesOfferModelV2";
import { normalizeViajesOfferToV2 } from "./normalizeViajesOfferToV2";
import { getViajesResultsCardAsset, getViajesHeroAsset } from "./viajesOfferV2Validation";
import { viajesOfferKindToLegacyTripKeys } from "./viajesOfferKindMap";
import { isViajesDurableHttpsUrl } from "./viajesMediaDurableGuards";
import { normalizeViajesSanJoseCaliforniaLabel } from "../viajesPublicLocation";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=80";

export function mapViajesOfferV2ToBrowseResult(
  offer: ViajesOfferModelV2,
  row: Pick<
    ViajesStagedListingRow,
    "id" | "slug" | "title" | "published_at" | "submitted_at" | "created_at" | "hero_image_url" | "submitter_name" | "lane" | "business_profile_slug"
  >
): ViajesBusinessResult {
  const hero = getViajesHeroAsset(offer.media.images);
  const card = getViajesResultsCardAsset(offer.media.images);
  const img =
    row.hero_image_url?.trim() ||
    (card && isViajesDurableHttpsUrl(card.url) ? card.url : "") ||
    (hero && isViajesDurableHttpsUrl(hero.url) ? hero.url : "") ||
    FALLBACK_HERO;
  const title = offer.basics.title.trim() || row.title;
  const dest = offer.basics.destinationLabel.trim() || offer.locations.destination.city || "—";
  const audienceKeys: string[] = [];
  if (offer.basics.audienceFamilies) audienceKeys.push("familias");
  if (offer.basics.audienceCouples) audienceKeys.push("parejas");
  if (offer.basics.audienceGroups) audienceKeys.push("grupos");

  const profileSlug =
    row.business_profile_slug?.trim() ||
    offer.provider.profileRoute
      .trim()
      .split("/")
      .filter(Boolean)
      .pop() ||
    "";

  return {
    kind: "business",
    sellerLane: row.lane === "private" || offer.lane === "private" ? "private" : "business",
    id: row.id,
    slug: row.slug,
    ...(profileSlug ? { businessProfileSlug: profileSlug } : {}),
    imageSrc: img,
    imageAlt: card?.alt || hero?.alt || title,
    businessName:
      offer.lane === "private"
        ? offer.contact.displayName.trim() || row.submitter_name?.trim() || "—"
        : offer.provider.name.trim() || offer.contact.displayName.trim() || row.submitter_name?.trim() || "—",
    offerTitle: title,
    destination: dest,
    destSlugs: viajesDestSlugsFromDestinationLabel(dest),
    departureCity: normalizeViajesSanJoseCaliforniaLabel(
      offer.basics.departureLabel.trim() || offer.locations.departureMeetingPort.city || "—"
    ),
    duration: normalizeViajesSanJoseCaliforniaLabel(offer.basics.durationLabel.trim() || "—"),
    price: offer.pricing.priceFrom.trim() || "—",
    includedSummary: offer.inclusions
      .map((p) => p.label)
      .filter(Boolean)
      .join(" · ")
      .slice(0, 180),
    whatsapp: (offer.contact.whatsappRaw || offer.contact.whatsapp || offer.provider.whatsappRaw || "").trim() || undefined,
    href: `/clasificados/viajes/oferta/${row.slug}`,
    tripTypeKeys: viajesOfferKindToLegacyTripKeys(offer.offerKind),
    publishedAt: row.published_at || row.submitted_at || row.created_at,
    audienceKeys,
    budgetBand: offer.pricing.budgetBand || viajesBudgetBandFromTag(""),
    durationKey: viajesDurationKeyFromDraft(offer.basics.durationLabel, offer.schedule.startDate, offer.schedule.endDate),
    seasonKeys: viajesSeasonKeysFromDraft(offer.schedule.startDate, offer.schedule.endDate, offer.schedule.note),
    serviceLanguageKeys: viajesServiceLanguageKeysFromDraft(
      offer.basics.spanishGuide,
      offer.basics.serviceLanguage
    ),
    discovery: { featuredBase: 46, sourceTrust: 1, completeness: 0.8 },
  };
}

export function mapViajesStagedRowToViajesBusinessResultV2(row: ViajesStagedListingRow): ViajesBusinessResult | null {
  const offer = normalizeViajesOfferToV2(row.listing_json, {
    locale: row.lang === "en" ? "en" : "es",
    laneHint: row.lane,
  });
  if (!offer.basics.title.trim() && !row.title.trim()) return null;
  return mapViajesOfferV2ToBrowseResult(offer, row);
}
