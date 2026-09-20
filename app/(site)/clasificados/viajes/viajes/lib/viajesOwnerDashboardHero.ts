import { isViajesDurableHttpsUrl } from "./v2/viajesMediaDurableGuards";
import { normalizeViajesOfferToV2 } from "./v2/normalizeViajesOfferToV2";
import { getViajesHeroAsset, getViajesResultsCardAsset } from "./v2/viajesOfferV2Validation";
import type { ViajesStagedLane, ViajesStagedListingRow } from "./viajesStagedListingTypes";

/** Resolve truthful dashboard hero: row URL → durable V2 hero → durable results card. */
export function resolveViajesOwnerDashboardHero(row: Pick<ViajesStagedListingRow, "hero_image_url" | "listing_json" | "lane" | "lang">): {
  src: string | null;
  alt: string;
} {
  const rowHero = (row.hero_image_url ?? "").trim();
  if (isViajesDurableHttpsUrl(rowHero)) {
    return { src: rowHero, alt: "Viajes listing" };
  }
  try {
    const offer = normalizeViajesOfferToV2(row.listing_json, {
      locale: row.lang === "en" ? "en" : "es",
      laneHint: (row.lane as ViajesStagedLane) || "business",
    });
    const hero = getViajesHeroAsset(offer.media.images);
    if (hero && isViajesDurableHttpsUrl(hero.url)) {
      return { src: hero.url.trim(), alt: hero.alt || offer.basics.title || "Viajes listing" };
    }
    const card = getViajesResultsCardAsset(offer.media.images);
    if (card && isViajesDurableHttpsUrl(card.url)) {
      return { src: card.url.trim(), alt: card.alt || offer.basics.title || "Viajes listing" };
    }
  } catch {
    /* ignore parse errors — no-image fallback */
  }
  return { src: null, alt: "Viajes listing" };
}
