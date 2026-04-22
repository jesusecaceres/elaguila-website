import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosReviewRow } from "./serviciosOpsTablesServer";

/** Merge moderated approved reviews into the wire profile and refresh hero aggregates from DB truth. */
export function mergeServiciosProfileWithApprovedDbReviews(
  wire: ServiciosBusinessProfile,
  dbReviews: ServiciosReviewRow[],
): ServiciosBusinessProfile {
  if (!dbReviews.length) return wire;
  const next: ServiciosBusinessProfile = {
    ...wire,
    hero: { ...wire.hero },
    reviews: [...(wire.reviews ?? [])],
  };
  const fromDb = dbReviews.map((r) => ({
    id: `lx-db-${r.id}`,
    authorName: r.author_name,
    quote: r.body,
    rating: r.rating,
  }));
  const existing = next.reviews ?? [];
  next.reviews = [...fromDb, ...existing];
  const sum = dbReviews.reduce((a, r) => a + r.rating, 0);
  next.hero = {
    ...next.hero,
    rating: sum / dbReviews.length,
    reviewCount: dbReviews.length,
  };
  return next;
}
