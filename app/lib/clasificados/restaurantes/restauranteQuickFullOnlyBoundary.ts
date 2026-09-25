/**
 * RESTAURANTES — Quick (Simple) vs Full field boundary, as ONE pure, server-safe module.
 *
 * Product lock: a Quick restaurant keeps ONE primary website and nothing else in the way of business links —
 * no extra website URLs, no social links, no Google Reviews / Yelp link, no reservation / order / menu / catering
 * inquiry links, no video and no coupons (coupons are stripped by the coupon entitlement gate in the publish
 * route). Full keeps every field it has today.
 *
 * The boundary RESTORES the value already stored on the row (instead of deleting it) and otherwise empties the
 * field, so a listing that temporarily resolves Quick never loses its Full content, and a Quick save can never
 * ADD it. It is applied ONLY for a proven Quick product (`quickFullOnlyBoundaryApplies`), never for `unverified`.
 *
 * Pure: no IO, no React. Safe for the publish route and for node:assert verifiers.
 */
import {
  applyQuickFullOnlyBoundary,
  quickFullOnlyBoundaryApplies,
} from "@/app/lib/quickBusiness/quickFullOnlyBoundary";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";

export { quickFullOnlyBoundaryApplies };

/** Dotted draft paths a Quick restaurant may not carry. The primary `websiteUrl` is deliberately NOT here. */
export const RESTAURANTE_QUICK_FULL_ONLY_PATHS = [
  "additionalWebsites",
  "instagramUrl",
  "facebookUrl",
  "tiktokUrl",
  "youtubeUrl",
  "snapchatUrl",
  "xTwitterUrl",
  "googleReviewUrl",
  "yelpReviewUrl",
  "externalRatingValue",
  "externalReviewCount",
  "reservationUrl",
  "orderUrl",
  "menuUrl",
  "videoUrls",
  "videoUrl",
  "videoFile",
  "cateringEventsStack.cateringInquiryUrl",
] as const;

type Json = Record<string, unknown>;

function isPlainObject(value: unknown): value is Json {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasContent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return value;
  if (isPlainObject(value)) return Object.keys(value).length > 0;
  return true;
}

function getPath(obj: unknown, parts: readonly string[]): unknown {
  let cur: unknown = obj;
  for (const part of parts) {
    if (!isPlainObject(cur)) return undefined;
    cur = cur[part];
  }
  return cur;
}

/** Seed `value` at a dotted path (creating parents) — used only to make an absent incoming field restorable. */
function seedPath(obj: Json, parts: readonly string[], value: unknown): void {
  let cur: Json = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const next = cur[parts[i]!];
    if (isPlainObject(next)) {
      cur = next;
    } else {
      const created: Json = {};
      cur[parts[i]!] = created;
      cur = created;
    }
  }
  cur[parts[parts.length - 1]!] = structuredClone(value);
}

export type RestauranteQuickBoundaryResult = {
  draft: RestauranteListingDraft;
  changedPaths: string[];
};

/**
 * Apply the Quick boundary to a sanitized Restaurantes draft.
 * `existing` is the `listing_json` already stored on the row being edited (null for a brand-new listing).
 */
export function applyRestauranteQuickBoundary(
  draft: RestauranteListingDraft,
  existing: Json | null | undefined,
): RestauranteQuickBoundaryResult {
  const incoming = structuredClone(draft) as unknown as Json;

  // A field the browser OMITTED but the row already holds must survive the save (the write replaces the whole
  // listing_json): seed it from the stored value so the boundary restores it instead of dropping it.
  for (const path of RESTAURANTE_QUICK_FULL_ONLY_PATHS) {
    const parts = path.split(".");
    if (getPath(incoming, parts) !== undefined) continue;
    const stored = existing ? getPath(existing, parts) : undefined;
    if (hasContent(stored)) seedPath(incoming, parts, stored);
  }

  const applied = applyQuickFullOnlyBoundary({
    incoming,
    existing: existing ?? null,
    paths: RESTAURANTE_QUICK_FULL_ONLY_PATHS,
  });
  const out = applied.value as Json;
  const changedPaths = [...applied.changedPaths];

  // Featured dish menu links are per-dish extra menu URLs: restore the stored link for the same dish (by
  // title), otherwise drop it.
  if (Array.isArray(out.featuredDishes)) {
    const storedDishes = Array.isArray(existing?.featuredDishes) ? (existing!.featuredDishes as Json[]) : [];
    let touched = false;
    out.featuredDishes = (out.featuredDishes as Json[]).map((dish) => {
      if (!isPlainObject(dish) || !hasContent(dish.menuLink)) return dish;
      const title = typeof dish.title === "string" ? dish.title.trim() : "";
      const stored = storedDishes.find(
        (d) => isPlainObject(d) && typeof d.title === "string" && d.title.trim() === title,
      );
      const restored = stored && hasContent(stored.menuLink) ? stored.menuLink : undefined;
      if (restored === dish.menuLink) return dish;
      touched = true;
      const next: Json = { ...dish };
      if (restored === undefined) delete next.menuLink;
      else next.menuLink = restored;
      return next;
    });
    if (touched) changedPaths.push("featuredDishes.menuLink");
  }

  // A video marker left in the mixed gallery order with no video behind it would render an empty slot.
  const hasVideo = hasContent(out.videoUrls) || hasContent(out.videoUrl) || hasContent(out.videoFile);
  if (!hasVideo && Array.isArray(out.galleryMediaSequence) && out.galleryMediaSequence.includes("v")) {
    out.galleryMediaSequence = (out.galleryMediaSequence as unknown[]).filter((x) => x !== "v");
    changedPaths.push("galleryMediaSequence");
  }

  return { draft: out as unknown as RestauranteListingDraft, changedPaths };
}

/**
 * Every stored/incoming image reference that counts toward the Quick photo cap: hero + gallery + the three
 * buckets. The logo is deliberately excluded (it is not a listing photo).
 */
export function countRestauranteQuickPhotos(draft: {
  heroImage?: unknown;
  galleryImages?: unknown;
  foodImages?: unknown;
  interiorImages?: unknown;
  exteriorImages?: unknown;
}): number {
  const one = (v: unknown) => (typeof v === "string" ? (v.trim() ? 1 : 0) : v ? 1 : 0);
  const many = (v: unknown) => (Array.isArray(v) ? v.reduce<number>((n, x) => n + one(x), 0) : 0);
  return (
    one(draft.heroImage) +
    many(draft.galleryImages) +
    many(draft.foodImages) +
    many(draft.interiorImages) +
    many(draft.exteriorImages)
  );
}
