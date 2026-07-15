import type { ServiciosLang, ServiciosProfileResolved } from "@/app/(site)/servicios/types/serviciosBusinessProfile";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";
import { formatServiciosPublicLocationLine } from "./formatServiciosPublicLocationLine";

/** Canonical Trade presentation profile — shared by preview, public detail, and results cards. */
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
  return resolveServiciosProfile(wire, input.lang);
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
