import { isRestauranteIdbRef } from "./restauranteDraftMedia";

/** True if string is usable as a gallery/general image src (data URL or remote). */
export function isRestauranteDisplayableImageRef(s: string | undefined | null): boolean {
  if (typeof s !== "string") return false;
  const t = s.trim();
  if (!t) return false;
  if (/^data:image\//i.test(t)) return true;
  if (/^https?:\/\//i.test(t)) return true;
  return false;
}

/**
 * True when the ref may be sent on the wire in `POST .../publish` (no data/blob/IDB placeholders).
 * Align with `buildRestaurantePublishPayload` + API heavy-string rules.
 */
export function isRestaurantePublishableRemoteImageRef(s: string | undefined | null): boolean {
  if (typeof s !== "string") return false;
  const t = s.trim();
  if (!t) return false;
  if (isRestauranteIdbRef(t)) return false;
  if (/^data:image\//i.test(t) || t.startsWith("blob:")) return false;
  if (/^https?:\/\//i.test(t)) return t.length <= 2048;
  return false;
}

/** Draft may still hold local/IDB-backed media that previews OK but must be uploaded before publish. */
export function isRestauranteDraftStagedImageRef(s: string | undefined | null): boolean {
  if (typeof s !== "string") return false;
  const t = s.trim();
  if (!t) return false;
  if (isRestauranteIdbRef(t)) return true;
  return isRestauranteDisplayableImageRef(t);
}

export type RestaurantePublishImageGateMode = "draft" | "transport";

function firstBucketByPredicate(
  d: {
    foodImages?: string[] | undefined;
    interiorImages?: string[] | undefined;
    exteriorImages?: string[] | undefined;
  },
  pred: (u: string) => boolean,
): string | undefined {
  for (const arr of [d.foodImages, d.interiorImages, d.exteriorImages]) {
    const hit = (arr ?? []).find((u) => typeof u === "string" && pred(u));
    if (hit) return hit.trim();
  }
  return undefined;
}

/** First displayable image in venue buckets (comida / interior / exterior), in that order. */
export function firstRestauranteBucketImageRef(d: {
  foodImages?: string[] | undefined;
  interiorImages?: string[] | undefined;
  exteriorImages?: string[] | undefined;
}): string | undefined {
  return firstBucketByPredicate(d, (u) => isRestauranteDisplayableImageRef(u));
}

/** Bucket fallback for publish transport vs in-browser draft staging. */
export function firstRestauranteBucketImageRefForMode(
  d: {
    foodImages?: string[] | undefined;
    interiorImages?: string[] | undefined;
    exteriorImages?: string[] | undefined;
  },
  mode: RestaurantePublishImageGateMode,
): string | undefined {
  const pred = mode === "transport" ? isRestaurantePublishableRemoteImageRef : isRestauranteDraftStagedImageRef;
  return firstBucketByPredicate(d, pred);
}

/** True if value looks like an accepted local video data URL. */
export function isRestauranteLocalVideoDataUrl(s: string | undefined | null): boolean {
  if (typeof s !== "string") return false;
  const t = s.trim();
  return t.startsWith("data:video") || /^data:video\//i.test(t);
}
