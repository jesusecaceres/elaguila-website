import type { ServiciosLang, ServiciosProfileResolved } from "@/app/(site)/servicios/types/serviciosBusinessProfile";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import { relabelServiciosCanonicalPresets } from "@/app/(site)/servicios/lib/serviciosTranslateAd";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";
import { formatServiciosPublicLocationLine } from "./formatServiciosPublicLocationLine";

/**
 * Canonical Trade presentation profile — shared by preview, public detail, and results cards.
 *
 * ⚠️38A — RESULTS presentation (the `row` branch) re-labels CANONICAL preset content (category line,
 * preset services / reasons / highlights / quick facts / language badges) in the viewer's locale via
 * the pure catalog map; business name, custom text, literals, ids and slug are untouched. The
 * `profile` / `previewProfile` branches (detail / preview shells) are NOT relabeled — owner-authored
 * detail content stays original until the user presses Translate Ad.
 */
export function mapServiciosTradePresentationProfile(
  input: {
    profile?: ServiciosProfileResolved | null;
    previewProfile?: ServiciosProfileResolved | null;
    row?: ServiciosPublicListingRow | null;
    lang: ServiciosLang;
  },
): ServiciosProfileResolved | null {
  const direct = input.profile ?? input.previewProfile;
  if (direct) return direct;
  if (!input.row) return null;
  const wire = { ...input.row.profile_json };
  wire.identity = { ...wire.identity, leonixVerified: input.row.leonix_verified === true };
  if (
    (input.row.review_rating_count ?? 0) > 0 &&
    typeof input.row.review_rating_avg === "number" &&
    Number.isFinite(input.row.review_rating_avg)
  ) {
    wire.hero = {
      ...wire.hero,
      rating: input.row.review_rating_avg,
      reviewCount: input.row.review_rating_count ?? undefined,
    };
  }
  return relabelServiciosCanonicalPresets(resolveServiciosProfile(wire, input.lang), input.lang);
}

export function serviciosTradePresentationLocationLine(
  profile: ServiciosProfileResolved,
  row?: ServiciosPublicListingRow | null,
): string {
  const structured = row ? formatServiciosPublicLocationLine(row) : "";
  const cityFallback = (row?.city || "").trim();
  return (
    structured ||
    (profile.hero.locationSummary || "").trim() ||
    cityFallback
  );
}
